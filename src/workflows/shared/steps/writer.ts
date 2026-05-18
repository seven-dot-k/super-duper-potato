import type { UIMessageChunk } from "ai";
import type { CartAbandonmentWorkflowResult } from "../../cart-abandonment/workflow";

export interface TurnObservability {
  turnNumber: number;
  turnStartedAt: number;
  workflowRunId: string;
  workflowStartedAt: number;
  isFirstTurn: boolean;
}

export async function writeAgentSwitch(
  writable: WritableStream<UIMessageChunk>,
  agentId: string,
  agentName: string,
) {
  "use step";

  const writer = writable.getWriter();
  try {
    await writer.write({
      type: "data-workflow",
      data: {
        type: "agent-switch",
        agentId,
        agentName,
        timestamp: Date.now(),
      },
    } as UIMessageChunk);
  } finally {
    writer.releaseLock();
  }
}

export async function writeUserMessageMarker(
  writable: WritableStream<UIMessageChunk>,
  content: string,
  messageId: string,
  observability?: TurnObservability,
) {
  "use step";

  const writer = writable.getWriter();
  try {
    if (observability?.isFirstTurn) {
      await writer.write({
        type: "data-workflow",
        data: {
          type: "workflow-start",
          workflowRunId: observability.workflowRunId,
          workflowStartedAt: observability.workflowStartedAt,
          timestamp: Date.now(),
        },
      } as UIMessageChunk);
    }

    if (observability) {
      await writer.write({
        type: "data-workflow",
        data: {
          type: "turn-start",
          turnNumber: observability.turnNumber,
          timestamp: Date.now(),
        },
      } as UIMessageChunk);
    }

    await writer.write({
      type: "data-workflow",
      data: {
        type: "user-message",
        id: messageId,
        content,
        timestamp: Date.now(),
      },
    } as UIMessageChunk);
  } finally {
    writer.releaseLock();
  }
}

export interface StepData {
  stepNumber: number;
  toolCalls: string[];
  finishReason: string;
}

export async function writeTurnEnd(
  writable: WritableStream<UIMessageChunk>,
  turnNumber: number,
  durationMs: number,
  steps?: StepData[],
  previousTotalStepCount: number = 0,
): Promise<number> {
  "use step";

  const writer = writable.getWriter();
  try {
    if (steps) {
      for (const step of steps) {
        await writer.write({
          type: "data-workflow",
          data: {
            type: "agent-step",
            stepNumber: step.stepNumber,
            toolCalls: step.toolCalls,
            finishReason: step.finishReason,
            timestamp: Date.now(),
          },
        } as UIMessageChunk);
      }
    }

    await writer.write({
      type: "data-workflow",
      data: { type: "turn-end", turnNumber, durationMs, timestamp: Date.now() },
    } as UIMessageChunk);
  } finally {
    writer.releaseLock();
  }

  return previousTotalStepCount + (steps?.length ?? 0);
}

export interface WorkflowEndObservability {
  workflowRunId: string;
  totalDurationMs: number;
  turnCount: number;
}

export async function writeStreamClose(
  writable: WritableStream<UIMessageChunk>,
  observability?: WorkflowEndObservability,
) {
  "use step";

  const writer = writable.getWriter();
  try {
    if (observability) {
      await writer.write({
        type: "data-workflow",
        data: {
          type: "workflow-end",
          workflowRunId: observability.workflowRunId,
          totalDurationMs: observability.totalDurationMs,
          turnCount: observability.turnCount,
          timestamp: Date.now(),
        },
      } as UIMessageChunk);
    }
    await writer.write({ type: "finish" });
  } finally {
    writer.releaseLock();
  }
}

export async function writeAssistantMessageMarker(
  writable: WritableStream<UIMessageChunk>,
  id: string,
  content: string,
) {
  "use step";

  const writer = writable.getWriter();
  try {
    await writer.write({
      type: "data-workflow",
      data: {
        type: "assistant-message",
        id,
        content,
        timestamp: Date.now(),
      },
    } as UIMessageChunk);
  } finally {
    writer.releaseLock();
  }
}

export async function writeCartAbandonmentDebug(
  writable: WritableStream<UIMessageChunk>,
  input: {
    cartId: string;
    workflowRunId: string;
    stage: "started" | "sleeping" | "evaluating" | "notification_sent" | "skipped" | "completed";
    delayMs?: number;
    result?: CartAbandonmentWorkflowResult;
  },
) {
  "use step";

  const writer = writable.getWriter();
  try {
    await writer.write({
      type: "data-workflow",
      data: {
        type: "cart-abandonment-debug",
        cartId: input.cartId,
        workflowRunId: input.workflowRunId,
        stage: input.stage,
        timestamp: Date.now(),
        delayMs: input.delayMs,
        status: input.result?.status,
        reason: input.result?.status === "skipped" ? input.result.reason : undefined,
        channel: input.result?.status === "sent" ? input.result.channel : undefined,
        recipient: input.result?.status === "sent" ? input.result.recipient : undefined,
        notificationId: input.result?.status === "sent" ? input.result.notificationId : undefined,
        subject: input.result?.status === "sent" ? input.result.subject : undefined,
        body: input.result?.status === "sent" ? input.result.body : undefined,
        message: input.result?.message,
      },
    } as UIMessageChunk);
  } finally {
    writer.releaseLock();
  }
}
