import { fetchProductSegmentPrice, fetchProduct } from "@/lib/mock-data/products";
import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { connection } from "next/server";
import { cacheLife, cacheTag } from "next/cache";

export async function generateMetadata({ params }: PageProps<'/product/[sku]'>): Promise<Metadata> {
    const { sku } = await params;
    const product = await fetchProduct(sku);
    return {
        title: product?.seoContent.metaTitle || `Product ${sku}`,
        description: product?.seoContent.metaDescription || "",
    }
}

async function ProductPrice({ params, searchParams }: { params: Promise<{ sku: string }>; searchParams: Promise<{ userSegment?: string }> }) {
    await connection();
    const { sku } = await params;
    const { userSegment } = await searchParams;
    const price = await fetchProductSegmentPrice(sku, userSegment);
    return <span className="text-lg font-semibold">${price.toFixed(2)}</span>;
}

async function ProductDetails({ params }: { params: Promise<{ sku: string }> }) {
    "use cache";
    const { sku } = await params;
    cacheLife({ revalidate: 600 });
    cacheTag(`product-${sku}`);
    const product = await fetchProduct(sku);
    if (!product) {
        return <h1 className="text-2xl font-bold">Product not found</h1>;
    }

    return (
        <div className="grid gap-6 md:grid-cols-[minmax(260px,420px)_minmax(0,1fr)] md:items-start">
            <div className="aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted">
                <Image
                    src={product.imageUrl}
                    alt={product.name}
                    width={840}
                    height={630}
                    className="h-full w-full object-cover"
                />
            </div>
            <div className="min-w-0">
                <p className="mb-2 text-sm font-medium uppercase tracking-normal text-muted-foreground">
                    {product.category}
                </p>
                <h1 className="mb-4 text-2xl font-bold">{product.name}</h1>
                <p className="text-muted-foreground">{product.content.longDescription}</p>
            </div>
        </div>
    );
}

export default async function ProductPage(props: PageProps<"/product/[sku]">) {
    return (
        <div className="space-y-5 p-4">
            <Suspense fallback={<div className="animate-pulse h-20 bg-muted rounded" />}>
                <ProductDetails params={props.params} />
            </Suspense>
            <Suspense fallback={<span className="text-lg font-semibold">Loading price...</span>}>
                <ProductPrice params={props.params} searchParams={props.searchParams} />
            </Suspense>
        </div>
    );
}
