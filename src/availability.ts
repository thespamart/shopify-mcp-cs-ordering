export type Availability =
  | "IN_STOCK"
  | "LOW_STOCK"
  | "OOS_CONTINUE_SELL"
  | "OOS_STOP_SELL"
  | "UNTRACKED"
  | "UNKNOWN";

export function normalizeAvailability(params: {
  tracked: boolean | null;
  quantity: number | null;
  inventoryPolicy: "CONTINUE" | "DENY" | null;
  availableForSale: boolean | null;
}): Availability {
  const { tracked, quantity, inventoryPolicy, availableForSale } = params;

  if (tracked === false) return "UNTRACKED";

  if (tracked === true && quantity !== null) {
    if (quantity > 3) return "IN_STOCK";
    if (quantity > 0) return "LOW_STOCK";
    return inventoryPolicy === "CONTINUE" ? "OOS_CONTINUE_SELL" : "OOS_STOP_SELL";
  }

  if (availableForSale === true) return "IN_STOCK";
  if (availableForSale === false && tracked === true) {
    return inventoryPolicy === "CONTINUE" ? "OOS_CONTINUE_SELL" : "OOS_STOP_SELL";
  }

  return "UNKNOWN";
}
