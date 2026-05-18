"use client";

import type { ChatStatus, UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { WorkflowChatTransport } from "@workflow/ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const STOREFRONT_STORAGE_KEY = "storefront-workflow-run-id";
const STOREFRONT_USER_ID_STORAGE_KEY = "storefront-user-id";

export interface StorefrontPageContext {
  url?: string;
  entity?: string;
  id?: string;
}

export interface StorefrontUserContext {
  userId: string;
}

function createUserId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (character) => {
    const value = Number(character);
    return (value ^ (Math.random() * 16) >> (value / 4)).toString(16);
  });
}

interface UserMessageData {
  type: "user-message";
  id: string;
  content: string;
  timestamp: number;
}

interface AssistantMessageData {
  type: "assistant-message";
  id: string;
  content: string;
  timestamp: number;
}

function isUserMessageMarker(
  part: unknown,
): part is { type: "data-workflow"; data: UserMessageData } {
  if (typeof part !== "object" || part === null) return false;
  const candidate = part as { type?: unknown; data?: { type?: unknown } };
  return candidate.type === "data-workflow" && candidate.data?.type === "user-message";
}

function isAssistantMessageMarker(
  part: unknown,
): part is { type: "data-workflow"; data: AssistantMessageData } {
  if (typeof part !== "object" || part === null) return false;
  const candidate = part as { type?: unknown; data?: { type?: unknown } };
  return candidate.type === "data-workflow" && candidate.data?.type === "assistant-message";
}

export interface UseStorefrontChatReturn {
  messages: UIMessage[];
  status: ChatStatus;
  isGenerating: boolean;
  error: Error | undefined;
  runId: string | null;
  pendingMessage: string | null;
  sendMessage: (text: string) => Promise<void>;
  endSession: () => Promise<void>;
}

