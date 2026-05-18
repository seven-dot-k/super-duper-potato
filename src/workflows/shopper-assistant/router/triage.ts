import { generateText, Output, type ModelMessage } from "ai";
import { z } from "zod";
import type { ShopperAgentDefinition, ShopperAgentId } from "../agents";

export interface ShopperRoute {
  agentId: ShopperAgentId;
  reason: string;
}

const SHOPPER_TRIAGE_MODEL = "anthropic/claude-sonnet-4-6";
const SHOPPER_AGENT_IDS = [
  "cart-checkout",
  "product-discovery",
  "generic-support",
  "post-order-returns",
  "human-handoff",
] as const satisfies readonly ShopperAgentId[];

const SHOPPER_AGENT_DESCRIPTIONS: Record<ShopperAgentId, string> = {
  "cart-checkout": "Adds items to cart, summarizes cart state, and captures fulfillment preferences.",
  "product-discovery": "Searches products, answers SKU questions, and explains product FAQs/manuals.",
  "generic-support": "Answers general policy and FAQ questions using mocked policy data.",
  "post-order-returns": "Handles order lookup, return eligibility, document review, approval, and labels.",
  "human-handoff": "Creates a mocked CRM handoff for requests needing a person.",
};

const shopperTriageSchema = z.object({
  agentId: z.enum(SHOPPER_AGENT_IDS),
  reason: z.string().min(1).max(240),
});

const ROUTE_KEYWORDS: Array<{
  agentId: ShopperAgentId;
  reason: string;
  patterns: RegExp[];
}> = [
  {
    agentId: "human-handoff",
    reason: "The shopper asked for a person or escalation.",
    patterns: [/\bhuman\b/i, /\bperson\b/i, /\bagent\b/i, /\brepresentative\b/i, /\bsupervisor\b/i, /\bescalate\b/i],
  },
  {
    agentId: "post-order-returns",
    reason: "The shopper is asking about returns or post-order support.",
    patterns: [/\breturn\b/i, /\brefund\b/i, /\bexchange\b/i, /\border\s*[#-]?\s*\d+/i, /\bord-\d+/i, /\btracking\b/i, /\bcancel\b/i],
  },
  {
    agentId: "cart-checkout",
    reason: "The shopper wants a cart or checkout action.",
    patterns: [/\badd\b.*\bcart\b/i, /\bcart\b/i, /\bcheckout\b/i, /\bbuy\b/i, /\bpurchase\b/i, /\bfulfillment\b/i, /\bshipping address\b/i, /\bpickup\b/i],
  },
  {
    agentId: "generic-support",
    reason: "The shopper is asking a general policy or store-support question.",
    patterns: [/\bpolicy\b/i, /\bshipping\b/i, /\bwarranty\b/i, /\bprice match\b/i, /\brefund policy\b/i, /\bhow long\b.*\brefund\b/i],
  },
  {
    agentId: "product-discovery",
    reason: "The shopper is asking about products, recommendations, or product usage.",
    patterns: [/\bcompare\b/i, /\brecommend\b/i, /\bfind\b/i, /\bproduct\b/i, /\bsku\b/i, /\bcompatible\b/i, /\bbattery\b/i, /\bmanual\b/i, /\bsetup\b/i, /\bhow do i\b/i],
  },
];

export function getLatestUserText(messages: ModelMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index];
    if (message.role !== "user") continue;
    if (typeof message.content === "string") return message.content;
    if (Array.isArray(message.content)) {
      return message.content
        .map((part) => {
          if (typeof part === "string") return part;
          if (typeof part === "object" && part !== null && "text" in part) {
            return String(part.text);
          }
          return "";
        })
        .join(" ");
    }
  }
  return "";
}

export function classifyShopperIntent(text: string): ShopperRoute {
  const normalized = text.trim();
  for (const route of ROUTE_KEYWORDS) {
    if (route.patterns.some((pattern) => pattern.test(normalized))) {
      return { agentId: route.agentId, reason: route.reason };
    }
  }
  return {
    agentId: "product-discovery",
    reason: "Defaulting to product discovery for an ambiguous storefront question.",
  };
}

function getMessageText(message: ModelMessage): string {
  if (typeof message.content === "string") return message.content;
  if (!Array.isArray(message.content)) return "";
  return message.content
    .map((part) => {
      if (typeof part === "string") return part;
      if (typeof part === "object" && part !== null && "text" in part) {
        return String(part.text);
      }
      return "";
    })
    .join(" ");
}

function buildConversationExcerpt(messages: ModelMessage[]): string {
  return messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .slice(-8)
    .map((message) => `${message.role}: ${getMessageText(message)}`)
    .join("\n");
}

function buildAgenticTriagePrompt(messages: ModelMessage[], availableAgentIds: ShopperAgentId[]): string {
  const agentGuide = availableAgentIds
    .map((agentId) => `${agentId}: ${SHOPPER_AGENT_DESCRIPTIONS[agentId]}`)
    .join("\n");

  return [
    "Available shopper specialist agents:",
    agentGuide,
    "",
    "Recent conversation:",
    buildConversationExcerpt(messages) || "(no conversation text)",
    "",
    "Latest shopper message:",
    getLatestUserText(messages) || "(empty)",
  ].join("\n");
}

function normalizeRoute(
  route: ShopperRoute,
  availableAgentIds: ShopperAgentId[],
): ShopperRoute | null {
  if (availableAgentIds.includes(route.agentId)) return route;
  return null;
}

async function runAgenticShopperTriage(
  messages: ModelMessage[],
  availableAgentIds: ShopperAgentId[],
): Promise<ShopperRoute> {
  const { output } = await generateText({
    model: SHOPPER_TRIAGE_MODEL,
    output: Output.object({
      schema: shopperTriageSchema,
    }),
    system: [
      "You are an agentic triage router for a multi-agent ecommerce shopper assistant.",
      "Choose exactly one registered specialist agent for the next turn.",
      "Prefer the agent that can take the next concrete action, not merely the topic mentioned.",
      "Route requests for a person, escalation, complaints needing human review, or low confidence to human-handoff.",
      "Return a short operational reason that explains the routing decision.",
    ].join(" "),
    prompt: buildAgenticTriagePrompt(messages, availableAgentIds),
  });

  const route = normalizeRoute(output, availableAgentIds);
  if (route) return route;
  return {
    agentId: "product-discovery",
    reason: "Fallback route because the selected shopper agent is not registered.",
  };
}

export async function runShopperTriage(
  messages: ModelMessage[],
  availableAgentIds: ShopperAgentId[],
): Promise<ShopperRoute> {
  "use step";

  try {
    return await runAgenticShopperTriage(messages, availableAgentIds);
  } catch {
    const route = normalizeRoute(
      classifyShopperIntent(getLatestUserText(messages)),
      availableAgentIds,
    );
    if (route) return route;
  }

  return {
    agentId: "product-discovery",
    reason: "Fallback route because the selected shopper agent is not registered.",
  };
}

export function buildShopperTriageGuide(
  registry: Record<ShopperAgentId, ShopperAgentDefinition>,
): string {
  return Object.values(registry)
    .map((agent) => `${agent.id}: ${agent.description}`)
    .join("\n");
}
