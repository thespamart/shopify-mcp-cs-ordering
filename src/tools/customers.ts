import { adminGQL } from "../shopify.js";

const Q_CUSTOMER = `
query FindCustomer($q: String!) {
  customers(first: 1, query: $q) { edges { node { id email } } }
}`;
const M_CUSTOMER = `
mutation CreateCustomer($input: CustomerInput!) {
  customerCreate(input: $input) { customer { id email } userErrors { message } }
}`;

export async function findOrCreateByEmail(input: { email: string }) {
  const q = `email:${input.email}`;
  const f = await adminGQL(Q_CUSTOMER, { q });
  const hit = f?.customers?.edges?.[0]?.node;
  if (hit) return { id: hit.id, email: hit.email, created: false };
  const c = await adminGQL(M_CUSTOMER, { input: { email: input.email, verifiedEmail: true } });
  const cust = c?.customerCreate?.customer;
  if (!cust?.id) throw new Error("CustomerCreate failed");
  return { id: cust.id, email: cust.email, created: true };
}
