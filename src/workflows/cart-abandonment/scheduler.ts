import { start } from "workflow/api";
import {
  cartAbandonmentWorkflow,
  getCartAbandonmentDelayMs,
  type CartAbandonmentWorkflowInput,
} from "./workflow";
import { shopPlatformAdapter } from "@/lib/shop-platform/adapters";

export type CartAbandonmentScheduleResult =
  | {
      scheduled: true;
      runId: string;
      cartId: string;
      delayMs: number;
    }
  | {
      scheduled: false;
      cartId: string;
      reason: string;
    };

export async function scheduleCartAbandonmentWorkflow(
  input: Omit<CartAbandonmentWorkflowInput, "delayMs" | "minimumIdleMs">,
): Promise<CartAbandonmentScheduleResult> {
  const delayMs = getCartAbandonmentDelayMs(process.env.SHOPPER_CART_ABANDONMENT_DELAY_MS);

  try {
    const run = await start(cartAbandonmentWorkflow, [{
      ...input,
      delayMs,
      minimumIdleMs: delayMs,
    }]);

    await shopPlatformAdapter.cart.recordAbandonmentWorkflow({
      cartId: input.cartId,
      workflowRunId: run.runId,
    });

    return {
      scheduled: true,
      runId: run.runId,
      cartId: input.cartId,
      delayMs,
    };
  } catch (error) {
    return {
      scheduled: false,
      cartId: input.cartId,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}
