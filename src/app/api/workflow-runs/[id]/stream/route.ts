import { createUIMessageStreamResponse } from "ai";
import { getRun } from "workflow/api";

function isDebugWorkflowStreamingEnabled() {
  return process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_DEBUG_WORKFLOW_STREAMS === "true";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isDebugWorkflowStreamingEnabled()) {
    return Response.json(
      { error: "Debug workflow streaming is disabled" },
      { status: 404 },
    );
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const startIndexParam = searchParams.get("startIndex");
  const startIndex =
    startIndexParam !== null ? Number.parseInt(startIndexParam, 10) : undefined;

  const run = getRun(id);
  const stream = run.getReadable({ startIndex });

  return createUIMessageStreamResponse({ stream });
}
