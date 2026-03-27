"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";
import { Toaster } from "sonner";

export function Providers({ children }: { children: ReactNode }) {
  const initializeAuth = useAuthStore((s) => s.initialize);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: { retry: 0 },
        },
      }),
  );

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-center" richColors />
      {children}
    </QueryClientProvider>
  );
}
