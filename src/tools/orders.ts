import { adminGQL } from "../shopify.js";

const Q_ORDER = `
query OrderByNameEmail($q: String!) {
  orders(first: 1, query: $q) {
    edges {
      node {
        id
        name
        email
        displayFulfillmentStatus
        fulfillments(first: 10) {
          status
          createdAt
          trackingInfo { number url company }
        }
      }
    }
  }
}
`;

export async function getByNumberAndEmail(input: { orderNumber: string; email: string }) {
  const q = `name:${input.orderNumber} AND email:${input.email}`;
  const data = await adminGQL(Q_ORDER, { q });
  const node = data?.orders?.edges?.[0]?.node;
  if (!node) {
    return {
      orderNumber: input.orderNumber,
      status: "NOT_FOUND",
      fulfillments: []
    };
    }
  const fulfills = Array.isArray(node.fulfillments) ? node.fulfillments : [];
  const fulfillments = fulfills.map((f: any) => ({
    createdAt: f?.createdAt ?? null,
    status: f?.status ?? "UNKNOWN",
    tracking: (f?.trackingInfo || []).map((t: any) => ({
      number: t?.number ?? "",
      url: t?.url ?? null,
      company: t?.company ?? null
    }))
  }));
  return {
    orderNumber: node.name,
    status: node.displayFulfillmentStatus || "UNKNOWN",
    fulfillments
  };
}
