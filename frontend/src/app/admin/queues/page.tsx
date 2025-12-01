"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Activity, Database, AlertTriangle } from "lucide-react";
import { useState } from "react";

type Queue = {
  name: string;
  pending: number;
  processing: number;
  failed: number;
  lastEvent: string;
};

const initialQueues: Queue[] = [
  { name: "queue:email", pending: 12, processing: 3, failed: 0, lastEvent: "2s ago" },
  { name: "queue:sms", pending: 4, processing: 1, failed: 1, lastEvent: "8s ago" },
  { name: "queue:clicks", pending: 25, processing: 6, failed: 0, lastEvent: "1s ago" },
  { name: "queue:cashback", pending: 3, processing: 1, failed: 0, lastEvent: "15s ago" },
];

export default function QueueMonitoringPage() {
  const [queues, setQueues] = useState<Queue[]>(initialQueues);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // In real implementation, fetch queue stats from an admin/metrics API
    setTimeout(() => {
      // Simulate new metrics to avoid unused setter warning
      setQueues((prev) =>
        prev.map((q) => ({
          ...q,
          pending: Math.max(0, q.pending + Math.round(Math.random() * 4 - 2)),
          processing: Math.max(0, q.processing + Math.round(Math.random() * 2 - 1)),
          failed: q.failed,
        })),
      );
      setRefreshing(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Queue Monitoring</h1>
          <p className="text-muted-foreground">Email, SMS, click, and cashback workers</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {queues.map((q) => (
          <Card key={q.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">{q.name}</CardTitle>
              <Badge variant={q.failed > 0 ? "destructive" : "secondary"}>
                {q.failed > 0 ? "Action required" : "Healthy"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pending</span>
                <span className="font-semibold">{q.pending}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Processing</span>
                <span className="font-semibold">{q.processing}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Failed</span>
                <span className="font-semibold text-destructive">{q.failed}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Activity className="h-4 w-4" />
                Last event: {q.lastEvent}
              </div>
              {q.failed > 0 && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Review DLQ entries for this queue
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Worker Health</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { name: "Email Worker", status: "Healthy", icon: Database, color: "text-green-600" },
            { name: "SMS Worker", status: "Degraded (1 fail)", icon: Database, color: "text-amber-600" },
            { name: "Click Worker", status: "Healthy", icon: Database, color: "text-green-600" },
            { name: "Cashback Sync", status: "Healthy", icon: Database, color: "text-green-600" },
          ].map((w) => (
            <div key={w.name} className="flex items-center gap-3 rounded-lg border p-3">
              <w.icon className={`h-5 w-5 ${w.color}`} />
              <div>
                <p className="font-medium">{w.name}</p>
                <p className="text-xs text-muted-foreground">{w.status}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
