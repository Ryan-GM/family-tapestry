import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { HeirloomLogo } from "@/components/brand/HeirloomLogo";
import { supabase } from "@/integrations/supabase/client";
import { seo } from "@/lib/site";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () =>
    seo({
      title: "Verifying your account — Heirloom",
      description: "Completing sign-in and returning you to your family trees.",
      indexable: false,
    }),
  component: AuthCallback,
});

/**
 * Only same-origin app paths are accepted, so a crafted `next=` value can never
 * turn the verification link into an open redirect.
 */
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/trees";
  return raw;
}

function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const next = safeNext(params.get("next"));
    const code = params.get("code");
    const errorDescription = params.get("error_description");

    const finish = async () => {
      if (errorDescription) {
        if (active) setError(errorDescription);
        return;
      }
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError && active) {
          setError(exchangeError.message);
          return;
        }
      }
      // Hash-token links are consumed by the Supabase client on load.
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) {
        navigate({ to: next, replace: true });
      } else {
        navigate({ to: "/auth", replace: true });
      }
    };

    void finish();
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <main className="star-field grid min-h-screen place-items-center px-4">
      <div className="text-center">
        <HeirloomLogo className="justify-center" />
        <p className="mt-6 text-sm text-muted-foreground">
          {error ? `We couldn't finish verifying: ${error}` : "Verifying your account…"}
        </p>
      </div>
    </main>
  );
}
