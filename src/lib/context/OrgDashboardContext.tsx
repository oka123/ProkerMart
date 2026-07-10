"use client";

import { createContext, useContext } from "react";

export interface OrgDashboardData {
  id_pengguna: string;
  id_organisasi: string;
  nama_organisasi: string;
  nomor_sk: string | null;
  status_verifikasi: "pending" | "verified" | "rejected";
  id_toko: string;
  nama_toko: string;
  email: string;
  unreadNotifications: number;
  logo?: string;
}

interface OrgDashboardContextValue {
  org: OrgDashboardData | null;
  refreshOrg: () => void;
}

export const OrgDashboardContext = createContext<OrgDashboardContextValue>({
  org: null,
  refreshOrg: () => {},
});

export function useOrgDashboard() {
  return useContext(OrgDashboardContext);
}
