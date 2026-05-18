import type { PersonalizationAdapter } from "@/lib/shop-platform/adapters";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export const mockPersonalizationAdapter: PersonalizationAdapter = {
  async buildCartAbandonmentMessage({ cart }) {
    const itemNames = cart.lines.map((line) => line.name).join(", ");
    const itemCount = cart.lines.reduce((total, line) => total + line.quantity, 0);
    const total = formatMoney(cart.estimatedTotal);

    return {
      subject: `Your ${itemCount} item${itemCount === 1 ? "" : "s"} are still in your cart`,
      emailBody: [
        `Hi there, your demo cart still has ${itemNames}.`,
        `Estimated total: ${total}.`,
        `Resume checkout here: https://example.test/cart/${cart.cartId}`,
      ].join("\n"),
      smsBody: `Your demo cart has ${itemCount} item${itemCount === 1 ? "" : "s"} waiting (${total}): https://example.test/cart/${cart.cartId}`,
    };
  },
};