export function useStorefrontChat({
  pageContext,
}: {
  pageContext: StorefrontPageContext;
}): UseStorefrontChatReturn {
  const [runId, setRunId] = useState<string | null>(null);
  const [shouldResume, setShouldResume] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const sentMessagesRef = useRef<Set<string>>(new Set());
  const sendCounterRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getUserId = useCallback(() => {

    // POC ONLY: our userContext is coming from the client side only
    // in a real implementation, this should be derived/authenticated from a secure source ( JWT, session cookie, etc. )
    // and loaded server side and in server components
    const storedUserId = localStorage.getItem(STOREFRONT_USER_ID_STORAGE_KEY);
    if (storedUserId) return storedUserId;

    const generatedUserId = createUserId();
    localStorage.setItem(STOREFRONT_USER_ID_STORAGE_KEY, generatedUserId);
    return generatedUserId;
  }, []);

  const getRequestContext = useCallback(() => {
    const url = typeof window === "undefined" ? pageContext.url : window.location.href;

    return {
      pageContext: {
        ...pageContext,
        url,
      },
      userContext: {
        userId: getUserId(),
      } satisfies StorefrontUserContext,
    };
  }, [getUserId, pageContext]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const sessionParam = params.get("shopperSession");
    const storedRunId = sessionParam || localStorage.getItem(STOREFRONT_STORAGE_KEY);
    if (!storedRunId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRunId(storedRunId);
    localStorage.setItem(STOREFRONT_STORAGE_KEY, storedRunId);
    setShouldResume(true);
  }, []);

  const transport = useMemo(
    () =>
      new WorkflowChatTransport({
        api: "/api/storefront-chat",
        onChatSendMessage: (response) => {
          const workflowRunId = response.headers.get("x-workflow-run-id");
          if (!workflowRunId) return;
          setRunId(workflowRunId);
          localStorage.setItem(STOREFRONT_STORAGE_KEY, workflowRunId);
        },
        onChatEnd: () => {
          setRunId(null);
          localStorage.removeItem(STOREFRONT_STORAGE_KEY);
          setPendingMessage(null);
        },
        prepareReconnectToStreamRequest: ({ ...rest }) => {
          const storedRunId = localStorage.getItem(STOREFRONT_STORAGE_KEY);
          if (!storedRunId) {
            throw new Error("No active storefront workflow run ID found");
          }
          return {
            ...rest,
            api: `/api/storefront-chat/${encodeURIComponent(storedRunId)}/stream`,
          };
        },
        maxConsecutiveErrors: 5,
      }),
    [],
  );

  const {
    messages: rawMessages,
    sendMessage: baseSendMessage,
    status,
    error,
    stop,
    setMessages,
  } = useChat({
    resume: shouldResume,
    transport,
    onError: () => {
      setPendingMessage(null);
    },
  });

  useEffect(() => {
    if (status !== "streaming") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsGenerating(false);
      return;
    }
    setIsGenerating(true);
    if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
    activityTimerRef.current = setTimeout(() => setIsGenerating(false), 1000);
    return () => {
      if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
    };
  }, [rawMessages, status]);

  const processed = useMemo(() => {
    const result: UIMessage[] = [];
    const seenMessageIds = new Set<string>();
    const userContentsFromStream = new Set<string>();

    for (const message of rawMessages) {
      if (message.role === "user") {
        continue;
      }

      if (message.role !== "assistant") {
        result.push(message);
        continue;
      }

      let currentAssistantParts: typeof message.parts = [];
      let partIndex = 0;

      for (const part of message.parts) {
        if (isUserMessageMarker(part)) {
          const marker = part.data;
          userContentsFromStream.add(marker.content);
          if (seenMessageIds.has(marker.id)) continue;
          seenMessageIds.add(marker.id);

          if (currentAssistantParts.length > 0) {
            result.push({
              ...message,
              id: `${message.id}-part-${partIndex++}`,
              parts: currentAssistantParts,
            });
            currentAssistantParts = [];
          }

          result.push({
            id: marker.id,
            role: "user",
            parts: [{ type: "text", text: marker.content }],
          } as UIMessage);
          continue;
        }

        if (isAssistantMessageMarker(part)) {
          const marker = part.data;
          if (seenMessageIds.has(marker.id)) continue;
          seenMessageIds.add(marker.id);

          if (currentAssistantParts.length > 0) {
            result.push({
              ...message,
              id: `${message.id}-part-${partIndex++}`,
              parts: currentAssistantParts,
            });
            currentAssistantParts = [];
          }

          result.push({
            id: marker.id,
            role: "assistant",
            parts: [{ type: "text", text: marker.content }],
          } as UIMessage);
          continue;
        }

        currentAssistantParts.push(part);
      }

      if (currentAssistantParts.length > 0) {
        result.push({
          ...message,
          id: partIndex > 0 ? `${message.id}-part-${partIndex}` : message.id,
          parts: currentAssistantParts,
        });
      }
    }

    return {
      messages: result,
      userContentsFromStream,
    };
  }, [rawMessages]);

  useEffect(() => {
    if (!pendingMessage) return;
    if (!processed.userContentsFromStream.has(pendingMessage)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPendingMessage(null);
  }, [pendingMessage, processed.userContentsFromStream]);

  const sendFollowUp = useCallback(
    async (text: string) => {
      if (!runId) {
        throw new Error("No active storefront session");
      }

      const sendKey = `${runId}-${text}-${++sendCounterRef.current}`;
      if (sentMessagesRef.current.has(sendKey)) {
        return;
      }
      sentMessagesRef.current.add(sendKey);

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await fetch(`/api/storefront-chat/${encodeURIComponent(runId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, ...getRequestContext() }),
        signal: controller.signal,
      });

      if (response.ok) return;

      sentMessagesRef.current.delete(sendKey);
      let details = "Failed to send follow-up message";
      try {
        const payload = await response.json();
        details = payload.details || payload.error || details;
      } catch {
        // Ignore parse errors and use generic details message.
      }
      throw new Error(details);
    },
    [getRequestContext, runId],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const cleaned = text.trim();
      if (!cleaned) return;

      setPendingMessage(cleaned);
      try {
        if (runId) {
          await sendFollowUp(cleaned);
          return;
        }
        await baseSendMessage(
          { text: cleaned },
          { body: getRequestContext() },
        );
      } catch (error) {
        setPendingMessage(null);
        throw error;
      }
    },
    [baseSendMessage, getRequestContext, runId, sendFollowUp],
  );

  const endSession = useCallback(async () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    const activeRunId = runId;

    setRunId(null);
    setShouldResume(false);
    localStorage.removeItem(STOREFRONT_STORAGE_KEY);
    sentMessagesRef.current.clear();
    setPendingMessage(null);
    setMessages([]);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("shopperSession")) {
        url.searchParams.delete("shopperSession");
        window.history.replaceState({}, "", url.toString());
      }
    }

    try {
      stop();
    } catch {
      // Expected AbortError for active stream shutdown.
    }

    if (!activeRunId) return;
    try {
      await fetch(`/api/storefront-chat/${encodeURIComponent(activeRunId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "/done" }),
      });
    } catch {
      // Best effort only.
    }
  }, [runId, setMessages, stop]);

  return {
    messages: processed.messages,
    status,
    isGenerating,
    error,
    runId,
    pendingMessage,
    sendMessage,
    endSession,
  };
}
