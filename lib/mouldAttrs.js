export function mouldAttrs({
  mode,
  source,
  intensity,
  speckle,
  stain,
  seed,
  edgeBias,
  coverage,
  growthDuration,
  growthDelay,
  growthFeather,
  growthMode,
  growthSource,
  scrollRoot,
  scrollStart,
  scrollEnd,
  scrollLag,
  scrollMaturity,
  scrollEase,
  seedProgress,
  maxDpr,
  maxPixels,
  opacity,
}) {
  const attrs = {
    "data-mould": "true",
    "data-mould-mode": mode,
    "data-mould-source": source,
    "data-mould-intensity": String(intensity),
    "data-mould-speckle": String(speckle),
    "data-mould-stain": String(stain),
    "data-mould-seed": seed,
  };

  if (edgeBias != null) attrs["data-mould-edge-bias"] = String(edgeBias);
  if (coverage != null) attrs["data-mould-coverage"] = String(coverage);
  if (growthDuration != null) attrs["data-mould-growth-duration"] = String(growthDuration);
  if (growthDelay != null) attrs["data-mould-growth-delay"] = String(growthDelay);
  if (growthFeather != null) attrs["data-mould-growth-feather"] = String(growthFeather);
  if (growthMode != null) attrs["data-mould-growth-mode"] = growthMode;
  if (growthSource != null) attrs["data-mould-growth-source"] = growthSource;
  if (scrollRoot != null) attrs["data-mould-scroll-root"] = scrollRoot;
  if (scrollStart != null) attrs["data-mould-scroll-start"] = String(scrollStart);
  if (scrollEnd != null) attrs["data-mould-scroll-end"] = String(scrollEnd);
  if (scrollLag != null) attrs["data-mould-scroll-lag"] = String(scrollLag);
  if (scrollMaturity != null) attrs["data-mould-scroll-maturity"] = String(scrollMaturity);
  if (scrollEase != null) attrs["data-mould-scroll-ease"] = String(scrollEase);
  if (seedProgress != null) attrs["data-mould-seed-progress"] = String(seedProgress);
  if (maxDpr != null) attrs["data-mould-max-dpr"] = String(maxDpr);
  if (maxPixels != null) attrs["data-mould-max-pixels"] = String(maxPixels);
  if (opacity != null) attrs["data-mould-opacity"] = String(opacity);

  return attrs;
}
