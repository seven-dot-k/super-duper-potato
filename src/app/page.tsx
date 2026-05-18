import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-xl space-y-5 text-center">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Shopper Assistant POC
          </p>
          <h1 className="text-3xl font-semibold tracking-normal">
            Multi-agent storefront support with mocked commerce adapters
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Explore product discovery, cart actions, returns, human handoff, and
            a detached cart abandonment workflow from a demo product page.
          </p>
        </div>
        <Link
          href="/product/ELEC-001"
          className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Open storefront demo
        </Link>
      </div>
    </main>
  );
}
