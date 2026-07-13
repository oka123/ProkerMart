/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share2, Plus, Smartphone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Catch the event as early as possible before React hydration
let globalDeferredPrompt: any = null;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    globalDeferredPrompt = e;
    window.dispatchEvent(new Event("pwa-prompt-ready"));
  });
}

// For Framer Motion, since we're rendering client-side
export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  // Ref mirrors state — always holds the latest prompt even across async boundaries
  const deferredPromptRef = useRef<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isAppleDevice, setIsAppleDevice] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const pathname = usePathname();

  // const cooldown = 1 * 24 * 60 * 60 * 1000; // 1 day
  const cooldown = 0;

  // Persistent listener: update ref+state whenever a new beforeinstallprompt fires
  // This is critical because registering a Service Worker (e.g. from PushNotificationManager)
  // invalidates the previously captured prompt — Chrome then fires a new one.
  useEffect(() => {
    const handleNewPrompt = () => {
      if (globalDeferredPrompt) {
        deferredPromptRef.current = globalDeferredPrompt;
        setDeferredPrompt(globalDeferredPrompt);
        console.log("[PWA] New beforeinstallprompt captured");
      }
    };
    window.addEventListener("pwa-prompt-ready", handleNewPrompt);
    // Also hydrate from already-captured global in case component mounted late
    if (globalDeferredPrompt && !deferredPromptRef.current) {
      handleNewPrompt();
    }
    return () => window.removeEventListener("pwa-prompt-ready", handleNewPrompt);
  }, []);

  // Check cooldown on route/pathname change
  useEffect(() => {
    const dismissedTime = localStorage.getItem("pwa-prompt-dismissed");
    const now = Date.now();
    if (dismissedTime && now - parseInt(dismissedTime, 10) < cooldown) {
      queueMicrotask(() => {
        setShowPrompt(false);
      });
    }
  }, [pathname, cooldown]);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    const isInstalled = checkStandalone();
    if (isInstalled) return;

    // Detect Apple devices (iOS Safari and macOS Safari)
    const detectApple = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const iOS = /iphone|ipad|ipod/.test(userAgent);
      const macSafari = /macintosh/.test(userAgent) && /safari/.test(userAgent) && !/chrome/.test(userAgent);
      
      setIsIOS(iOS);
      setIsAppleDevice(iOS || macSafari);
      
      return iOS || macSafari;
    };

    const appleDevice = detectApple();

    // Check dismissal cooldown
    const checkCooldown = () => {
      const latestDismissedTime = localStorage.getItem("pwa-prompt-dismissed");
      const currentNow = Date.now();
      return (
        latestDismissedTime &&
        currentNow - parseInt(latestDismissedTime, 10) < cooldown
      );
    };

    if (checkCooldown()) return;

    // Handle Android/Desktop Install
    const handleInstallPrompt = async () => {
      if (checkCooldown()) return;
      if (globalDeferredPrompt) {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          // Update both ref (immediate) and state (for render)
          deferredPromptRef.current = globalDeferredPrompt;
          setDeferredPrompt(globalDeferredPrompt);
          setShowPrompt(true);
        }
      }
    };

    const fallbackListener = (e: Event) => {
      e.preventDefault();
      globalDeferredPrompt = e;
      handleInstallPrompt();
    };

    // If it was already caught before this component mounted
    if (globalDeferredPrompt) {
      handleInstallPrompt();
    } else {
      // Listen for our custom ready event
      window.addEventListener("pwa-prompt-ready", handleInstallPrompt);
      // Fallback native listener just in case
      window.addEventListener("beforeinstallprompt", fallbackListener);
    }

    // For Apple Safari (iOS and macOS), show the prompt manually after a small delay since there's no install event
    let timer: NodeJS.Timeout;
    if (appleDevice) {
      timer = setTimeout(async () => {
        if (checkCooldown()) return;
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          setShowPrompt(true);
        }
      }, 5000);
    }

    return () => {
      window.removeEventListener("pwa-prompt-ready", handleInstallPrompt);
      window.removeEventListener("beforeinstallprompt", fallbackListener);
      if (timer) clearTimeout(timer);
    };
  }, [cooldown, pathname]);

  const handleInstallClick = async () => {
    // Prefer state value, but fall back to ref in case of React async state lag
    const prompt = deferredPrompt || deferredPromptRef.current || globalDeferredPrompt;
    if (!prompt) return;
    try {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      console.log(`[PWA] Install prompt outcome: ${outcome}`);
    } catch (e) {
      console.error("[PWA] prompt() failed:", e);
    } finally {
      deferredPromptRef.current = null;
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-110 bg-white rounded-2xl shadow-2xl border border-slate-150 p-5 overflow-hidden"
        >
          {/* Top colored accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-blue-500 to-blue-600" />

          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-sm md:text-base leading-snug">
                  Pasang Aplikasi ProkerMart
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Akses belanja produk ormawa lebih cepat langsung dari layar
                  utama perangkat Anda.
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isAppleDevice ? (
            // Apple Custom Instructions
            <div className="mt-4 bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-2.5 border border-slate-100">
              <p className="font-semibold text-slate-700">
                Cara memasang di {isIOS ? "iOS Safari" : "macOS Safari"}:
              </p>
              {isIOS ? (
                <>
                  <div className="flex items-start gap-2.5">
                    <div className="bg-white border border-slate-200 rounded px-1.5 py-0.5 mt-0.5 text-slate-700 font-semibold shadow-sm flex items-center justify-center">
                      <Share2 className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span className="leading-snug">
                      Tekan tombol <strong>Bagikan (Share)</strong> pada navigasi
                      browser Anda.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="bg-white border border-slate-200 rounded px-1.5 py-0.5 mt-0.5 text-slate-700 font-semibold shadow-sm flex items-center justify-center">
                      <Plus className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span className="leading-snug">
                      Gulir ke bawah dan pilih opsi{" "}
                      <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-start gap-2.5">
                  <span className="leading-snug">
                    Buka menu <strong>File</strong> di menu bar atas browser Anda, lalu pilih opsi{" "}
                    <strong>Tambahkan ke Dock (Add to Dock)</strong>.
                  </span>
                </div>
              )}
            </div>
          ) : (
            // Android/Desktop Install Action
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleDismiss}
                className="flex-1 py-2 px-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 transition-colors"
              >
                Nanti Saja
              </button>
              <button
                onClick={handleInstallClick}
                className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Pasang Sekarang
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
