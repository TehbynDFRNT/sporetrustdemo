"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

// Debounced autosave for a single row (sample_location, image_capture,
// moisture_reading, …). The component holds local UI state for each field
// and pushes changes through `set(field, value)`. We batch every change
// inside the debounce window into one PATCH so a flurry of keystrokes only
// hits the server once.
//
// Usage:
//   const save = useAutosaveRow({
//     endpoint: `/api/admin/sample-locations/${id}`,
//     invalidate: ["admin-location", id],
//   });
//   save.set("name", "Bathroom");          // debounced
//   save.flushNow("name", "Bathroom");     // bypass debounce, e.g. on blur
//   save.status; save.lastSavedAt; save.error;
//
// invalidate: a TanStack queryKey to invalidate on successful save, so any
// other view that's reading the row updates immediately.
export function useAutosaveRow({ endpoint, invalidate, debounceMs = 500 }) {
  const qc = useQueryClient();
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const mutation = useMutation({
    mutationFn: async (patch) => {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || `PATCH ${endpoint} → ${res.status}`);
      }
      return json;
    },
    onSuccess: () => {
      setLastSavedAt(Date.now());
      if (invalidate) qc.invalidateQueries({ queryKey: invalidate });
    },
  });

  const pending = useRef({});
  const timer = useRef(null);

  const flushPending = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (Object.keys(pending.current).length === 0) return;
    const patch = pending.current;
    pending.current = {};
    mutation.mutate(patch);
  }, [mutation]);

  const set = useCallback(
    (field, value) => {
      pending.current[field] = value;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flushPending, debounceMs);
    },
    [flushPending, debounceMs],
  );

  // Bypass the debounce — useful on <select> change or on input blur, where
  // the user has clearly finished editing.
  const flushNow = useCallback(
    (field, value) => {
      if (field !== undefined) pending.current[field] = value;
      flushPending();
    },
    [flushPending],
  );

  // Final flush on unmount so an in-flight debounce isn't lost when the
  // technician navigates away mid-edit.
  useEffect(() => {
    return () => {
      if (timer.current) {
        flushPending();
      }
    };
  }, [flushPending]);

  return {
    set,
    flushNow,
    status: mutation.status,
    error: mutation.error,
    lastSavedAt,
    isPending: mutation.isPending,
  };
}
