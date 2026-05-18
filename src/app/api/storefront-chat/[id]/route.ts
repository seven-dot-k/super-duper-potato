import { chatMessageHook } from "@/workflows/shopper-assistant/hooks/chat-message";
import { HookConflictError, HookNotFoundError } from "workflow/internal/errors";
import { z } from "zod";

const messageSchema = z.object({
  message: z.string().min(1).max(10_000),
  pageContext: z.object({
    url: z.string().min(1).optional(),
    entity: z.string().min(1).optional(),
    id: z.string().min(1).optional(),
  }).optional(),
  userContext: z.object({
    userId: z.string().uuid(),
  }).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: runId } = await params;

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { pageContext, userContext } = parsed.data;
  const message = parsed.data.message.trim();
  if (!message) {
    return Response.json({ error: "Message cannot be empty" }, { status: 400 });
  }

  try {
    await chatMessageHook.resume(runId, {
      message,
      storefrontContext: pageContext && userContext ? { pageContext, userContext } : undefined,
    });
    return Response.json({ success: true });
  } catch (error) {
    if (HookNotFoundError.is(error)) {
      return Response.json({ error: "Session expired or not found" }, { status: 404 });
    }
    if (HookConflictError.is(error)) {
      return Response.json({ error: "Session token conflict" }, { status: 409 });
    }
    const details = error instanceof Error ? error.message : String(error);
    console.error(`[api/storefront-chat/${runId}] Resume error:`, details);
    return Response.json(
      { error: "Failed to send message", details },
      { status: 500 },
    );
  }
}
