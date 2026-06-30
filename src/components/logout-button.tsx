"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton({ className }: { className?: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  // Infinity = block all clicks until useEffect fires and records actual mount time
  const mountedAt = useRef<number>(Infinity);
  useEffect(() => { mountedAt.current = Date.now(); }, []);

  const openConfirm = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Ignore ghost clicks within 600ms of component mount (post-navigation artifacts)
    if (Date.now() - mountedAt.current < 600) {
      console.log("[LogoutButton] ignored ghost click", Date.now() - mountedAt.current, "ms after mount");
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.replace("/auth/login");
  };

  return (
    <>
      <Button variant="default" onClick={openConfirm} className={className}>
        Keluar
      </Button>

      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Konfirmasi Keluar
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Apakah Anda yakin ingin keluar dari akun saat ini?
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setShowConfirm(false)}
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  className="w-full sm:w-auto"
                  onClick={handleConfirmLogout}
                >
                  Ya, Keluar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = "/auth/login";
}
