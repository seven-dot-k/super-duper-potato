import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { sku } = await request.json();

  if (!sku || typeof sku !== "string") {
    return NextResponse.json({ error: "Missing sku" }, { status: 400 });
  }

  revalidateTag(`product-${sku}`, "max");

  return NextResponse.json({ revalidated: true, sku });
}
