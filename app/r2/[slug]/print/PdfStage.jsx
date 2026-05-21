"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// react-pdf module evaluation references browser-only globals
// (DOMMatrix, OffscreenCanvas) so this file MUST only ever load in the
// browser. It's the dynamic-import target from PrintViewer with
// `ssr: false` — never imported directly from a server component.
//
// Worker file is served from /public — re-copy after bumping pdfjs-dist:
//   cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export default function PdfStage({ pdfSrc, reloadKey }) {
  const [numPages, setNumPages] = useState(0);
  const [loadError, setLoadError] = useState(null);
  const stageRef = useRef(null);
  const [pageWidth, setPageWidth] = useState(720);

  useEffect(() => {
    if (!stageRef.current) return;
    const el = stageRef.current;
    const update = () => {
      const w = el.clientWidth;
      const next = Math.max(320, Math.min(960, w - 32));
      setPageWidth(next);
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    setNumPages(0);
    setLoadError(null);
  }, [pdfSrc]);

  const fileSrc = useMemo(() => pdfSrc, [pdfSrc]);

  return (
    <div className="pviewer__stage" ref={stageRef}>
      {loadError ? (
        <div className="pviewer__error">
          <p>Couldn't load the PDF.</p>
          <p className="pviewer__error-detail">{loadError}</p>
        </div>
      ) : (
        <Document
          key={reloadKey}
          file={fileSrc}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
          onLoadError={(err) => setLoadError(err?.message || String(err))}
          loading={<div className="pviewer__loading">Preparing PDF…</div>}
          error={<div className="pviewer__error"><p>Couldn't load the PDF.</p></div>}
          className="pviewer__doc"
        >
          {Array.from({ length: numPages }, (_, i) => (
            <Page
              key={i + 1}
              pageNumber={i + 1}
              width={pageWidth}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              className="pviewer__page"
              loading={<div className="pviewer__page-skeleton" style={{ width: pageWidth }} />}
            />
          ))}
        </Document>
      )}
    </div>
  );
}
