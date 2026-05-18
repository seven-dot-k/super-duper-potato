"use client";

import type { UIMessage, UIMessageChunk } from "ai";
import { WorkflowChatTransport } from "@workflow/ai";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { OrderInfoCard } from "@/components/chat/order-info-card";
import { ProductSearchResultsCard } from "@/components/chat/product-search-results-card";
import { useStorefrontChat } from "@/hooks/use-storefront-chat";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import type {
  DataCartAbandonmentDebug,
  DataCartAbandonmentScheduled,
  DataOrderInfo,
  DataProductSearchResults,
} from "@/lib/schemas/data-parts";
import { Bell, Bot, Check, CircleAlert, ExternalLink, LoaderCircle, PackageSearch, ReceiptText, RotateCcw, SendIcon, ShoppingCart, UserRoundCog, Wrench, X } from "lucide-react";

function isOrderInfoPart(part: unknown): part is { type: "data-workflow"; data: DataOrderInfo["data"] & { type: "order-info" } } {
  if (typeof part !== "object" || part === null) return false;
  const candidate = part as { type?: unknown; data?: { type?: unknown } };
  return candidate.type === "data-workflow" && candidate.data?.type === "order-info";
}

function isCartAbandonmentScheduledPart(
  part: unknown,
): part is {
  type: "data-workflow";
  data: DataCartAbandonmentScheduled["data"];
} {
  if (typeof part !== "object" || part === null) return false;
  const candidate = part as { type?: unknown; data?: { type?: unknown } };
  return candidate.type === "data-workflow" && candidate.data?.type === "cart-abandonment-scheduled";
}

function isProductSearchResultsPart(
  part: unknown,
): part is {
  type: "data-workflow";
  data: DataProductSearchResults["data"];
} {
  if (typeof part !== "object" || part === null) return false;
  const candidate = part as { type?: unknown; data?: { type?: unknown } };
  return candidate.type === "data-workflow" && candidate.data?.type === "product-search-results";
}

function isCartAbandonmentDebugPart(
  part: unknown,
): part is {
  type: "data-workflow";
  data: DataCartAbandonmentDebug["data"];
} {
  if (typeof part !== "object" || part === null) return false;
  const candidate = part as { type?: unknown; data?: { type?: unknown } };
  return candidate.type === "data-workflow" && candidate.data?.type === "cart-abandonment-debug";
}

function isAgentSwitchPart(
  part: unknown,
): part is {
  type: "data-workflow";
  data: {
    type: "agent-switch";
    agentId: string;
    agentName: string;
    timestamp: number;
  };
} {
  if (typeof part !== "object" || part === null) return false;
  const candidate = part as {
    type?: unknown;
    data?: {
      type?: unknown;
      agentId?: unknown;
      agentName?: unknown;
    };
  };
  return (
    candidate.type === "data-workflow" &&
    candidate.data?.type === "agent-switch" &&
    typeof candidate.data.agentId === "string" &&
    typeof candidate.data.agentName === "string"
  );
}

interface ToolStatusPart {
  type: `tool-${string}` | "dynamic-tool";
  state?: string;
  title?: string;
  toolName?: string;
}

interface NotificationToast {
  id: string;
  title: string;
  description: string;
  body?: string;
  tone: "success" | "muted";
}

function getScheduledWorkflows(messages: UIMessage[]) {
  const scheduled = new Map<string, DataCartAbandonmentScheduled["data"]>();

  for (const message of messages) {
    for (const part of message.parts) {
      if (isCartAbandonmentScheduledPart(part)) {
        scheduled.set(part.data.workflowRunId, part.data);
      }
    }
  }

  return [...scheduled.values()];
}

function isToolStatusPart(part: unknown): part is ToolStatusPart {
  if (typeof part !== "object" || part === null) return false;
  const type = (part as { type?: unknown }).type;
  return type === "dynamic-tool" || (typeof type === "string" && type.startsWith("tool-"));
}

