"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const run = async () => {
      const code = params.get("code");

      if (!code) {
        router.replace("/login");
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("exchangeCodeForSession error:", error);
        router.replace("/login");
        return;
      }

      router.replace("/dashboard");
    };

    run();
  }, [params, router]);

  return <p>Signing you in…</p>;
}
