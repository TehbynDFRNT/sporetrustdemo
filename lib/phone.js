/* AU phone helpers — shared by the PhoneInput component (display formatting)
   and lead validation/submission (E.164 normalisation). */

export function normalizeAuPhone(value) {
  const raw = String(value || "").trim();
  let digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("0011")) digits = digits.slice(4);
  if ((raw.startsWith("+") && digits.startsWith("61")) || (digits.startsWith("61") && digits.length >= 11)) {
    digits = digits.slice(2);
  }
  if (digits.startsWith("0")) digits = digits.slice(1);

  // AU national significant numbers are 9 digits (mobile 4xx xxx xxx,
  // landline area code + 8). Anything shorter can't be conformed.
  if (digits.length < 9) return "";

  return `+61${digits.slice(0, 9)}`;
}

export function formatAuPhoneDisplay(value) {
  const e164 = normalizeAuPhone(value);
  if (!e164) return null;

  const nsn = e164.slice(3);
  if (nsn.startsWith("4") || nsn.startsWith("5")) {
    return `+61 ${nsn.slice(0, 3)} ${nsn.slice(3, 6)} ${nsn.slice(6)}`;
  }
  return `+61 ${nsn[0]} ${nsn.slice(1, 5)} ${nsn.slice(5)}`;
}
