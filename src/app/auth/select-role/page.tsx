"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { fetchUserAccess, type UserAccess } from "@/lib/auth-access";
import { Logo } from "@/components/Logo";
import { ShoppingBag, LayoutDashboard, Store, Loader2 } from "lucide-react";

interface RoleOption {
  label: string;
  description: string;
  icon: React.ReactNode;
  route: string;
}

function buildOptions(access: UserAccess): RoleOption[] {
  const options: RoleOption[] = [];

  if (access.hasOrganisasi) {
    options.push({
      label: "Pengelola Organisasi",
      description: "Kelola toko, produk, dan laporan organisasi Anda",
      icon: <Store className="w-7 h-7" />,
      route: "/org-dashboard",
    });
  }

  if (access.hasProker) {
    options.push({
      label: "Pengelola Proker",
      description: "Kelola sub-toko dan produk program kerja Anda",
      icon: <LayoutDashboard className="w-7 h-7" />,
      route: "/dashboard",
    });
  }

  options.push({
    label: "Pembeli",
    description: "Jelajahi dan beli produk dari berbagai organisasi",
    icon: <ShoppingBag className="w-7 h-7" />,
    route: "/explore",
  });

  return options;
}

export default function SelectRolePage() {
  const router = useRouter();
  const [options, setOptions] = useState<RoleOption[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const access = await fetchUserAccess(supabase, user.email!);

      if (!access || !access.needsSelection) {
        router.replace("/explore");
        return;
      }

      if (access.role === "admin") {
        router.replace("/admin");
        return;
      }

      setOptions(buildOptions(access));
      setLoading(false);
    });
  }, [router]);

  if (loading || !options) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-8 text-center">
            <Logo className="justify-center mb-6" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Masuk Sebagai
            </h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Pilih mode yang ingin Anda gunakan saat ini.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {options.map((option, i) => (
              <motion.button
                key={option.route}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.35 }}
                onClick={() => router.push(option.route)}
                style={{ touchAction: "manipulation" }}
                className="flex items-center gap-5 p-5 text-left transition-all bg-white border-2 border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-2xl hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-lg hover:shadow-primary-100 dark:hover:shadow-primary-900/20 group"
              >
                <div className="flex items-center justify-center shrink-0 w-14 h-14 transition-colors border rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30 group-hover:border-primary-100 dark:group-hover:border-primary-800 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                  {option.icon}
                </div>
                <div>
                  <p className="font-semibold transition-colors text-slate-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-300">
                    {option.label}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    {option.description}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
