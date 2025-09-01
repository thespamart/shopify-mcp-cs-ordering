import fetch, { RequestInit } from "node-fetch";

const ADMIN_URL = `https://${process.env.SHOPIFY_STORE}/admin/api/2024-10/graphql.json`;
const SF_URL    = `https://${process.env.SHOPIFY_STORE}/api/2024-10/graphql.json`;

const ADMIN_HEADERS = {
  "Content-Type": "application/json",
  "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_TOKEN || ""
};
const SF_HEADERS = {
  "Content-Type": "application/json",
  "X-Shopify-Storefront-Access-Token": process.env.SHOPIFY_STOREFRONT_TOKEN || ""
};

async function gql(url: string, headers: Record<string,string>, query: string, variables: any) {
  const init: RequestInit = {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables })
  };
  const res = await fetch(url, init);
  if (res.status === 429) {
    await new Promise(r => setTimeout(r, 1200));
    const res2 = await fetch(url, init);
    const j2 = await res2.json();
    if (!res2.ok || j2.errors) throw new Error(JSON.stringify(j2.errors || j2));
    return j2.data;
  }
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(JSON.stringify(json.errors || json));
  return json.data;
}

export const adminGQL = (query: string, variables: any) => gql(ADMIN_URL, ADMIN_HEADERS, query, variables);
export const sfGQL    = (query: string, variables: any) => gql(SF_URL,    SF_HEADERS,   query, variables);
