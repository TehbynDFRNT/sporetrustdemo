"use client";

/* AU phone input for the lead forms — numeric typing only (letters and
   punctuation are stripped as they're entered, including on paste), and the
   value conforms to +61 once the field is left: "0400 123 123" blurs to
   "+61 400 123 123". Display keeps human spacing; normalizeAuPhone gives the
   bare E.164 form ("+61400123123") for the lead payload. Renders a bare input
   so it inherits the host form's styling, like AddressAutocomplete. */

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

export default function PhoneInput({
  id,
  name = "phone",
  className = "lead-form__input",
  placeholder = "0400 000 000",
  required = false,
}) {
  function handleChange(event) {
    const el = event.currentTarget;
    const cleaned = el.value.replace(/[^\d+ ]/g, "");
    if (cleaned === el.value) return;

    const removed = el.value.length - cleaned.length;
    const cursor = Math.max(0, (el.selectionStart || 0) - removed);
    el.value = cleaned;
    el.setSelectionRange(cursor, cursor);
  }

  function handleBlur(event) {
    const pretty = formatAuPhoneDisplay(event.currentTarget.value);
    if (pretty) event.currentTarget.value = pretty;
  }

  return (
    <input
      id={id}
      name={name}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      className={className}
      placeholder={placeholder}
      required={required}
      maxLength={18}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
}
