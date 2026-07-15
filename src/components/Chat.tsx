/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChatPopup } from "./ChatPopup";

function ChatInner() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    // Get initial session/user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Load user role once authenticated
  useEffect(() => {
    if (!user) {
      const init = async () => {
        await Promise.resolve();
        setRole(null);
      };
      init();
      return;
    }
    const getRole = async () => {
      try {
        const { data, error } = await supabase
          .from("pengguna")
          .select("role")
          .eq("id_pengguna", user.id)
          .single();
        if (!error && data) {
          setRole(data.role);
        }
      } catch (err) {
        console.error("[Chat - getRole] Error:", err);
      }
    };
    getRole();
  }, [user, supabase]);

  if (loading || !user || role === "admin") return null;

  // Path exclusion logic
  const isExcludedPath = (path: string) => {
    const excludedPrefixes = [
      "/dashboard",
      "/org-dashboard",
      "/checkout",
      "/auth",
      "/cart",
      "/admin",
      "/user/chat",
      "/invite",
    ];
    if (path === "/explore/nearby") return true;
    return excludedPrefixes.some((prefix) => path.startsWith(prefix));
  };

  if (isExcludedPath(pathname)) return null;

  return <ChatPopup user={user} supabase={supabase} />;
}

export function Chat() {
  return (
    <React.Suspense fallback={null}>
      <ChatInner />
    </React.Suspense>
  );
}
