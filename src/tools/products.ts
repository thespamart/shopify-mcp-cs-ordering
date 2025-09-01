import { adminGQL, sfGQL } from "../shopify.js";
import { normalizeAvailability } from "../availability.js";
import { variantsFromSkus } from "./sku.js";

const Q_ADMIN = `
query VariantAdminInfo($variantId: ID!) {
  productVariant(id: $variantId) {
    id
    sku
    inventoryPolicy
    inventoryItem { tracked }
  }
}`;
const Q_SF = `
query VariantStorefrontInfo($variantId: ID!) {
  node(id: $variantId) {
    ... on ProductVariant {
      id
      availableForSale
      quantityAvailable
    }
  }
}`;

export async function getVariantAvailability(input: { variantId: string }) {
  const ad = await adminGQL(Q_ADMIN, { variantId: input.variantId });
  const v = ad?.productVariant;
  const tracked = v?.inventoryItem?.tracked ?? null;
  const policy = v?.inventoryPolicy ?? null;
  const sku = v?.sku ?? null;

  let afs: boolean | null = null;
  let qty: number | null = null;
  try {
    const sf = await sfGQL(Q_SF, { variantId: input.variantId });
    const node = sf?.node;
    afs = node?.availableForSale ?? null;
    qty = typeof node?.quantityAvailable === "number" ? node.quantityAvailable : null;
  } catch { /* storefront optional */ }

  const availability = normalizeAvailability({
    tracked,
    quantity: qty,
    inventoryPolicy: policy,
    availableForSale: afs
  });

  return {
    variantId: input.variantId,
    sku,
    tracked,
    inventoryPolicy: policy,
    quantity: qty,
    availableForSale: afs,
    availability
  };
}

export async function getAvailabilityBySku(input: { sku: string }) {
  const hit = (await variantsFromSkus([input.sku]))[0];
  if (!hit?.variantId) {
    return {
      sku: input.sku,
      variantId: null,
      availability: "UNKNOWN",
      reason: "SKU_NOT_FOUND"
    };
  }
  const v = await getVariantAvailability({ variantId: hit.variantId });
  return { ...v, sku: input.sku };
}
