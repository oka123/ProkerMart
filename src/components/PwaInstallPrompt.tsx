"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share2, Plus, Smartphone } from "lucide-react";

// For Framer Motion, since we're rendering client-side
export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const pathname = usePathname();

  const cooldown = 1 * 24 * 60 * 60 * 1000; // 1 day

  // Check cooldown on route/pathname change
  useEffect(() => {
    const dismissedTime = localStorage.getItem("pwa-prompt-dismissed");
    const now = Date.now();
    if (dismissedTime && now - parseInt(dismissedTime, 10) < cooldown) {
      setShowPrompt(false);
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

    // Detect iOS devices
    const detectIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isApple = /iphone|ipad|ipod/.test(userAgent);
      // Ensure we exclude macOS / Chrome on iOS if they support standard installs
      setIsIOS(isApple);
      return isApple;
    };

    const iosDevice = detectIOS();

    // Check dismissal cooldown
    const dismissedTime = localStorage.getItem("pwa-prompt-dismissed");
    const now = Date.now();

    if (dismissedTime && now - parseInt(dismissedTime, 10) < cooldown) {
      return;
    }

    // Event listener for Android/Desktop install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      
      // Double check cooldown before showing
      const latestDismissedTime = localStorage.getItem("pwa-prompt-dismissed");
      const currentNow = Date.now();
      if (latestDismissedTime && currentNow - parseInt(latestDismissedTime, 10) < cooldown) {
        return;
      }
      
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // For iOS Safari, show the prompt manually after a small delay since there's no install event
    if (iosDevice) {
      const timer = setTimeout(() => {
        // Double check cooldown before showing
        const latestDismissedTime = localStorage.getItem("pwa-prompt-dismissed");
        const currentNow = Date.now();
        if (latestDismissedTime && currentNow - parseInt(latestDismissedTime, 10) < cooldown) {
          return;
        }
        setShowPrompt(true);
      }, 5000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, [cooldown]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Install prompt outcome: ${outcome}`);
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
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
          className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 bg-white rounded-2xl shadow-2xl border border-slate-150 p-5 overflow-hidden"
        >
          {/* Top colored accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-blue-500 to-indigo-600" />

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

          {isIOS ? (
            // iOS Custom Instructions
            <div className="mt-4 bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-2.5 border border-slate-100">
              <p className="font-semibold text-slate-700">
                Cara memasang di iOS Safari:
              </p>
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
                  <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>
                  .
                </span>
              </div>
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
