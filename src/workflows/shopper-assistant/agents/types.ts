import type { ToolSet } from "ai";

export type ShopperAgentId =
  | "cart-checkout"
  | "product-discovery"
  | "generic-support"
  | "post-order-returns"
  | "human-handoff";

export interface ShopperAgentDefinition {
  id: ShopperAgentId;
  name: string;
  description: string;
  buildSystemPrompt: (context: ShopperPromptContext) => string;
  tools: ToolSet;
}

export interface StorefrontContext {
  pageContext: {
    url?: string;
    entity?: string;
    id?: string;
  };
  userContext: {
    userId: string;
  };
}

export type ShopperPromptContext = StorefrontContext;
