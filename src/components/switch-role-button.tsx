"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, LayoutDashboard, Store, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchUserAccess } from "@/lib/auth-access";

interface RoleOption {
  label: string;
  description: string;
  icon: React.ReactNode;
  route: string;
}

function buildOptions(hasOrganisasi: boolean, hasProker: boolean, currentRoute: string): RoleOption[] {
  const all: RoleOption[] = [];

  if (hasOrganisasi) {
    all.push({
      label: "Pengelola Organisasi",
      description: "Kelola toko dan laporan organisasi",
      icon: <Store className="w-5 h-5" />,
      route: "/org-dashboard",
    });
  }

  if (hasProker) {
    all.push({
      label: "Pengelola Proker",
      description: "Kelola sub-toko program kerja",
      icon: <LayoutDashboard className="w-5 h-5" />,
      route: "/dashboard",
    });
  }

  all.push({
    label: "Pembeli",
    description: "Jelajahi dan beli produk",
    icon: <ShoppingBag className="w-5 h-5" />,
    route: "/explore",
  });

  return all.filter((o) => !currentRoute.startsWith(o.route));
}

export function SwitchRoleButton({
  currentRoute,
  className,
  onNavigate,
}: {
  currentRoute: "/dashboard" | "/org-dashboard" | "/explore";
  className?: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [options, setOptions] = useState<RoleOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const CACHE_KEY = "switch_role_access";
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { hasOrganisasi, hasProker } = JSON.parse(cached);
        setOptions(buildOptions(hasOrganisasi, hasProker, currentRoute));
        setLoading(false);
        return;
      } catch {}
    }

    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const access = await fetchUserAccess(supabase, user.email!);
      if (!access) return;
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({
        hasOrganisasi: access.hasOrganisasi,
        hasProker: access.hasProker,
      }));
      setOptions(buildOptions(access.hasOrganisasi, access.hasProker, currentRoute));
      setLoading(false);
    });
  }, [currentRoute]);

  if (loading || options.length === 0) return null;

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className={className}
      >
        Ganti Mode
      </button>

      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
              onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ duration: 0.18 }}
                className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-slate-900">Ganti Mode</h2>
                  <button
                    onClick={(e) => { e.stopPropagation(); setOpen(false); }}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {options.map((option) => (
                    <button
                      key={option.route}
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log("[SwitchRole] option clicked at", e.clientX, e.clientY, "route:", option.route);
                        setOpen(false);
                        onNavigate?.();
                        router.push(option.route);
                      }}
                      className="flex items-center gap-4 p-3.5 text-left rounded-xl border border-slate-100 hover:border-primary-200 hover:bg-primary-50 transition-all group w-full"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors flex-shrink-0">
                        {option.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-primary-700">
                          {option.label}
                        </p>
                        <p className="text-xs text-slate-500">{option.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
