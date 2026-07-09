"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Utility function to convert VAPID key for cross-browser support
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Fallback for Safari's older callback-based API
async function requestNotificationPermission() {
  if (!("Notification" in window)) return "denied";

  if (Notification.permission === "granted") return "granted";

  try {
    return await Notification.requestPermission();
  } catch {
    return new Promise((resolve) => {
      Notification.requestPermission((result) => resolve(result));
    });
  }
}

export function PushNotificationManager() {
  const [showPrompt, setShowPrompt] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    async function checkPermission() {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        return;
      }

      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) return; // Must be logged in
      setUser(data.user);

      if (Notification.permission === "granted") {
        // If already granted, we can safely setup push silently
        setupPush(data.user);
      } else if (Notification.permission === "default") {
        // Check if user has previously dismissed the prompt (using localStorage)
        const dismissed = localStorage.getItem("pushPromptDismissed");
        if (!dismissed) {
          setShowPrompt(true);
        }
      }
    }

    checkPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  async function setupPush(currentUser = user) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Ask for permission ONLY here, triggered by user gesture (or silently if already granted)
      const permission = await requestNotificationPermission();

      if (permission === "granted") {
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          if (!vapidPublicKey) return;

          const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          });
        }

        const res = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscription: subscription.toJSON(),
            userId: currentUser.id, // Enforce non-null ID
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          console.error("API error response:", errData);
        }

        setShowPrompt(false);
      } else {
        // Handle denied
        setShowPrompt(false);
      }
    } catch (err) {
      console.error("Failed to setup push notifications:", err);
    }
  }

  const handleDismiss = () => {
    localStorage.setItem("pushPromptDismissed", "true");
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-4 md:w-96 bg-white rounded-xl shadow-2xl border border-slate-100 p-4 z-50 flex items-start gap-4 animate-in slide-in-from-bottom-5">
      <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center shrink-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-sm text-slate-900 mb-1">
          Aktifkan Notifikasi
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Dapatkan pemberitahuan terbaru mengenai pesanan dan chat tokomu.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setupPush(user)}
            className="px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Aktifkan
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-200 transition-colors"
          >
            Nanti Saja
          </button>
        </div>
      </div>
    </div>
  );
}
