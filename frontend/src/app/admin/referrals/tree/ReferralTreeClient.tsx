"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GitBranch,
  Search,
  ZoomIn,
  ZoomOut,
  Home,
  ChevronDown,
  User,
  ArrowLeft,
  Maximize2,
  Network,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface TreeNode {
  id: number;
  name: string;
  email: string;
  referral_code: string;
  level: number;
  earnings: number;
  total_referrals: number;
  left: TreeNode | null;
  right: TreeNode | null;
  is_active: boolean;
}

export default function ReferralTreeClient() {
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get("user");
  
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewDepth, setViewDepth] = useState<string>("5");
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [rootUserId, setRootUserId] = useState<number | null>(initialUserId ? parseInt(initialUserId) : null);

  const generateMockTree = useCallback((depth: number, id: number = 1, level: number = 1): TreeNode | null => {
    if (depth <= 0) return null;
    
    const hasLeft = Math.random() > 0.3;
    const hasRight = Math.random() > 0.3;
    
    return {
      id,
      name: `User ${id}`,
      email: `user${id}@example.com`,
      referral_code: `REF${String(id).padStart(6, '0')}`,
      level,
      earnings: Math.floor(Math.random() * 10000),
      total_referrals: Math.floor(Math.random() * 20),
      is_active: Math.random() > 0.2,
      left: hasLeft ? generateMockTree(depth - 1, id * 2, level + 1) : null,
      right: hasRight ? generateMockTree(depth - 1, id * 2 + 1, level + 1) : null,
    };
  }, []);

  const fetchTreeData = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = rootUserId 
        ? `http://localhost:8000/api/v1/admin/referrals/tree/${rootUserId}?depth=${viewDepth}`
        : `http://localhost:8000/api/v1/admin/referrals/tree?depth=${viewDepth}`;
      
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (data.success && data.data) {
        setTreeData(data.data);
      } else {
        setTreeData(generateMockTree(parseInt(viewDepth)));
      }
    } catch (error) {
      console.error("Failed to fetch tree data:", error);
      setTreeData(generateMockTree(parseInt(viewDepth)));
    } finally {
      setLoading(false);
    }
  }, [rootUserId, viewDepth, generateMockTree]);

  useEffect(() => {
    fetchTreeData();
  }, [fetchTreeData]);

  const TreeNodeComponent = ({ node, isRoot = false }: { node: TreeNode; isRoot?: boolean }) => {
    const isSearchMatch = 
      searchTerm === "" ||
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (!isSearchMatch && !isRoot) return null;

    const childNodes = [node.left, node.right].filter(Boolean);

    return (
      <div key={node.id} className="flex flex-col items-center gap-2">
        <div
          onClick={() => setSelectedNode(node)}
          className={`relative w-48 cursor-pointer rounded-lg border-2 p-4 transition-all ${
            selectedNode?.id === node.id
              ? "border-primary bg-primary/10"
              : "border-gray-200 bg-white hover:border-primary"
          } ${!isSearchMatch ? "opacity-30" : ""}`}
          style={{ transform: `scale(${zoom})` }}
        >
          <div className="absolute -right-2 -top-2">
            <Badge
              variant={node.is_active ? "default" : "secondary"}
              className="text-xs"
            >
              {node.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm truncate">{node.name}</h3>
          </div>

          <div className="space-y-1 text-xs text-muted-foreground">
            <p className="truncate">
              <span className="font-medium">Email:</span> {node.email}
            </p>
            <p>
              <span className="font-medium">Referrals:</span> {node.total_referrals}
            </p>
            <p>
              <span className="font-medium">Earnings:</span> ₹{node.earnings.toLocaleString()}
            </p>
            <p>
              <span className="font-medium">Code:</span> {node.referral_code}
            </p>
          </div>

          {rootUserId !== node.id && (
            <Button
              size="sm"
              variant="outline"
              className="mt-3 w-full text-xs h-7"
              onClick={(e) => {
                e.stopPropagation();
                setRootUserId(node.id);
              }}
            >
              <ArrowLeft className="h-3 w-3 mr-1" />
              View Tree
            </Button>
          )}
        </div>

        {childNodes.length > 0 && (
          <>
            <ChevronDown className="h-6 w-6 text-gray-400" />
            <div className="flex gap-12">
              {node.left && <TreeNodeComponent node={node.left} />}
              {node.right && <TreeNodeComponent node={node.right} />}
            </div>
          </>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="text-sm font-medium">Tree Depth</label>
          <Select value={viewDepth} onValueChange={setViewDepth}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6].map((depth) => (
                <SelectItem key={depth} value={String(depth)}>
                  {depth} levels
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Zoom</label>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setZoom(Math.min(2, zoom + 0.2))}
              disabled={zoom >= 2}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <span className="text-sm leading-10">{Math.round(zoom * 100)}%</span>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Search</label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Find user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="flex gap-2 self-end">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchTreeData}
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          {rootUserId && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRootUserId(null)}
              className="flex-1"
            >
              <Home className="h-4 w-4 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Info */}
      {selectedNode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Name
                </label>
                <p className="text-lg font-semibold">{selectedNode.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Email
                </label>
                <p className="text-lg font-semibold">{selectedNode.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Referral Code
                </label>
                <p className="text-lg font-semibold">{selectedNode.referral_code}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Total Referrals
                </label>
                <p className="text-lg font-semibold">{selectedNode.total_referrals}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Total Earnings
                </label>
                <p className="text-lg font-semibold">
                  ₹{selectedNode.earnings.toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Status
                </label>
                <Badge variant={selectedNode.is_active ? "default" : "secondary"}>
                  {selectedNode.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
            <Button asChild className="mt-4 w-full">
              <Link href={`/admin/referrals?user=${selectedNode.id}`}>
                View Full Statistics
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tree */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              <CardTitle>Referral Tree</CardTitle>
            </div>
            {rootUserId && (
              <Badge variant="outline">{`Viewing: User ${rootUserId}`}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {treeData ? (
            <div className="flex justify-center py-8">
              <TreeNodeComponent node={treeData} isRoot={true} />
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
