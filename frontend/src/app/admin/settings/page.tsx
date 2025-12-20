"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import apiClient from "@/lib/api/client";

export default function AdminSettingsPage() {
  const [siteName, setSiteName] = useState("");
  const [siteDesc, setSiteDesc] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await apiClient.get('/admin/settings');
        const data = res.data?.data || res.data;
        setSiteName(data?.site_name || '');
        setSiteDesc(data?.site_description || '');
      } catch (err) {
        // ignore if endpoint not present
        console.debug('load settings error', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    try {
      await apiClient.post('/admin/settings', { site_name: siteName, site_description: siteDesc });
      alert('Settings saved');
    } catch (err) {
      console.debug('save settings error', err);
      alert('Failed to save settings (check server)');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">General site settings</p>
      </div>

      <div className="rounded-lg border p-4 max-w-2xl">
        <Label>Site Name</Label>
        <Input value={siteName} onChange={(e) => setSiteName((e.target as HTMLInputElement).value)} />

        <Label className="mt-4">Site Description</Label>
        <Input value={siteDesc} onChange={(e) => setSiteDesc((e.target as HTMLInputElement).value)} />

        <div className="mt-4">
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </div>
    </div>
  );
}
