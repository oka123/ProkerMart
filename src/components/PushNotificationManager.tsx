"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function PushNotificationManager() {
  useEffect(() => {
    async function setupPush() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        
        // Wait until service worker is ready
        await navigator.serviceWorker.ready;

        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          let subscription = await registration.pushManager.getSubscription();
          
          if (!subscription) {
            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!vapidPublicKey) return;

            // Convert base64 VAPID to Uint8Array
            const padding = "=".repeat((4 - (vapidPublicKey.length % 4)) % 4);
            const base64 = (vapidPublicKey + padding).replace(/-/g, "+").replace(/_/g, "/");
            const rawData = window.atob(base64);
            const outputArray = new Uint8Array(rawData.length);
            for (let i = 0; i < rawData.length; ++i) {
              outputArray[i] = rawData.charCodeAt(i);
            }

            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: outputArray,
            });
          }

          // Send subscription to server
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subscription: subscription.toJSON(),
              userId: user.id,
            }),
          });
        }
      } catch (err) {
        console.error("Failed to setup push notifications:", err);
      }
    }

    setupPush();
  }, []);

  return null;
}
