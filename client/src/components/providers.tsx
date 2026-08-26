"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

import { AuthProvider } from "@/lib/hooks/use-auth";

/**
 * Global client-side providers: React Query for server-state caching,
 * next-themes for light/dark mode, and Sonner for toast notifications.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // Create the client once per browser session (not on every render).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>{children}</AuthProvider>
        <Toaster richColors closeButton position="top-right" />
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
