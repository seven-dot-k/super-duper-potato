import type { UIMessageChunk } from "ai";
import { getWritable } from "workflow";
import { z } from "zod";
import { shopPlatformAdapter } from "@/lib/shop-platform/adapters";

async function writeReturnStatus(data: Record<string, unknown>) {
  "use step";

  const writable = getWritable<UIMessageChunk>();
  const writer = writable.getWriter();
  try {
    await writer.write({
      type: "data-workflow",
      data: {
        type: "return-status",
        timestamp: Date.now(),
        ...data,
      },
    } as UIMessageChunk);
  } finally {
    writer.releaseLock();
  }
}

export const returnTools = {
  check_return_eligibility: {
    description:
      "Check whether an order or order item is eligible for a mocked return.",
    inputSchema: z.object({
      orderId: z.string().describe("Order ID, for example ORD-10001"),
      sku: z.string().optional().describe("Optional SKU to return from the order"),
    }),
    execute: async (input: { orderId: string; sku?: string }) => {
      "use step";
      const result = await shopPlatformAdapter.returns.checkEligibility(input);
      await writeReturnStatus({
        stage: "eligibility_checked",
        orderId: input.orderId,
        eligible: "eligible" in result ? result.eligible : false,
      });
      return result;
    },
  },
  initiate_return: {
    description:
      "Start a mocked return after eligibility is confirmed. Use a concise customer-provided reason.",
    inputSchema: z.object({
      orderId: z.string().describe("Order ID, for example ORD-10001"),
      sku: z.string().optional().describe("Optional SKU to return from the order"),
      reason: z.string().describe("Customer's return reason"),
    }),
    execute: async (input: { orderId: string; sku?: string; reason: string }) => {
      "use step";
      const result = await shopPlatformAdapter.returns.initiateReturn(input);
      await writeReturnStatus({
        stage: "return_started",
        orderId: input.orderId,
        returnId: "returnId" in result ? result.returnId : undefined,
      });
      return result;
    },
  },
  request_return_docs: {
    description:
      "List documents needed for a mocked return, if any.",
    inputSchema: z.object({
      returnId: z.string().describe("Mock return ID"),
    }),
    execute: async (input: { returnId: string }) => {
      "use step";
      const result = await shopPlatformAdapter.returns.requestDocs(input);
      await writeReturnStatus({
        stage: "docs_requested",
        returnId: input.returnId,
        requiredDocs: result.requiredDocs,
      });
      return result;
    },
  },
  review_return_docs: {
    description:
      "Review mocked return documents. In this POC, pass docsProvided=true when the shopper says they have supplied the requested docs.",
    inputSchema: z.object({
      returnId: z.string().describe("Mock return ID"),
      docsProvided: z.boolean().describe("Whether the shopper has provided the requested documents"),
    }),
    execute: async (input: { returnId: string; docsProvided: boolean }) => {
      "use step";
      const result = await shopPlatformAdapter.returns.reviewDocs(input);
      await writeReturnStatus({
        stage: "docs_reviewed",
        returnId: input.returnId,
        docsAccepted: result.docsAccepted,
      });
      return result;
    },
  },
  request_admin_approval: {
    description:
      "Request mocked admin approval for a return when policy requires it.",
    inputSchema: z.object({
      returnId: z.string().describe("Mock return ID"),
    }),
    execute: async (input: { returnId: string }) => {
      "use step";
      const result = await shopPlatformAdapter.returns.requestApproval(input);
      await writeReturnStatus({
        stage: "approval_completed",
        returnId: input.returnId,
        approved: result.approved,
      });
      return result;
    },
  },
  generate_return_label: {
    description:
      "Generate a mocked return shipping label after required documents and approval are complete.",
    inputSchema: z.object({
      returnId: z.string().describe("Mock return ID"),
    }),
    execute: async (input: { returnId: string }) => {
      "use step";
      const result = await shopPlatformAdapter.returns.generateLabel(input);
      await writeReturnStatus({
        stage: "label_generated",
        returnId: input.returnId,
        labelUrl: "labelUrl" in result ? result.labelUrl : undefined,
      });
      return result;
    },
  },
};
