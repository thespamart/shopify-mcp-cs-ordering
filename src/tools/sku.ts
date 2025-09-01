import { adminGQL } from "../shopify.js";

const Q_VARIANT_BY_SKU = `
query VariantBySku($q: String!) {
  productVariants(first: 1, query: $q) {
    edges { node { id sku title } }
  }
}`;

export type VariantHit = { sku: string; variantId: string | null; title?: string | null };

export async function variantFromSku(sku: string): Promise<VariantHit> {
  const escaped = JSON.stringify(sku).slice(1, -1);
  const q = `sku:${escaped}`;
  const data = await adminGQL(Q_VARIANT_BY_SKU, { q });
  const node = data?.productVariants?.edges?.[0]?.node;
  return { sku, variantId: node?.id ?? null, title: node?.title ?? null };
}

export async function variantsFromSkus(skus: string[], concurrency = 6): Promise<VariantHit[]> {
  const out: VariantHit[] = [];
  let i = 0;
  async function worker() {
    while (i < skus.length) {
      const idx = i++;
      try {
        out[idx] = await variantFromSku(skus[idx]);
      } catch {
        out[idx] = { sku: skus[idx], variantId: null };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, skus.length) }, worker));
  return out;
}
