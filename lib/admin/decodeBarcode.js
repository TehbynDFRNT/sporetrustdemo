"use client";

import { BarcodeDetector } from "barcode-detector/ponyfill";

// One detector instance for the whole app — instantiating it loads the
// ZBar wasm (~200KB) on first construction, so we keep it around. The
// ponyfill picks the browser's native BarcodeDetector when available
// (Chrome / Edge on Android) and falls back to ZBar everywhere else.
//
// Format list is biased to what you actually see on lab cassettes /
// asset tags — Code 128 is the workhorse for pharma + lab IDs, Data
// Matrix is increasingly common, the rest are catches for edge cases.
let _detector = null;
function getDetector() {
  if (_detector) return _detector;
  _detector = new BarcodeDetector({
    formats: ["code_128", "data_matrix", "code_39", "qr_code", "ean_13"],
  });
  return _detector;
}

// Decode the first barcode found in an image file. Returns the raw value
// (a string) or null if nothing decoded — never throws. Closes the
// ImageBitmap to free the underlying memory on browsers that support it.
export async function decodeBarcode(file) {
  if (!file || typeof window === "undefined") return null;
  try {
    const bitmap = await createImageBitmap(file);
    const codes = await getDetector().detect(bitmap);
    if (typeof bitmap.close === "function") bitmap.close();
    return codes[0]?.rawValue ?? null;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[decodeBarcode] failed:", err);
    return null;
  }
}
