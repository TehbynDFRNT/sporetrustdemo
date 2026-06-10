"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

// Wraps a multipart POST to /api/admin/image-captures. Returns a mutate
// function the wizard step calls with { file, capture_kind, pair_group,
// caption? }. We append inspection_id + sample_location_id from the closure
// so the calling component just hands over the file.
export function useImageUpload({ inspectionId, sampleLocationId, invalidate }) {
  const qc = useQueryClient();
  const [progress, setProgress] = useState(0); // reserved for future XHR-based progress

  const mutation = useMutation({
    mutationFn: async ({ file, capture_kind, pair_group = 1, caption }) => {
      if (!file) throw new Error("file required");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("inspection_id", String(inspectionId));
      fd.append("sample_location_id", String(sampleLocationId));
      fd.append("capture_kind", capture_kind);
      fd.append("pair_group", String(pair_group));
      if (caption) fd.append("caption", caption);

      setProgress(10);
      const res = await fetch("/api/admin/image-captures", {
        method: "POST",
        body: fd,
      });
      setProgress(90);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Upload failed (${res.status})`);
      setProgress(100);
      return json;
    },
    onSuccess: () => {
      if (invalidate) qc.invalidateQueries({ queryKey: invalidate });
    },
    onSettled: () => setTimeout(() => setProgress(0), 600),
  });

  return {
    upload: mutation.mutateAsync,
    status: mutation.status,
    error: mutation.error,
    isPending: mutation.isPending,
    progress,
  };
}

// Public CDN URL helper for paths under the `inspection-images` bucket.
// The bucket is currently created with public=true; flip it private and add
// a signed-URL endpoint when we tighten access later.
export function imageUrl(storagePath) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base || !storagePath) return null;
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/inspection-images/${storagePath}`;
}
