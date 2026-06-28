"use client";

import { createContext, useContext } from "react";

export interface DashboardSubToko {
  id_sub_toko: string;
  id_member: string;
  nama_proker: string;
  nama_org: string;
  role: string;
}

interface DashboardContextValue {
  active: DashboardSubToko | null;
}

export const DashboardContext = createContext<DashboardContextValue>({ active: null });

export function useDashboard() {
  return useContext(DashboardContext);
}
