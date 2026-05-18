import { Suspense } from "react";
import Link from "next/link";
import { StorefrontChat } from "@/components/chat/storefront-chat";

export default function ProductLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <nav className="shrink-0 flex flex-wrap gap-4 border-b border-border px-4 py-3">
        <Link href="/product/ELEC-001" className="text-sm hover:underline">Wireless Headphones Pro</Link>
        <Link href="/product/ELEC-002" className="text-sm hover:underline">USB-C Hub 7-in-1</Link>
        <Link href="/product/ELEC-003" className="text-sm hover:underline">Smart Watch Series X</Link>
      </nav>
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          {children}
        </main>
        <aside className="flex h-[70dvh] min-h-[560px] w-full min-w-0 flex-col overflow-hidden border-t border-border lg:h-auto lg:min-h-0 lg:w-[520px] lg:shrink-0 lg:border-l lg:border-t-0">
          <Suspense fallback={null}>
            <StorefrontChat />
          </Suspense>
        </aside>
      </div>
    </div>
  );
}
