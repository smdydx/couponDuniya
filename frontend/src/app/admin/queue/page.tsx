"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCcw, Trash, RotateCcw, AlertTriangle } from "lucide-react";

interface QueueStatsItem {
  pending: number;
  processing: number;
  dead_letter: number;
}
interface QueueStatsResponse {
  email: QueueStatsItem;
  sms: QueueStatsItem;
  cashback: QueueStatsItem;
}
interface DeadLetterJob {
  id: string;
  type?: string;
  to?: string; // email recipient
  mobile?: string; // sms recipient
  data: Record<string, any>;
  attempts: number;
  createdAt: string;
  failedAt?: string;
  error?: string;
}

const API_BASE = "/api/v1/queue"; // relative; assumes frontend proxy to backend

export default function AdminQueuePage() {
  const [stats, setStats] = useState<QueueStatsResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [dlqJobs, setDlqJobs] = useState<DeadLetterJob[]>([]);
  const [dlqLoading, setDlqLoading] = useState(false);
  const [selectedDLQ, setSelectedDLQ] = useState<"email" | "sms">("email");
  const [actionBusy, setActionBusy] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetch(`${API_BASE}/stats`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Stats fetch failed: ${res.status}`);
      const data: QueueStatsResponse = await res.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchDLQ = useCallback(async () => {
    setDlqLoading(true);
    try {
      const res = await fetch(`${API_BASE}/dead-letter/${selectedDLQ}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`DLQ fetch failed: ${res.status}`);
      const data = await res.json();
      setDlqJobs(data.jobs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setDlqLoading(false);
    }
  }, [selectedDLQ]);

  // Initial load
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);
  useEffect(() => {
    fetchDLQ();
  }, [fetchDLQ]);

  // Polling
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      fetchStats();
      fetchDLQ();
    }, 5000);
    return () => clearInterval(id);
  }, [autoRefresh, fetchStats, fetchDLQ]);

  const retryJob = async (index: number) => {
    setActionBusy(true);
    try {
      const res = await fetch(`${API_BASE}/dead-letter/${selectedDLQ}/${index}/retry`, { method: "POST" });
      if (!res.ok) throw new Error(`Retry failed: ${res.status}`);
      await fetchDLQ();
      await fetchStats();
    } catch (e) {
      console.error(e);
    } finally {
      setActionBusy(false);
    }
  };

  const clearDLQ = async () => {
    if (!confirm(`Clear ALL dead-letter jobs for ${selectedDLQ}?`)) return;
    setActionBusy(true);
    try {
      const res = await fetch(`${API_BASE}/dead-letter/${selectedDLQ}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Clear failed: ${res.status}`);
      await fetchDLQ();
      await fetchStats();
    } catch (e) {
      console.error(e);
    } finally {
      setActionBusy(false);
    }
  };

  const dlqCount = stats?.[selectedDLQ].dead_letter ?? 0;

  const queueCards = useMemo(() => {
    if (!stats) return null;
    const order: Array<[string, QueueStatsItem]> = Object.entries(stats);
    return order.map(([name, item]) => {
      const unhealthy = item.dead_letter > 0;
      return (
        <Card key={name} className="relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold capitalize">{name}</CardTitle>
            <Badge variant={unhealthy ? "destructive" : "secondary"}>{unhealthy ? `DLQ: ${item.dead_letter}` : "Healthy"}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Pending</span><span className="font-semibold">{item.pending}</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Processing</span><span className="font-semibold">{item.processing}</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Dead Letter</span><span className="font-semibold text-destructive">{item.dead_letter}</span></div>
            {unhealthy && name !== "cashback" && (
              <Button size="sm" variant="outline" onClick={() => setSelectedDLQ(name as "email" | "sms")} disabled={selectedDLQ === name || actionBusy}>
                View DLQ
              </Button>
            )}
            {name === "cashback" && item.dead_letter > 0 && (
              <div className="text-xs text-muted-foreground">(DLQ inspection not enabled for cashback yet)</div>
            )}
          </CardContent>
        </Card>
      );
    });
  }, [stats, selectedDLQ, actionBusy]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Queue Monitoring</h1>
          <p className="text-muted-foreground">Email, SMS and cashback worker queue health</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => { fetchStats(); fetchDLQ(); }} disabled={loadingStats || dlqLoading}>
            <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={() => setAutoRefresh(a => !a)}>
            {autoRefresh ? "Auto: On" : "Auto: Off"}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loadingStats && !stats ? <p className="text-sm text-muted-foreground">Loading stats...</p> : queueCards}
      </div>

      {/* Dead Letter Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Dead Letter Queue — {selectedDLQ}</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={clearDLQ} disabled={actionBusy || dlqCount === 0}> <Trash className="mr-1 h-4 w-4" /> Clear</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {dlqLoading && <p className="text-sm text-muted-foreground">Loading DLQ...</p>}
          {!dlqLoading && dlqJobs.length === 0 && (
            <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" /> No dead-letter jobs for {selectedDLQ}
            </div>
          )}
          {dlqJobs.length > 0 && (
            <div className="overflow-auto rounded border">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dlqJobs.map((job, idx) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-xs">{idx}</TableCell>
                      <TableCell className="font-mono text-xs max-w-[160px] truncate" title={job.id}>{job.id}</TableCell>
                      <TableCell className="text-xs">{job.type || "—"}</TableCell>
                      <TableCell className="text-xs max-w-[160px] truncate" title={job.to || job.mobile || ""}>{job.to || job.mobile || "—"}</TableCell>
                      <TableCell className="text-xs">{job.attempts}</TableCell>
                      <TableCell className="text-xs" title={job.createdAt}>{new Date(job.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate" title={job.error}>{job.error ? job.error : "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" disabled={actionBusy} onClick={() => retryJob(idx)}>
                          <RotateCcw className="mr-1 h-4 w-4" /> Retry
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        DLQ indices are positional; after a retry or clear, the list is refreshed. Cashback DLQ inspection will be added once backend enables endpoints.
      </p>
    </div>
  );
}
