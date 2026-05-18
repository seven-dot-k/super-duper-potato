import type { UIMessageChunk } from "ai";
import { getWorkflowMetadata, getWritable, sleep } from "workflow";
import { shopPlatformAdapter } from "@/lib/shop-platform/adapters";
import { writeCartAbandonmentDebug, writeStreamClose } from "../shared/steps/writer";

export const DEFAULT_CART_ABANDONMENT_DELAY_MS = 60 * 1000;

export type CartAbandonmentWorkflowInput = {
  cartId: string;
  shopperSessionId?: string;
  delayMs?: number;
  minimumIdleMs?: number;
};

export type CartAbandonmentWorkflowResult =
  | {
      status: "skipped";
      cartId: string;
      reason:
        | "missing_cart"
        | "empty_cart"
        | "already_checked_out"
        | "already_abandoned"
        | "recent_activity"
        | "missing_recipient";
      message: string;
    }
  | {
      status: "sent";
      cartId: string;
      notificationId: string;
      channel: "email" | "sms";
      recipient: string;
      subject?: string;
      body: string;
      message: string;
    };

export function getCartAbandonmentDelayMs(value?: string) {
  if (!value) return DEFAULT_CART_ABANDONMENT_DELAY_MS;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return DEFAULT_CART_ABANDONMENT_DELAY_MS;
  }

  return parsed;
}

export async function evaluateCartAbandonment(
  input: CartAbandonmentWorkflowInput,
): Promise<CartAbandonmentWorkflowResult> {
  "use step";

  const { cartId } = input;
  const cartResult = await shopPlatformAdapter.cart.getCart({ cartId });
  if (!cartResult.cart) {
    return {
      status: "skipped",
      cartId,
      reason: "missing_cart",
      message: cartResult.error ?? `No cart found for ${cartId}.`,
    };
  }

  const { cart } = cartResult;
  if (cart.status === "checked_out") {
    return {
      status: "skipped",
      cartId,
      reason: "already_checked_out",
      message: `Cart ${cartId} already checked out.`,
    };
  }

  if (cart.status === "abandoned") {
    return {
      status: "skipped",
      cartId,
      reason: "already_abandoned",
      message: `Cart ${cartId} was already processed as abandoned.`,
    };
  }

  if (cart.lines.length === 0) {
    return {
      status: "skipped",
      cartId,
      reason: "empty_cart",
      message: `Cart ${cartId} has no line items.`,
    };
  }

  const minimumIdleMs = input.minimumIdleMs ?? input.delayMs ?? DEFAULT_CART_ABANDONMENT_DELAY_MS;
  const idleMs = Date.now() - Date.parse(cart.lastActivityAt);
  if (idleMs < minimumIdleMs) {
    return {
      status: "skipped",
      cartId,
      reason: "recent_activity",
      message: `Cart ${cartId} is still active.`,
    };
  }

  const recipient = cart.preferredChannel === "sms" ? cart.customerPhone : cart.customerEmail;
  if (!recipient) {
    return {
      status: "skipped",
      cartId,
      reason: "missing_recipient",
      message: `Cart ${cartId} has no ${cart.preferredChannel} recipient.`,
    };
  }

  const marked = await shopPlatformAdapter.cart.markAbandoned({
    cartId,
    abandonedAt: new Date().toISOString(),
  });
  if (!marked.success) {
    return {
      status: "skipped",
      cartId,
      reason: "missing_cart",
      message: marked.error,
    };
  }

  const personalizedMessage = await shopPlatformAdapter.personalization.buildCartAbandonmentMessage({
    cart: marked.cart,
  });
  const body = cart.preferredChannel === "sms"
    ? personalizedMessage.smsBody
    : personalizedMessage.emailBody;
  const notification = await shopPlatformAdapter.notifications.sendCartAbandonmentNotification({
    cartId,
    channel: cart.preferredChannel,
    recipient,
    subject: cart.preferredChannel === "email" ? personalizedMessage.subject : undefined,
    body,
  });

  return {
    status: "sent",
    cartId,
    notificationId: notification.notificationId,
    channel: notification.channel,
    recipient: notification.recipient,
    subject: notification.subject,
    body: notification.body,
    message: notification.message,
  };
}

export async function cartAbandonmentWorkflow(input: CartAbandonmentWorkflowInput) {
  "use workflow";

  const { workflowRunId } = getWorkflowMetadata();
  const writable = getWritable<UIMessageChunk>();
  const delayMs = input.delayMs ?? DEFAULT_CART_ABANDONMENT_DELAY_MS;

  await writeCartAbandonmentDebug(writable, {
    cartId: input.cartId,
    workflowRunId,
    stage: "started",
    delayMs,
  });

  if (delayMs > 0) {
    await writeCartAbandonmentDebug(writable, {
      cartId: input.cartId,
      workflowRunId,
      stage: "sleeping",
      delayMs,
    });
    await sleep(delayMs);
  }

  await writeCartAbandonmentDebug(writable, {
    cartId: input.cartId,
    workflowRunId,
    stage: "evaluating",
    delayMs,
  });

  const result = await evaluateCartAbandonment({
    ...input,
    delayMs,
    minimumIdleMs: input.minimumIdleMs ?? delayMs,
  });

  await writeCartAbandonmentDebug(writable, {
    cartId: input.cartId,
    workflowRunId,
    stage: result.status === "sent" ? "notification_sent" : "skipped",
    delayMs,
    result,
  });
  await writeCartAbandonmentDebug(writable, {
    cartId: input.cartId,
    workflowRunId,
    stage: "completed",
    delayMs,
    result,
  });

  await writeStreamClose(writable);

  return result;
}
