"use client";

import { formatAuPhoneDisplay } from "../lib/phone";

/* AU phone input for the lead forms — numeric typing only (letters and
   punctuation are stripped as they're entered, including on paste), and the
   value conforms to +61 once the field is left: "0400 123 123" blurs to
   "+61 400 123 123". Helpers live in lib/phone.js; normalizeAuPhone gives the
   bare E.164 form for the lead payload. Renders a bare input so it inherits
   the host form's styling, like AddressAutocomplete. Extra props (aria-*,
   data-*) pass through to the input. */

export default function PhoneInput({
  id,
  name = "phone",
  className = "lead-form__input",
  placeholder = "0400 000 000",
  required = false,
  ...rest
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
      {...rest}
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
