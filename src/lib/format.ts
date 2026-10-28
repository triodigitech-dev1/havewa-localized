export function money(value: number | string, locale = "en") {
  const n = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-KE", {
    style: "currency",
    currency: "KES",
  }).format(n);
}

export function date(value: Date | string | null | undefined, locale = "en") {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB").format(d);
}
