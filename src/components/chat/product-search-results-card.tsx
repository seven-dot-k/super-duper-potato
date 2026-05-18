"use client";

import Image from "next/image";
import Link from "next/link";
import type { DataProductSearchResults } from "@/lib/schemas/data-parts";
import { ExternalLink } from "lucide-react";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

interface ProductSearchResultsCardProps {
  data: DataProductSearchResults["data"];
}

export function ProductSearchResultsCard({ data }: ProductSearchResultsCardProps) {
  if (data.products.length === 0) {
    return (
      <div className="mt-2 rounded-md border border-border bg-card p-3 text-sm text-muted-foreground">
        {data.message}
      </div>
    );
  }

  return (
    <div className="mt-2 w-full max-w-[min(720px,calc(100vw-3rem))]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">{data.message}</p>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {data.products.map((product) => (
          <Link
            key={product.sku}
            href={`/product/${encodeURIComponent(product.sku)}`}
            className="group grid min-w-[280px] max-w-[280px] grid-cols-[96px_1fr] gap-3 rounded-lg border border-border bg-card p-3 text-left shadow-sm transition-colors hover:bg-accent"
          >
            <div className="aspect-square overflow-hidden rounded-md border border-border bg-muted">
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={192}
                height={192}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                  {product.name}
                </h3>
                <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
              </div>
              <p className="mt-1 text-xs font-medium uppercase tracking-normal text-muted-foreground">
                {product.category}
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {formatCurrency(product.price)}
              </p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                {product.shortDescription}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
