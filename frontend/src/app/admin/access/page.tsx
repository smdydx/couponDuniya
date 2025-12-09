"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import accessApi from "@/lib/api/accessControl";

export default function AdminAccessPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // form
  const [newRoleName, setNewRoleName] = useState("");
  const [newPermCode, setNewPermCode] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [r, p] = await Promise.all([accessApi.fetchRoles(), accessApi.fetchPermissions()]);
        setRoles(r);
        setPermissions(p);
      } catch (err) {
        console.debug("access load error", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleCreateRole = async () => {
    if (!newRoleName) return;
    try {
      const created = await accessApi.createRole({ name: newRoleName });
      setRoles((s) => [created, ...s]);
      setNewRoleName("");
    } catch (err) {
      console.debug(err);
    }
  };

  const handleCreatePermission = async () => {
    if (!newPermCode) return;
    try {
      const created = await accessApi.createPermission({ code: newPermCode });
      setPermissions((s) => [created, ...s]);
      setNewPermCode("");
    } catch (err) {
      console.debug(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Access Control</h1>
        <p className="text-muted-foreground">Manage roles and permissions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold mb-2">Roles</h3>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <ul className="space-y-2">
                {roles.map((r) => (
                  <li key={r.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.description}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">{r.is_system ? "system" : "custom"}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="font-semibold mb-2">Permissions</h3>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <ul className="space-y-2">
                {permissions.map((p) => (
                  <li key={p.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{p.code}</div>
                      <div className="text-xs text-muted-foreground">{p.description}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border p-4">
            <h4 className="font-semibold mb-2">Create Role</h4>
            <Label>Name</Label>
            <Input value={newRoleName} onChange={(e) => setNewRoleName((e.target as HTMLInputElement).value)} />
            <div className="mt-3">
              <Button onClick={handleCreateRole}>Create Role</Button>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h4 className="font-semibold mb-2">Create Permission</h4>
            <Label>Code</Label>
            <Input value={newPermCode} onChange={(e) => setNewPermCode((e.target as HTMLInputElement).value)} />
            <div className="mt-3">
              <Button onClick={handleCreatePermission}>Create Permission</Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
