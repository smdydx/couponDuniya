
"use client";

import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function AdminTestPage() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated } = useAuthStore();

  return (
    <div className="p-8 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>Is Authenticated:</strong> {isAuthenticated ? "✅ Yes" : "❌ No"}
          </div>
          <div>
            <strong>Has Token:</strong> {accessToken ? "✅ Yes" : "❌ No"}
          </div>
          {accessToken && (
            <div className="break-all">
              <strong>Token:</strong> {accessToken.substring(0, 50)}...
            </div>
          )}
          <div>
            <strong>Has User:</strong> {user ? "✅ Yes" : "❌ No"}
          </div>
          {user && (
            <div className="space-y-2">
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>Role:</strong> {user.role}</div>
              <div><strong>Is Admin:</strong> {user.is_admin ? "✅ Yes" : "❌ No"}</div>
              <div><strong>User ID:</strong> {user.id}</div>
            </div>
          )}
          <div className="flex gap-2 pt-4">
            <Button onClick={() => router.push("/login")}>
              Go to Login
            </Button>
            <Button onClick={() => router.push("/admin/dashboard")}>
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
