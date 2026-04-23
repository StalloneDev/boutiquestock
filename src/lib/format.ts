export function formatCurrency(amount: string | number | null | undefined): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount || 0;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XAF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace("XAF", "FCFA");
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(new Date(dateStr));
}
