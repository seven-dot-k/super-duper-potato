import {
  convertToModelMessages,
  type ModelMessage,
  type UIMessage,
  type UIMessageChunk,
} from "ai";
import { DurableAgent } from "@workflow/ai/agent";
import { getWritable, getWorkflowMetadata } from "workflow";
import {
  buildShopperAgentRegistry,
  type ShopperAgentDefinition,
  type StorefrontContext,
} from "./agents";
import { runShopperTriage } from "./router";
import { chatMessageHook } from "./hooks/chat-message";
import {
  writeAgentSwitch,
  writeStreamClose,
  writeTurnEnd,
  writeUserMessageMarker,
} from "../shared/steps/writer";

const MAX_TURNS = 80;
const MAX_STEPS_PER_TURN = 15;

function buildAgent(definition: ShopperAgentDefinition): DurableAgent {
  return new DurableAgent({
    model: "anthropic/claude-sonnet-4-6",
    tools: definition.tools,
  });
}

function extractText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

function buildStorefrontSystemMessage(
  definition: ShopperAgentDefinition,
  context: StorefrontContext,
): string {
  return definition.buildSystemPrompt(context);
}

export async function shopperAssistantWorkflow({
  messages,
  storefrontContext,
}: {
  messages: UIMessage[];
  storefrontContext: StorefrontContext;
}) {
  "use workflow";

  const { workflowRunId: runId, workflowStartedAt } = getWorkflowMetadata();
  const workflowStartTime = workflowStartedAt.getTime();
  const writable = getWritable<UIMessageChunk>();
  const hook = chatMessageHook.create({ token: runId });
  const modelMessages: ModelMessage[] = await convertToModelMessages(messages);
  let currentStorefrontContext = storefrontContext;
  const registry = buildShopperAgentRegistry();
  const availableAgentIds = Object.keys(registry) as Array<keyof typeof registry>;

  for (const message of messages) {
    if (message.role !== "user") continue;
    const text = extractText(message);
    if (!text) continue;
    await writeUserMessageMarker(writable, text, message.id, {
      turnNumber: 1,
      turnStartedAt: workflowStartTime,
      workflowRunId: runId,
      workflowStartedAt: workflowStartTime,
      isFirstTurn: false,
    });
  }

  let activeAgentId: string | null = null;
  let turnNumber = 0;
  let totalStepCount = 0;

  while (turnNumber < MAX_TURNS) {
    turnNumber++;
    const turnStartedAt = Date.now();
    const route = await runShopperTriage(modelMessages, availableAgentIds);
    const definition = registry[route.agentId];
    const activeAgent = buildAgent(definition);

    if (activeAgentId !== route.agentId) {
      activeAgentId = route.agentId;
      await writeAgentSwitch(writable, definition.id, definition.name);
    }

    let result;
    try {
      result = await activeAgent.stream({
        system: buildStorefrontSystemMessage(
          definition,
          currentStorefrontContext,
        ),
        messages: modelMessages.filter((message) => message.role !== "system"),
        writable,
        preventClose: true,
        sendStart: turnNumber === 1,
        sendFinish: false,
        maxSteps: MAX_STEPS_PER_TURN,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const writer = writable.getWriter();
      try {
        await writer.write({
          type: "error",
          errorMessage: `An error occurred during shopper workflow processing: ${errorMessage}`,
        } as unknown as UIMessageChunk);
      } finally {
        writer.releaseLock();
      }
      break;
    }

    modelMessages.push(...result.messages.filter((message) => message.role !== "system"));

    const stepsForTurn = result.steps.map((step, index) => ({
      stepNumber: totalStepCount + index + 1,
      toolCalls: step.toolCalls?.map((toolCall) => toolCall.toolName) || [],
      finishReason: step.finishReason || "unknown",
    }));

    totalStepCount = await writeTurnEnd(
      writable,
      turnNumber,
      Date.now() - turnStartedAt,
      stepsForTurn,
      totalStepCount,
    );

    const { message: followUp, storefrontContext: nextStorefrontContext } = await hook;
    if (followUp === "/done") break;
    if (nextStorefrontContext) {
      currentStorefrontContext = nextStorefrontContext;
    }

    const followUpId = `user-${runId}-${turnNumber + 1}`;
    await writeUserMessageMarker(writable, followUp, followUpId, {
      turnNumber: turnNumber + 1,
      turnStartedAt: Date.now(),
      workflowRunId: runId,
      workflowStartedAt: workflowStartTime,
      isFirstTurn: false,
    });
    modelMessages.push({ role: "user", content: followUp });
  }

  await writeStreamClose(writable, {
    workflowRunId: runId,
    totalDurationMs: Date.now() - workflowStartTime,
    turnCount: turnNumber,
  });
}

export const shopperWorkflowInternals = {
  buildShopperAgentRegistry,
  runShopperTriage,
};
