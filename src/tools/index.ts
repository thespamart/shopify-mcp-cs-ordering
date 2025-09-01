import { getByNumberAndEmail } from "./orders.js";
import { getVariantAvailability, getAvailabilityBySku } from "./products.js";
import { createCheckout, createDraftOrder, createCheckoutBySku, createDraftOrderBySku } from "./checkout.js";
import { findOrCreateByEmail } from "./customers.js";

export type ToolSpec = {
  description: string;
  inputSchema: any;
  outputSchema: any;
  execute: (input: any) => Promise<any>;
};

export const tools: Record<string, ToolSpec> = {
  "orders.getByNumberAndEmail": {
    description: "Fetch Shopify order with status + tracking by order number and email",
    inputSchema: { type: "object", required: ["orderNumber", "email"], properties: {
      orderNumber: { type: "string" }, email: { type: "string", format: "email" }
    }},
    outputSchema: { type: "object", required: ["orderNumber","status","fulfillments"], properties: {
      orderNumber: { type: "string" }, status: { type: "string" },
      fulfillments: { type: "array", items: { type: "object", properties: {
        createdAt: { type: ["string","null"] }, status: { type: "string" },
        tracking: { type: "array", items: { type: "object", required:["number"], properties: {
          number: { type: "string" }, url: { type: ["string","null"] }, company: { type: ["string","null"] }
        } } }
      } }, default: [] }
    }},
    execute: getByNumberAndEmail
  },

  "products.getVariantAvailability": {
    description: "Normalized availability for a variant (by variantId)",
    inputSchema: { type: "object", required: ["variantId"], properties: { variantId: { type: "string" } } },
    outputSchema: { type: "object", required: ["variantId","availability"], properties: {
      variantId: { type: "string" }, sku: { type: ["string","null"] },
      tracked: { type: ["boolean","null"] },
      inventoryPolicy: { enum: ["CONTINUE","DENY",null] },
      quantity: { type: ["number","null"] },
      availableForSale: { type: ["boolean","null"] },
      availability: { enum: ["IN_STOCK","LOW_STOCK","OOS_CONTINUE_SELL","OOS_STOP_SELL","UNTRACKED","UNKNOWN"] }
    }},
    execute: getVariantAvailability
  },

  "products.getAvailabilityBySku": {
    description: "Availability for a product by SKU (resolves variantId internally)",
    inputSchema: { type: "object", required: ["sku"], properties: { sku: { type: "string" } } },
    outputSchema: { type: "object", required: ["availability"], properties: {
      sku: { type: "string" }, variantId: { type: ["string","null"] },
      tracked: { type: ["boolean","null"] },
      inventoryPolicy: { enum: ["CONTINUE","DENY",null] },
      quantity: { type: ["number","null"] },
      availableForSale: { type: ["boolean","null"] },
      availability: { enum: ["IN_STOCK","LOW_STOCK","OOS_CONTINUE_SELL","OOS_STOP_SELL","UNTRACKED","UNKNOWN"] },
      reason: { type: ["string","null"] }
    }},
    execute: getAvailabilityBySku
  },

  "cart.createCheckout": {
    description: "Builds a cart and returns checkoutUrl (variantId-based)",
    inputSchema: { type: "object", required: ["lines","email","shippingAddress"], properties: {
      lines: { type: "array", items: { type: "object", required: ["quantity"], properties: {
        merchandiseId: { type: ["string","null"] }, quantity: { type: "integer", minimum: 1 }
      }} },
      email: { type: "string", format: "email" },
      shippingAddress: { type: "object" }
    }},
    outputSchema: { type: "object", required: ["checkoutUrl"], properties: {
      cartId: { type: "string" }, checkoutUrl: { type: "string" }
    }},
    execute: createCheckout
  },

  "cart.createCheckoutBySku": {
    description: "Builds a cart from SKUs and returns checkoutUrl",
    inputSchema: { type: "object", required: ["lines","email","shippingAddress"], properties: {
      lines: { type: "array", items: { type: "object", required: ["sku","quantity"], properties: {
        sku: { type: "string" }, quantity: { type: "integer", minimum: 1 }
      }} },
      email: { type: "string", format: "email" },
      shippingAddress: { type: "object" }
    }},
    outputSchema: { type: "object", required: [], properties: {
      cartId: { type: "string" },
      checkoutUrl: { type: ["string","null"] },
      missingSkus: { type: "array", items: { type: "string" } },
      code: { type: ["string","null"] }
    }},
    execute: createCheckoutBySku
  },

  "draftOrders.create": {
    description: "Creates a draft order and returns invoiceUrl (variantId-based)",
    inputSchema: { type: "object", required: ["lines","email"], properties: {
      lines: { type: "array", items: { type: "object", required: ["quantity"], properties: {
        variantId: { type: ["string","null"] }, quantity: { type: "integer", minimum: 1 }
      }} },
      email: { type: "string", format: "email" },
      shippingAddress: { type: ["object","null"] },
      tags: { type: "array", items: { type: "string" } }
    }},
    outputSchema: { type: "object", required: ["invoiceUrl"], properties: {
      draftOrderId: { type: "string" }, invoiceUrl: { type: "string" }
    }},
    execute: createDraftOrder
  },

  "draftOrders.createBySku": {
    description: "Creates a draft order from SKUs and returns invoiceUrl",
    inputSchema: { type: "object", required: ["lines","email"], properties: {
      lines: { type: "array", items: { type: "object", required: ["sku","quantity"], properties: {
        sku: { type: "string" }, quantity: { type: "integer", minimum: 1 }
      }} },
      email: { type: "string", format: "email" },
      shippingAddress: { type: ["object","null"] },
      tags: { type: "array", items: { type: "string" } }
    }},
    outputSchema: { type: "object", required: [], properties: {
      draftOrderId: { type: "string" },
      invoiceUrl: { type: ["string","null"] },
      missingSkus: { type: "array", items: { type: "string" } },
      code: { type: ["string","null"] }
    }},
    execute: createDraftOrderBySku
  },

  "customers.findOrCreateByEmail": {
    description: "Find or create a customer by email",
    inputSchema: { type: "object", required: ["email"], properties: {
      email: { type: "string", format: "email" }
    }},
    outputSchema: { type: "object", required: ["id","email","created"], properties: {
      id: { type: "string" }, email: { type: "string" }, created: { type: "boolean" }
    }},
    execute: findOrCreateByEmail
  }
};
