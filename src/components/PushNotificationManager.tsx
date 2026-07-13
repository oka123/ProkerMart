"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Utility function to convert VAPID key — handles padding and charset normalization
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Cross-browser safe subscription key extraction
// Safari / WebKit returns ArrayBuffer for keys, not strings
function extractSubscriptionKeys(
  sub: PushSubscription,
): { p256dh: string; auth: string } | null {
  try {
    const json = sub.toJSON();
    if (json.keys?.p256dh && json.keys?.auth) {
      return { p256dh: json.keys.p256dh, auth: json.keys.auth };
    }
    // Fallback: manually extract from ArrayBuffer (Safari WebKit quirk)
    const p256dhBuffer = sub.getKey("p256dh");
    const authBuffer = sub.getKey("auth");
    if (!p256dhBuffer || !authBuffer) return null;

    const p256dh = btoa(String.fromCharCode(...new Uint8Array(p256dhBuffer)));
    const auth = btoa(String.fromCharCode(...new Uint8Array(authBuffer)));
    return { p256dh, auth };
  } catch (e) {
    console.error("[Push] Failed to extract subscription keys:", e);
    return null;
  }
}

// Register subscription to backend
async function registerSubscription(
  subscription: PushSubscription,
  userId: string,
) {
  const keys = extractSubscriptionKeys(subscription);
  if (!keys) {
    console.error("[Push] Could not extract subscription keys");
    return;
  }

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subscription: { endpoint: subscription.endpoint, keys },
      userId,
    }),
  });

  if (!res.ok) {
    const errData = await res.json();
    console.error("[Push] API error:", errData);
  }
}

// Subscribe to push after permission is already granted
// This is safe to call from non-gesture context since permission is pre-granted
async function subscribePush(userId: string) {
  try {
    if (!("PushManager" in window)) {
      console.warn("[Push] PushManager not available");
      return;
    }

    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error("[Push] VAPID public key missing");
        return;
      }
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          vapidPublicKey,
        ) as unknown as ArrayBuffer,
      });
    }

    await registerSubscription(subscription, userId);
  } catch (err) {
    console.error("[Push] subscribePush failed:", err);
  }
}

export function PushNotificationManager() {
  const [showPrompt, setShowPrompt] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const pathname = usePathname();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Reset check flag on route change so it runs once per page visit
    hasCheckedRef.current = false;
  }, [pathname]);

  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    async function checkPermission() {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("Notification" in window)
      ) {
        return;
      }

      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      setUser(data.user);

      if (Notification.permission === "granted") {
        // Already granted — silently re-subscribe
        subscribePush(data.user.id);
      } else if (Notification.permission === "default") {
        // Show banner — permission will be requested on click (user gesture)
        setShowPrompt(true);
      }
      // "denied" — do nothing, respect user choice
    }

    checkPermission();
  }, [pathname]);

  /**
   * iOS FIX: Notification.requestPermission() MUST be called synchronously
   * as the VERY FIRST operation in a click handler (user gesture).
   *
   * Any async operation (await) before requestPermission() will break the
   * user gesture chain on iOS/Safari, resulting in "NotAllowedError".
   *
   * Strategy:
   * 1. Call Notification.requestPermission() as a Promise (not await) first
   * 2. In the .then() callback, proceed with SW registration and push subscribe
   */
  const handleActivate = () => {
    if (!user?.id || isRequesting) return;
    setIsRequesting(true);

    // Step 1: SYNCHRONOUSLY kick off the permission request (no await before this!)
    // This preserves the user gesture context required by iOS Safari.
    const permissionPromise = Notification.requestPermission();

    // Step 2: Handle the result — this runs after browser shows permission dialog
    permissionPromise
      .then(async (permission) => {
        if (permission !== "granted") {
          console.warn("[Push] Permission not granted:", permission);
          setShowPrompt(false);
          return;
        }

        // Step 3: Permission granted — now safe to do async SW + push subscribe
        await subscribePush(user.id);
      })
      .catch((err) => {
        console.error("[Push] requestPermission failed:", err);
      })
      .finally(() => {
        setIsRequesting(false);
        setShowPrompt(false);
      });
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 md:right-auto md:w-96 bg-white rounded-xl shadow-2xl border border-slate-100 p-4 z-120 flex items-start gap-4 animate-in slide-in-from-bottom-5">
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
            onClick={handleActivate}
            disabled={isRequesting}
            className="px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isRequesting ? "Meminta izin..." : "Aktifkan"}
          </button>
          <button
            onClick={handleDismiss}
            disabled={isRequesting}
            className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-200 transition-colors"
          >
            Nanti Saja
          </button>
        </div>
      </div>
    </div>
  );
}
