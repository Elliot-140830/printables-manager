export type PricingRates = { perGram: number; perMinute: number };

export const DEFAULT_RATES: PricingRates = { perGram: 0.25, perMinute: 0.1 };

const round2 = (n: number) => Math.round(n * 100) / 100;

/** price = grams * 0.25 + print_time_minutes * 0.1 (rates configurable) */
export function calcPrice(grams: number, minutes: number, rates: PricingRates = DEFAULT_RATES) {
  return round2(grams * rates.perGram + minutes * rates.perMinute);
}

export function productPrice(
  p: { grams: number; print_minutes: number; price_override: number | null },
  rates: PricingRates = DEFAULT_RATES,
) {
  return p.price_override != null ? Number(p.price_override) : calcPrice(Number(p.grams), Number(p.print_minutes), rates);
}

export type ItemLike = { quantity: number; unit_price: number; grams: number; color: string };

export function orderTotal(items: ItemLike[]) {
  return round2(items.reduce((s, i) => s + Number(i.unit_price) * i.quantity, 0));
}

/** Grams of filament per colour needed for the given items. */
export function filamentUsage(items: ItemLike[]) {
  const map: Record<string, number> = {};
  for (const i of items) map[i.color] = (map[i.color] ?? 0) + Number(i.grams) * i.quantity;
  return map;
}

/** Statuses where printing is confirmed and filament should have been subtracted. */
export const PRINTED_STATUSES = ["efterarbete", "klar", "levererad"] as const;

export function shouldDeductFilament(status: string, alreadyDeducted: boolean) {
  return !alreadyDeducted && (PRINTED_STATUSES as readonly string[]).includes(status);
}

/** VAT included in a gross amount. */
export function includedTax(gross: number, taxPercent: number) {
  return round2((gross * taxPercent) / (100 + taxPercent));
}

export function economySummary(args: {
  orders: { paid: boolean; total: number }[];
  expenses: number[];
  taxPercent: number;
  allocations: { name: string; percent: number }[];
}) {
  const revenue = round2(args.orders.reduce((s, o) => s + o.total, 0));
  const received = round2(args.orders.filter((o) => o.paid).reduce((s, o) => s + o.total, 0));
  const unpaid = round2(revenue - received);
  const expenses = round2(args.expenses.reduce((s, e) => s + e, 0));
  const tax = includedTax(revenue, args.taxPercent);
  const profit = round2(revenue - tax - expenses);
  const allocations = args.allocations.map((a) => ({
    ...a,
    amount: round2((Math.max(profit, 0) * a.percent) / 100),
  }));
  return { revenue, received, unpaid, expenses, tax, profit, allocations };
}
