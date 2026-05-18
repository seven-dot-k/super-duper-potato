import { cartCheckoutTools } from "./cart";
import { genericSupportTools } from "./policies";
import { humanHandoffTools } from "./handoff";
import { orderTools } from "./orders";
import { productDiscoveryTools } from "./catalog";
import { returnTools } from "./returns";

export { cartCheckoutTools } from "./cart";
export { genericSupportTools } from "./policies";
export { humanHandoffTools } from "./handoff";
export { orderTools } from "./orders";
export { productDiscoveryTools } from "./catalog";
export { returnTools } from "./returns";

export const shopperTools = {
  ...productDiscoveryTools,
  ...cartCheckoutTools,
  ...orderTools,
  ...genericSupportTools,
  ...returnTools,
  ...humanHandoffTools,
};
