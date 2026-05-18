import type { ShopperPlatformAdapters } from "@/lib/shop-platform/adapters";
import { mockCartAdapter } from "./cart";
import { mockCatalogAdapter } from "./catalog";
import { mockCrmAdapter } from "./crm";
import { mockNotificationAdapter } from "./notifications";
import { mockOrderAdapter } from "./orders";
import { mockPersonalizationAdapter } from "./personalization";
import { mockPolicyAdapter } from "./policies";
import { mockReturnsAdapter } from "./returns";

export const mockShopperAdapters: ShopperPlatformAdapters = {
  catalog: mockCatalogAdapter,
  cart: mockCartAdapter,
  orders: mockOrderAdapter,
  returns: mockReturnsAdapter,
  policies: mockPolicyAdapter,
  crm: mockCrmAdapter,
  personalization: mockPersonalizationAdapter,
  notifications: mockNotificationAdapter,
};

export type * from "@/lib/shop-platform/adapters";
