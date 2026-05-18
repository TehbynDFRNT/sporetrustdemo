"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

// Single QueryClient for the whole /admin section. Defaults are tuned so the
// app does NOT re-fetch on every page mount — staleTime keeps data fresh for
// a minute, gcTime keeps the cached payload around for 5 minutes after the
// last component using it unmounts. Re-visiting a table within that window
// is instant.
export default function QueryProvider({ children }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            retry: 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
