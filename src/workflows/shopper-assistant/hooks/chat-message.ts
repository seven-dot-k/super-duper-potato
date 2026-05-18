import { defineHook } from "workflow";
import { z } from "zod";

/**
 * Hook for injecting user messages into an ongoing multi-turn chat session.
 * The workflow waits on this hook to receive follow-up messages from the client.
 */
export const chatMessageHook = defineHook({
  schema: z.object({
    message: z.string(),
    storefrontContext: z.object({
      pageContext: z.object({
        url: z.string().min(1).optional(),
        entity: z.string().min(1).optional(),
        id: z.string().min(1).optional(),
      }),
      userContext: z.object({
        userId: z.string().uuid(),
      }),
    }).optional(),
  }),
});
