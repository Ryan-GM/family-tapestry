import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inviteMember, removeMember, updateMemberRole, type TreeMember, type TreeRole } from "@/lib/tree-data";

const ROLES: Array<{ value: TreeRole; label: string; hint: string }> = [
  { value: "viewer", label: "View only", hint: "Can browse the tree but change nothing" },
  { value: "editor", label: "Editor", hint: "Can add and edit people and relationships" },
  { value: "owner", label: "Owner", hint: "Full control, including sharing" },
];

export function SharingPanel({
  treeId,
  members,
  isOwner,
  onChanged,
}: {
  treeId: string;
  members: TreeMember[];
  isOwner: boolean;
  onChanged: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TreeRole>("viewer");
  const [busy, setBusy] = useState(false);

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h2 className="font-display text-2xl">Who can see this family</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every tree is private by default. Only people you invite here can open it.
          </p>
        </div>

        {isOwner && (
          <div className="surface-panel space-y-3 p-4">
            <Label htmlFor="invite">Invite by email</Label>
            <div className="flex flex-wrap gap-2">
              <Input
                id="invite"
                className="min-w-52 flex-1"
                placeholder="relative@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Select value={role} onValueChange={(v) => setRole(v as TreeRole)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                disabled={busy || !email.includes("@")}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await inviteMember(treeId, email, role);
                    setEmail("");
                    toast.success("Invitation recorded. Access starts when they sign in with that email.");
                    onChanged();
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Could not invite.");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Invite
              </Button>
            </div>
            <ul className="text-xs text-muted-foreground">
              {ROLES.map((r) => (
                <li key={r.value}>
                  <span className="text-foreground">{r.label}:</span> {r.hint}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="surface-panel divide-y divide-border">
          {members.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center gap-3 p-3">
              <span className="flex-1 text-sm">{m.invited_email ?? m.user_id ?? "Unknown member"}</span>
              {isOwner && m.role !== "owner" ? (
                <Select value={m.role} onValueChange={(v) => updateMemberRole(m.id, v as TreeRole).then(onChanged)}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.filter((r) => r.value !== "owner").map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-xs uppercase tracking-wider text-muted-foreground">{m.role}</span>
              )}
              {isOwner && m.role !== "owner" && (
                <Button variant="ghost" size="sm" onClick={() => removeMember(m.id).then(onChanged)}>
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
