"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Save } from "lucide-react";

type Page = {
  id: number;
  title: string;
  slug: string;
  status: "draft" | "published";
  updated_at: string;
};

const samplePages: Page[] = [
  { id: 1, title: "Terms & Conditions", slug: "terms", status: "published", updated_at: "Today" },
  { id: 2, title: "Privacy Policy", slug: "privacy", status: "published", updated_at: "Yesterday" },
  { id: 3, title: "Blog: Winter Deals", slug: "blog/winter-deals", status: "draft", updated_at: "2 days ago" },
];

export default function CMSAdminPage() {
  const [pages, setPages] = useState<Page[]>(samplePages);
  const [form, setForm] = useState({ title: "", slug: "", content: "" });

  const addPage = () => {
    setPages([
      ...pages,
      {
        id: Date.now(),
        title: form.title,
        slug: form.slug,
        status: "draft",
        updated_at: "Just now",
      },
    ]);
    setForm({ title: "", slug: "", content: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">CMS / Blog Management</h1>
          <p className="text-muted-foreground">Create and publish pages, blog posts, and FAQs.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            New Page / Post
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Title</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Blog title or page title" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Slug</label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="blog/winter-deals" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Content (markdown or HTML)</label>
            <Textarea rows={6} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Write your content..." />
          </div>
          <div className="flex gap-2">
            <Button onClick={addPage}>
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button variant="outline">Publish</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pages & Posts</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {pages.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="text-sm text-muted-foreground">/{p.slug}</p>
                <p className="text-xs text-muted-foreground">Updated {p.updated_at}</p>
              </div>
              <Badge variant={p.status === "published" ? "success" : "secondary"}>{p.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