function formatToolName(name: string) {
  return name
    .replace(/^tool-/, "")
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getToolDisplayName(part: ToolStatusPart) {
  if (part.title) return part.title;
  if (part.type === "dynamic-tool") return formatToolName(part.toolName ?? "Tool");
  return formatToolName(part.type);
}

function ToolCallStatus({ part }: { part: ToolStatusPart }) {
  const isComplete = part.state === "output-available";
  const isError = part.state === "output-error" || part.state === "output-denied";
  const statusLabel = isComplete
    ? "Complete"
    : isError
      ? "Failed"
      : "Running";

  return (
    <div
      className="flex w-fit max-w-full items-center gap-2 rounded-md border border-border bg-muted/35 px-3 py-2 text-xs text-muted-foreground"
      role="status"
    >
      <Wrench className="size-3.5 shrink-0" />
      <span className="min-w-0 truncate font-medium text-foreground">
        {getToolDisplayName(part)}
      </span>
      <span className="sr-only">{statusLabel}</span>
      {isComplete ? (
        <Check className="size-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
      ) : isError ? (
        <CircleAlert className="size-3.5 shrink-0 text-destructive" aria-hidden="true" />
      ) : (
        <LoaderCircle className="size-3.5 shrink-0 animate-spin" aria-hidden="true" />
      )}
    </div>
  );
}

function AgentSwitchDebugMessage({
  agentId,
  agentName,
}: {
  agentId: string;
  agentName: string;
}) {
  return (
    <div className="flex w-fit max-w-full items-center gap-2 rounded-md border border-dashed border-border bg-muted/25 px-3 py-2 text-xs text-muted-foreground">
      <UserRoundCog className="size-3.5 shrink-0" />
      <span className="min-w-0 truncate">
        Debug: <span className="font-medium text-foreground">{agentName}</span> is handling this message
      </span>
      <span className="shrink-0 rounded bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
        {agentId}
      </span>
    </div>
  );
}

function CartAbandonmentDebugCard({
  data,
}: {
  data: DataCartAbandonmentScheduled["data"];
}) {
  return (
    <div className="mt-2 rounded-md border border-dashed border-border bg-muted/30 p-3 text-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-foreground">Cart abandonment workflow scheduled</p>
          <p className="mt-1 truncate text-muted-foreground">
            {data.workflowRunId} · {Math.round(data.delayMs / 1000)}s
          </p>
        </div>
        <a
          href={data.streamUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 font-medium text-foreground transition-colors hover:bg-accent"
        >
          Stream
          <ExternalLink className="size-3" />
        </a>
      </div>
    </div>
  );
}

function CartAbandonmentToast({
  toast,
  onDismiss,
}: {
  toast: NotificationToast;
  onDismiss: () => void;
}) {
  return (
    <div
      className="absolute bottom-20 right-3 z-20 w-[min(360px,calc(100%-1.5rem))] rounded-lg border border-border bg-card p-3 text-sm shadow-lg"
      role="status"
    >
      <div className="flex items-start gap-3">
        <div className={toast.tone === "success"
          ? "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-300"
          : "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground"}
        >
          <Bell className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">{toast.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{toast.description}</p>
          {toast.body && (
            <p className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-2 text-xs leading-5 text-foreground">
              {toast.body}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Dismiss notification"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

function AssistantActivityIndicator() {
  return (
    <Message from="assistant" aria-label="Assistant is responding">
      <MessageContent className="py-1">
        <div
          className="flex h-6 items-center gap-1 text-muted-foreground"
          role="status"
        >
          <span className="sr-only">Assistant is responding</span>
          <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-200ms]" />
          <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-100ms]" />
          <span className="size-1.5 animate-bounce rounded-full bg-current" />
        </div>
      </MessageContent>
    </Message>
  );
}

export function StorefrontChat() {
  const [input, setInput] = useState("");
  const [notificationToast, setNotificationToast] = useState<NotificationToast | null>(null);
  const params = useParams<{ sku: string }>();
  const watchedWorkflowRunIdsRef = useRef<Set<string>>(new Set());
  const monitorAbortControllersRef = useRef<Map<string, AbortController>>(new Map());

  const {
    messages,
    sendMessage,
    endSession,
    status,
    pendingMessage,
    isGenerating,
  } = useStorefrontChat({
    pageContext: {
      entity: "product",
      id: params.sku,
    },
  });

  const isBusy = status === "submitted" || isGenerating;

  useEffect(() => {
    if (!notificationToast) return;
    const timeout = setTimeout(() => setNotificationToast(null), 12_000);
    return () => clearTimeout(timeout);
  }, [notificationToast]);

  useEffect(() => {
    const abortControllers = monitorAbortControllersRef.current;
    return () => {
      for (const controller of abortControllers.values()) {
        controller.abort();
      }
      abortControllers.clear();
    };
  }, []);

  useEffect(() => {
    for (const scheduled of getScheduledWorkflows(messages)) {
      if (watchedWorkflowRunIdsRef.current.has(scheduled.workflowRunId)) continue;

      watchedWorkflowRunIdsRef.current.add(scheduled.workflowRunId);
      const controller = new AbortController();
      monitorAbortControllersRef.current.set(scheduled.workflowRunId, controller);

      void (async () => {
        try {
          const transport = new WorkflowChatTransport({
            prepareReconnectToStreamRequest: ({ ...rest }) => ({
              ...rest,
              api: scheduled.streamUrl,
            }),
            maxConsecutiveErrors: 1,
          });
          const stream = await transport.reconnectToStream({
            chatId: scheduled.workflowRunId,
            startIndex: 0,
            abortSignal: controller.signal,
          });
          if (!stream) return;

          const reader = stream.getReader();
          try {
            while (!controller.signal.aborted) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = value as UIMessageChunk;
              if (!isCartAbandonmentDebugPart(chunk)) continue;
              if (chunk.data.stage !== "completed") continue;

              if (chunk.data.status === "sent") {
                const channel = chunk.data.channel ?? "email";
                setNotificationToast({
                  id: `${chunk.data.workflowRunId}-sent`,
                  tone: "success",
                  title: `Mock ${channel.toUpperCase()} sent`,
                  description: chunk.data.recipient
                    ? `Recipient: ${chunk.data.recipient}`
                    : "Mock notification sent",
                  body: chunk.data.body ?? chunk.data.message,
                });
              } else {
                setNotificationToast({
                  id: `${chunk.data.workflowRunId}-skipped`,
                  tone: "muted",
                  title: "Mock notification skipped",
                  description: chunk.data.reason ?? chunk.data.message ?? "Cart abandonment workflow completed without sending.",
                });
              }
              break;
            }
          } finally {
            reader.releaseLock();
          }
        } catch (error) {
          if (!(error instanceof DOMException && error.name === "AbortError")) {
            console.error("Failed to monitor cart abandonment stream", error);
          }
        } finally {
          monitorAbortControllersRef.current.delete(scheduled.workflowRunId);
        }
      })();
    }
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || isBusy) return;
    await sendMessage(text);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void send(input);
    setInput("");
  };

  const handleEndSession = async () => {
    for (const controller of monitorAbortControllersRef.current.values()) {
      controller.abort();
    }
    monitorAbortControllersRef.current.clear();
    watchedWorkflowRunIdsRef.current.clear();
    setNotificationToast(null);
    await endSession();
  };

  const suggestions = [
    { icon: PackageSearch, text: "What are commonly asked questions about this product?" },
    { icon: ShoppingCart, text: "Add this item to my cart" },
    { icon: ReceiptText, text: "Check order ORD-10001" },
  ];

  return (
    <div className="relative flex h-full min-h-[560px] w-full min-w-0 flex-col overflow-hidden bg-background">
      <div className="shrink-0 border-b border-border px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Bot className="size-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold">Shopper Assistant</h2>
              <p className="truncate text-xs text-muted-foreground">
                Product help, order support, and cart actions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleEndSession()}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
            aria-label="Restart conversation"
            title="Restart conversation"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>
      </div>

      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="gap-5 p-4">
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<Bot className="size-8" />}
              title="How can I help?"
              description="Ask about this product, find the right item, check an order, or add to cart."
            >
              <div className="flex size-full flex-col justify-center gap-4 p-4 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-secondary">
                  <Bot className="size-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-medium">How can I help?</h3>
                  <p className="text-sm text-muted-foreground">
                    Ask about this product, find the right item, check an order, or add to cart.
                  </p>
                </div>
                <div className="grid gap-2">
                  {suggestions.map(({ icon: Icon, text }) => (
                    <button
                      key={text}
                      type="button"
                      onClick={() => void send(text)}
                      className="flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 py-2 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                      disabled={isBusy}
                    >
                      <Icon className="size-3.5 shrink-0" />
                      <span>{text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  {message.parts.map((part, i) => {
                    if (part.type === "text") {
                      return (
                        <MessageResponse key={`${message.id}-${i}`}>
                          {part.text}
                        </MessageResponse>
                      );
                    }
                    if (isToolStatusPart(part)) {
                      return (
                        <ToolCallStatus
                          key={`${message.id}-${i}`}
                          part={part}
                        />
                      );
                    }
                    if (isAgentSwitchPart(part)) {
                      return (
                        <AgentSwitchDebugMessage
                          key={`${message.id}-${i}`}
                          agentId={part.data.agentId}
                          agentName={part.data.agentName}
                        />
                      );
                    }
                    if (isOrderInfoPart(part)) {
                      return (
                        <OrderInfoCard
                          key={`${message.id}-${i}`}
                          data={part.data}
                        />
                      );
                    }
                    if (isProductSearchResultsPart(part)) {
                      return (
                        <ProductSearchResultsCard
                          key={`${message.id}-${i}`}
                          data={part.data}
                        />
                      );
                    }
                    if (isCartAbandonmentScheduledPart(part)) {
                      return (
                        <CartAbandonmentDebugCard
                          key={`${message.id}-${i}`}
                          data={part.data}
                        />
                      );
                    }
                    return null;
                  })}
                </MessageContent>
              </Message>
            ))
          )}
          {pendingMessage && (
            <Message from="user">
              <MessageContent>
                <MessageResponse>{pendingMessage}</MessageResponse>
              </MessageContent>
            </Message>
          )}
          {isBusy && <AssistantActivityIndicator />}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <form onSubmit={handleSubmit} className="w-full shrink-0 border-t border-border p-3">
        <div className="flex w-full items-end gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message Shopper Assistant..."
            className="min-h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <button
            type="submit"
            disabled={!input.trim() || isBusy}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            aria-label="Send message"
          >
            <SendIcon className="size-4" />
          </button>
        </div>
      </form>
      {notificationToast && (
        <CartAbandonmentToast
          toast={notificationToast}
          onDismiss={() => setNotificationToast(null)}
        />
      )}
    </div>
  );
}
