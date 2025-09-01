import { adminGQL } from "../shopify.js";
import { variantsFromSkus } from "./sku.js";

const M_CART_CREATE = `
mutation { cartCreate(input:{}) { cart { id checkoutUrl } userErrors { message } } }`;
const M_CART_LINES = `
mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
  cartLinesAdd(cartId: $cartId, lines: $lines) {
    cart { id checkoutUrl }
    userErrors { message }
  }
}`;
const M_CART_BUYER = `
mutation CartBuyer($cartId: ID!, $buyer: CartBuyerIdentityInput!) {
  cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyer) {
    cart { id checkoutUrl } userErrors { message }
  }
}`;
const M_CART_SHIP = `
mutation CartShip($cartId: ID!, $addr: MailingAddressInput!) {
  cartShippingAddressUpdate(cartId: $cartId, shippingAddress: $addr) {
    cart { id checkoutUrl } userErrors { message }
  }
}`;

export async function createCheckout(input: {
  lines: Array<{ merchandiseId?: string | null; quantity: number }>;
  email: string;
  shippingAddress: any;
}) {
  const create = await adminGQL(M_CART_CREATE, {});
  const cartId = create?.cartCreate?.cart?.id;
  if (!cartId) throw new Error("CartCreate failed");

  const lines = input.lines.map(l => ({
    quantity: l.quantity,
    merchandiseId: l.merchandiseId
  }));

  await adminGQL(M_CART_LINES, { cartId, lines });
  await adminGQL(M_CART_BUYER, { cartId, buyer: { email: input.email } });
  await adminGQL(M_CART_SHIP, { cartId, addr: input.shippingAddress });

  const checkoutUrl = create?.cartCreate?.cart?.checkoutUrl;
  return { cartId, checkoutUrl };
}

const M_DRAFT_CREATE = `
mutation DraftOrderCreate($input: DraftOrderInput!) {
  draftOrderCreate(input: $input) {
    draftOrder { id invoiceUrl }
    userErrors { field message }
  }
}`;

export async function createDraftOrder(input: {
  email: string;
  shippingAddress?: any;
  lines: Array<{ variantId?: string | null; quantity: number }>;
  tags?: string[];
}) {
  const lines = input.lines.map(l => ({
    quantity: l.quantity,
    variantId: l.variantId ?? undefined
  }));
  const payload: any = {
    email: input.email,
    shippingAddress: input.shippingAddress,
    lineItems: lines,
    tags: input.tags || []
  };
  const res = await adminGQL(M_DRAFT_CREATE, { input: payload });
  const draft = res?.draftOrderCreate?.draftOrder;
  if (!draft?.invoiceUrl) throw new Error("DraftOrderCreate failed");
  return { draftOrderId: draft.id, invoiceUrl: draft.invoiceUrl };
}

export async function createCheckoutBySku(input: {
  lines: Array<{ sku: string; quantity: number }>;
  email: string;
  shippingAddress: any;
}) {
  const skus = input.lines.map(l => l.sku);
  const hits = await variantsFromSkus(skus);
  const failed = hits.filter(h => !h.variantId).map(h => h.sku);
  if (failed.length) {
    return { checkoutUrl: null, missingSkus: failed, code: "MISSING_VARIANTS" };
  }
  const lines = hits.map((h, idx) => ({
    merchandiseId: h.variantId!,
    quantity: input.lines[idx].quantity
  }));
  return createCheckout({ lines, email: input.email, shippingAddress: input.shippingAddress });
}

export async function createDraftOrderBySku(input: {
  email: string;
  shippingAddress?: any;
  lines: Array<{ sku: string; quantity: number }>;
  tags?: string[];
}) {
  const skus = input.lines.map(l => l.sku);
  const hits = await variantsFromSkus(skus);
  const failed = hits.filter(h => !h.variantId).map(h => h.sku);
  if (failed.length) {
    return { invoiceUrl: null, missingSkus: failed, code: "MISSING_VARIANTS" };
  }
  const lines = hits.map((h, idx) => ({
    variantId: h.variantId!,
    quantity: input.lines[idx].quantity
  }));
  return createDraftOrder({ email: input.email, shippingAddress: input.shippingAddress, lines, tags: input.tags });
}
