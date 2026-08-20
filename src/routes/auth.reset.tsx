import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { HeirloomLogo } from "@/components/brand/HeirloomLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { seo } from "@/lib/site";

export const Route = createFileRoute("/auth/reset")({
  ssr: false,
  head: () =>
    seo({
      title: "Choose a new password — Heirloom",
      description: "Set a new password for your Heirloom account.",
      indexable: false,
    }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  // The reset link establishes a recovery session before we can update the password.
  useEffect(() => {
    let active = true;
    const check = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) await supabase.auth.exchangeCodeForSession(code);
      const { data } = await supabase.auth.getSession();
      if (active) setReady(!!data.session);
    };
    void check();
    return () => {
      active = false;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated.");
    await navigate({ to: "/trees", replace: true });
  };

  return (
    <main className="star-field grid min-h-screen place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <HeirloomLogo />
        <h1 className="mt-6 font-display text-3xl">Choose a new password</h1>
        {!ready ? (
          <p className="mt-3 text-sm text-muted-foreground">
            This reset link has expired or was already used. Request a new one from the sign-in page.
          </p>
        ) : (
          <form onSubmit={submit} className="surface-panel mt-6 space-y-4 p-5">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Saving…" : "Update password"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
