import { describe, it, expect, vi, beforeEach } from "vitest";

const mockStart = vi.fn();
const mockGetRun = vi.fn();
const mockResume = vi.fn();

vi.mock("workflow/api", () => ({
  start: mockStart,
  getRun: mockGetRun,
}));

vi.mock("@/workflows/shopper-assistant/hooks/chat-message", () => ({
  chatMessageHook: {
    resume: mockResume,
  },
}));

vi.mock("@/workflows/shopper-assistant", () => ({
  shopperAssistantWorkflow: vi.fn(),
}));

describe("storefront chat API routes", () => {
  beforeEach(() => {
    mockStart.mockReset();
    mockGetRun.mockReset();
    mockResume.mockReset();
  });

  it("start route returns workflow run id header", async () => {
    const stream = new ReadableStream();
    mockStart.mockResolvedValueOnce({
      runId: "run-123",
      readable: stream,
    });

    const { POST } = await import("@/app/api/storefront-chat/route");
    const req = new Request("http://localhost/api/storefront-chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ id: "u1", role: "user", parts: [{ type: "text", text: "hi" }] }],
        pageContext: {
          url: "http://localhost/product/ELEC-001",
          entity: "product",
          id: "ELEC-001",
        },
        userContext: {
          userId: "11111111-1111-4111-8111-111111111111",
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("x-workflow-run-id")).toBe("run-123");
    expect(mockStart).toHaveBeenCalledTimes(1);
    expect(mockStart.mock.calls[0][1][0]).toMatchObject({
      storefrontContext: {
        pageContext: {
          entity: "product",
          id: "ELEC-001",
        },
        userContext: {
          userId: "11111111-1111-4111-8111-111111111111",
        },
      },
    });
  });

  it("follow-up route resumes shopper session hook", async () => {
    const { POST } = await import("@/app/api/storefront-chat/[id]/route");
    const req = new Request("http://localhost/api/storefront-chat/run-abc", {
      method: "POST",
      body: JSON.stringify({ message: "still shopping" }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "run-abc" }) });
    expect(res.status).toBe(200);
    expect(mockResume).toHaveBeenCalledWith("run-abc", {
      message: "still shopping",
      storefrontContext: undefined,
    });
  });

  it("follow-up route can refresh shopper page context", async () => {
    const { POST } = await import("@/app/api/storefront-chat/[id]/route");
    const req = new Request("http://localhost/api/storefront-chat/run-abc", {
      method: "POST",
      body: JSON.stringify({
        message: "what about this one?",
        pageContext: {
          url: "http://localhost/product/ELEC-002",
          entity: "product",
          id: "ELEC-002",
        },
        userContext: {
          userId: "11111111-1111-4111-8111-111111111111",
        },
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "run-abc" }) });
    expect(res.status).toBe(200);
    expect(mockResume).toHaveBeenCalledWith("run-abc", {
      message: "what about this one?",
      storefrontContext: {
        pageContext: {
          entity: "product",
          id: "ELEC-002",
          url: "http://localhost/product/ELEC-002",
        },
        userContext: {
          userId: "11111111-1111-4111-8111-111111111111",
        },
      },
    });
  });

  it("stream route reconnects to run stream", async () => {
    const stream = new ReadableStream();
    const getReadable = vi.fn().mockReturnValue(stream);
    mockGetRun.mockReturnValueOnce({ getReadable });

    const { GET } = await import("@/app/api/storefront-chat/[id]/stream/route");
    const req = new Request("http://localhost/api/storefront-chat/run-abc/stream?startIndex=5");

    const res = await GET(req, { params: Promise.resolve({ id: "run-abc" }) });
    expect(res.status).toBe(200);
    expect(mockGetRun).toHaveBeenCalledWith("run-abc");
    expect(getReadable).toHaveBeenCalledWith({ startIndex: 5 });
  });

  it("debug workflow stream route reconnects to any child workflow run in non-production", async () => {
    const stream = new ReadableStream();
    const getReadable = vi.fn().mockReturnValue(stream);
    mockGetRun.mockReturnValueOnce({ getReadable });

    const { GET } = await import("@/app/api/workflow-runs/[id]/stream/route");
    const req = new Request("http://localhost/api/workflow-runs/wrun-child/stream?startIndex=2");

    const res = await GET(req, { params: Promise.resolve({ id: "wrun-child" }) });
    expect(res.status).toBe(200);
    expect(mockGetRun).toHaveBeenCalledWith("wrun-child");
    expect(getReadable).toHaveBeenCalledWith({ startIndex: 2 });
  });
});
