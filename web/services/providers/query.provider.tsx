"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useState } from "react";

/**
 * Provides a QueryClient to the application.
 * It also renders a Toaster to display errors in a toast format.
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element} A QueryClientProvider with a Toaster.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      {children}
    </QueryClientProvider>
  );
}
