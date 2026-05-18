"use client";

import type { DataOrderInfo } from "@/lib/schemas/data-parts";
import { cn } from "@/lib/utils";
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
} from "lucide-react";

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: typeof Package; className: string }
> = {
  pending: { label: "Pending", icon: Clock, className: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  confirmed: { label: "Confirmed", icon: CheckCircle, className: "text-blue-600 bg-blue-50 border-blue-200" },
  processing: { label: "Processing", icon: Package, className: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  shipped: { label: "Shipped", icon: Truck, className: "text-purple-600 bg-purple-50 border-purple-200" },
  delivered: { label: "Delivered", icon: CheckCircle, className: "text-green-600 bg-green-50 border-green-200" },
  cancelled: { label: "Cancelled", icon: XCircle, className: "text-red-600 bg-red-50 border-red-200" },
  refunded: { label: "Refunded", icon: CreditCard, className: "text-gray-600 bg-gray-50 border-gray-200" },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface OrderInfoCardProps {
  data: DataOrderInfo["data"];
}

export function OrderInfoCard({ data }: OrderInfoCardProps) {
  const statusCfg = STATUS_CONFIG[data.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;

  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-card p-4 text-sm shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Package className="size-4 text-muted-foreground" />
          <span className="font-semibold">{data.orderId}</span>
        </div>
        <span
          className={cn(
            "flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
            statusCfg.className,
          )}
        >
          <StatusIcon className="size-3" />
          {statusCfg.label}
        </span>
      </div>

      {/* Customer */}
      <div className="mb-3 text-xs text-muted-foreground">
        {data.customerName} &middot; {data.customerEmail}
      </div>

      {/* Items */}
      <div className="mb-3 space-y-1.5">
        {data.items.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between text-xs"
          >
            <span className="truncate pr-2">
              {item.quantity}x {item.name}
            </span>
            <span className="shrink-0 text-muted-foreground">
              {formatCurrency(item.unitPrice * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-border pt-2 space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatCurrency(data.subtotal)}</span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Tax</span>
          <span>{formatCurrency(data.tax)}</span>
        </div>
        <div className="flex justify-between text-xs font-semibold">
          <span>Total</span>
          <span>{formatCurrency(data.total)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Ordered {formatDate(data.createdAt)}</span>
        {data.trackingNumber && (
          <span>Tracking: {data.trackingNumber}</span>
        )}
      </div>
    </div>
  );
}
