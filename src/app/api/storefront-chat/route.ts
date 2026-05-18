import { createUIMessageStreamResponse, type UIMessage } from "ai";
import { start } from "workflow/api";
import { z } from "zod";
import { shopperAssistantWorkflow } from "@/workflows/shopper-assistant";

export const maxDuration = 30;

const storefrontChatRequestSchema = z.object({
  messages: z.array(
    z.object({
      id: z.string(),
      role: z.enum(["user", "assistant", "system"]),
      parts: z.array(z.unknown()),
    }).passthrough(),
  ),
  pageContext: z.object({
    url: z.string().min(1).optional(),
    entity: z.string().min(1).optional(),
    id: z.string().min(1).optional(),
  }),
  userContext: z.object({
    userId: z.string().uuid(),
  }),
});

export async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = storefrontChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { messages, pageContext, userContext } = parsed.data;
  // POC ONLY: our userContext is coming from the client side only
  // in a real implementation, this should be derived/authenticated from a secure source ( JWT, session cookie, etc. )
  const run = await start(shopperAssistantWorkflow, [{
    messages: messages as UIMessage[],
    storefrontContext: {
      pageContext,
      userContext,
    },
  }]);

  return createUIMessageStreamResponse({
    stream: run.readable,
    headers: {
      "x-workflow-run-id": run.runId,
    },
  });
}
