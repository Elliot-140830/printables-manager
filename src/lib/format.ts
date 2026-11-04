export const kr = (n: number) =>
  new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 2 }).format(n);
export const dateSv = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("sv-SE", { day: "numeric", month: "short" }) : "—";
export const today = () => new Date().toISOString().slice(0, 10);
