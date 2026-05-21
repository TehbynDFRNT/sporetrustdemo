"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { TEMPLATES } from "./templates";

// PdfStage pulls in react-pdf + pdfjs-dist which evaluates browser-only
// globals (DOMMatrix, OffscreenCanvas) at module load. Dynamic import
// with `ssr: false` keeps that bundle out of the server entirely.
const PdfStage = dynamic(() => import("./PdfStage"), {
  ssr: false,
  loading: () => <div className="pviewer__stage"><div className="pviewer__loading">Preparing PDF…</div></div>,
});

export default function PrintViewer({ slug, template, reportTitle, addressLine }) {
  const current = TEMPLATES[template] || TEMPLATES.homeowner;
  const pdfSrc = `/r2/${slug}/print/pdf?template=${current.id}`;

  return (
    <div className="pviewer">
      <header className="pviewer__bar">
        <div className="pviewer__bar-left">
          <Link href={`/r2/${slug}`} className="pviewer__back" aria-label="Back to the live report">
            ← Back
          </Link>
          <div className="pviewer__title">
            <strong>{reportTitle}</strong>
            {addressLine ? <span>{addressLine}</span> : null}
          </div>
        </div>
        <div className="pviewer__variant" aria-label="Current variant">
          {current.label}
        </div>
      </header>

      <PdfStage pdfSrc={pdfSrc} reloadKey={current.id} />
    </div>
  );
}
