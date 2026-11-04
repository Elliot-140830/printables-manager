import { describe, expect, it } from "vitest";
import { calcPrice, productPrice, shouldDeductFilament, economySummary, filamentUsage } from "./pricing";

describe("pricing", () => {
  it("uses grams*0.25 + minutes*0.1", () => {
    expect(calcPrice(45, 120)).toBe(23.25);
  });
  it("manual override wins", () => {
    expect(productPrice({ grams: 70, print_minutes: 180, price_override: 49 })).toBe(49);
  });
  it("deducts filament only after confirmed printing, not when planned", () => {
    expect(shouldDeductFilament("planerad", false)).toBe(false);
    expect(shouldDeductFilament("printas", false)).toBe(false);
    expect(shouldDeductFilament("efterarbete", false)).toBe(true);
    expect(shouldDeductFilament("klar", true)).toBe(false);
  });
  it("sums filament per colour", () => {
    expect(filamentUsage([{ color: "Blå", grams: 8, quantity: 5, unit_price: 1 }])).toEqual({ Blå: 40 });
  });
  it("does not treat tax as zero", () => {
    const s = economySummary({
      orders: [{ paid: true, total: 125 }],
      expenses: [25],
      taxPercent: 25,
      allocations: [{ name: "Farmloop", percent: 10 }],
    });
    expect(s.tax).toBe(25);
    expect(s.profit).toBe(75);
    expect(s.allocations[0].amount).toBe(7.5);
  });
});
