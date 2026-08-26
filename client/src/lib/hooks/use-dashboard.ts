"use client";

import { useQuery } from "@tanstack/react-query";

import { getDashboard } from "@/lib/api/dashboard";
import { queryKeys } from "./keys";

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: getDashboard,
  });
}
