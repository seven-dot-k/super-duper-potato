import {
  cartCheckoutTools,
  genericSupportTools,
  humanHandoffTools,
  productDiscoveryTools,
  returnTools,
  orderTools,
} from "../tools";
import {
  cartCheckoutPrompt,
  genericSupportPrompt,
  humanHandoffPrompt,
  postOrderReturnsPrompt,
  productDiscoveryPrompt,
} from "./prompts";
import type {
  ShopperAgentDefinition,
  ShopperAgentId,
  ShopperPromptContext,
  StorefrontContext,
} from "./types";

export function buildShopperAgentRegistry(): Record<ShopperAgentId, ShopperAgentDefinition> {
  return {
    "cart-checkout": {
      id: "cart-checkout",
      name: "Cart Checkout",
      description: "Adds items to cart, summarizes cart state, and captures fulfillment preferences.",
      buildSystemPrompt: cartCheckoutPrompt,
      tools: cartCheckoutTools,
    },
    "product-discovery": {
      id: "product-discovery",
      name: "Product Discovery",
      description: "Searches products, answers SKU questions, and explains product FAQs/manuals.",
      buildSystemPrompt: productDiscoveryPrompt,
      tools: productDiscoveryTools,
    },
    "generic-support": {
      id: "generic-support",
      name: "Store Support",
      description: "Answers general policy and FAQ questions using mocked policy data.",
      buildSystemPrompt: genericSupportPrompt,
      tools: genericSupportTools,
    },
    "post-order-returns": {
      id: "post-order-returns",
      name: "Returns",
      description: "Handles order lookup, return eligibility, document review, approval, and labels.",
      buildSystemPrompt: postOrderReturnsPrompt,
      tools: { ...orderTools, ...returnTools },
    },
    "human-handoff": {
      id: "human-handoff",
      name: "Human Handoff",
      description: "Creates a mocked CRM handoff for requests needing a person.",
      buildSystemPrompt: humanHandoffPrompt,
      tools: humanHandoffTools,
    },
  };
}

export function getShopperAgentSummaries(
  registry: Record<ShopperAgentId, ShopperAgentDefinition>,
): string {
  return Object.values(registry)
    .map((agent) => `- ${agent.id}: ${agent.description}`)
    .join("\n");
}

export type { ShopperAgentDefinition, ShopperAgentId, ShopperPromptContext, StorefrontContext };
