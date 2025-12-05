"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
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

function TreeContent() {
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

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.5));
  const handleResetZoom = () => setZoom(1);

  const handleNodeClick = (node: TreeNode) => {
    setSelectedNode(node);
  };

  const handleViewSubtree = (node: TreeNode) => {
    setRootUserId(node.id);
    setSelectedNode(null);
  };

  const handleResetRoot = () => {
    setRootUserId(null);
    setSelectedNode(null);
  };

  const renderNode = (node: TreeNode | null, isLeft: boolean = false, isRoot: boolean = false): React.ReactNode => {
    if (!node) {
      return (
        <div className="flex flex-col items-center">
          <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-dashed ${isLeft ? 'border-green-400' : 'border-blue-400'} flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 shadow-inner`}>
            <User className="h-5 w-5 sm:h-6 sm:w-6 text-gray-300" />
          </div>
          <p className="text-xs text-gray-400 mt-1 font-medium">Empty</p>
        </div>
      );
    }

    const isHighlighted = searchTerm && (
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.referral_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="flex flex-col items-center">
        <div
          onClick={() => handleNodeClick(node)}
          className={`relative cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-xl ${
            selectedNode?.id === node.id ? 'ring-4 ring-purple-400 ring-offset-2' : ''
          } ${isHighlighted ? 'ring-4 ring-yellow-400 ring-offset-2' : ''}`}
        >
          <div className={`w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg border-2 border-white ${
            node.is_active 
              ? isRoot 
                ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-red-500' 
                : 'bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500' 
              : 'bg-gradient-to-br from-gray-400 to-gray-600'
          }`}>
            {node.name.charAt(0).toUpperCase()}
          </div>
          <Badge className={`absolute -top-1 -right-1 text-[10px] sm:text-xs px-1.5 py-0.5 font-bold shadow-md ${
            node.level <= 10 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 
            node.level <= 20 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 
            node.level <= 30 ? 'bg-gradient-to-r from-purple-500 to-violet-500' : 
            'bg-gradient-to-r from-amber-500 to-orange-500'
          } text-white border-0`}>
            L{node.level}
          </Badge>
        </div>
        <div className="text-center mt-2 max-w-20 sm:max-w-24">
          <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">{node.name}</p>
          <p className="text-xs font-bold text-emerald-600">₹{node.earnings.toLocaleString()}</p>
        </div>
      </div>
    );
  };

  const renderTree = (node: TreeNode | null, depth: number = 0, isRoot: boolean = true): React.ReactNode => {
    if (!node || depth >= parseInt(viewDepth)) return null;

    const hasChildren = node.left || node.right || depth < parseInt(viewDepth) - 1;

    return (
      <div className="flex flex-col items-center">
        {renderNode(node, false, isRoot)}
        
        {hasChildren && (
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-6 sm:h-8 bg-gradient-to-b from-purple-400 via-pink-400 to-rose-400"></div>
            
            <div className="relative flex items-start">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 bg-gradient-to-r from-green-400 via-gray-300 to-blue-400" style={{ width: 'calc(100% - 2rem)' }}></div>
              
              <div className="flex gap-4 sm:gap-6 md:gap-8 lg:gap-12">
                <div className="flex flex-col items-center pt-0">
                  <div className="flex items-center">
                    <div className="w-6 sm:w-8 md:w-12 lg:w-16 h-0.5 bg-gradient-to-r from-green-500 to-green-400"></div>
                    <div className="w-0.5 h-6 sm:h-8 bg-gradient-to-b from-green-400 to-green-500"></div>
                  </div>
                  <div className="flex flex-col items-center -mt-0.5">
                    {node.left ? renderTree(node.left, depth + 1, false) : renderNode(null, true)}
                  </div>
                </div>
                
                <div className="flex flex-col items-center pt-0">
                  <div className="flex items-center">
                    <div className="w-0.5 h-6 sm:h-8 bg-gradient-to-b from-blue-400 to-blue-500"></div>
                    <div className="w-6 sm:w-8 md:w-12 lg:w-16 h-0.5 bg-gradient-to-r from-blue-400 to-blue-500"></div>
                  </div>
                  <div className="flex flex-col items-center -mt-0.5">
                    {node.right ? renderTree(node.right, depth + 1, false) : renderNode(null, false)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/referrals">
            <Button variant="outline" size="sm" className="border-purple-200 hover:bg-purple-50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
              Referral Tree View
            </h1>
            <p className="text-gray-500 text-sm">
              Binary tree structure with left and right children
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchTreeData}
          className="border-purple-200 hover:bg-purple-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-3 border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <GitBranch className="h-5 w-5" />
                Binary Tree Structure
                {rootUserId && (
                  <Badge className="bg-white/20 ml-2 text-xs">Viewing User #{rootUserId}</Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleZoomOut}
                  className="bg-white/20 hover:bg-white/30 text-white border-0 h-8 w-8 p-0"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs sm:text-sm font-medium px-2 bg-white/10 rounded py-1">{Math.round(zoom * 100)}%</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleZoomIn}
                  className="bg-white/20 hover:bg-white/30 text-white border-0 h-8 w-8 p-0"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleResetZoom}
                  className="bg-white/20 hover:bg-white/30 text-white border-0 h-8 w-8 p-0"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                {rootUserId && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleResetRoot}
                    className="bg-white/20 hover:bg-white/30 text-white border-0 text-xs"
                  >
                    <Home className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 overflow-auto bg-gradient-to-br from-slate-50 via-white to-purple-50" style={{ minHeight: "500px" }}>
            <div 
              className="flex justify-center items-start py-6 sm:py-8"
              style={{ transform: `scale(${zoom})`, transformOrigin: "top center", minWidth: "max-content" }}
            >
              {treeData ? (
                renderTree(treeData)
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-4">
                    <Network className="h-12 w-12 text-purple-400" />
                  </div>
                  <p className="font-medium">No tree data available</p>
                  <p className="text-sm text-gray-400">Add referrals to see the tree structure</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-purple-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <Search className="h-4 w-4 text-white" />
                </div>
                Search & Filter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Search User</label>
                <Input
                  placeholder="Name, email or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">View Depth</label>
                <Select value={viewDepth} onValueChange={setViewDepth}>
                  <SelectTrigger className="border-purple-200 focus:border-purple-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Levels</SelectItem>
                    <SelectItem value="4">4 Levels</SelectItem>
                    <SelectItem value="5">5 Levels</SelectItem>
                    <SelectItem value="6">6 Levels</SelectItem>
                    <SelectItem value="7">7 Levels</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {selectedNode && (
            <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-100 via-pink-50 to-rose-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  Selected Node
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-2 bg-white/80 rounded-lg">
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="font-semibold text-gray-800">{selectedNode.name}</p>
                </div>
                <div className="p-2 bg-white/80 rounded-lg">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm text-gray-700">{selectedNode.email}</p>
                </div>
                <div className="p-2 bg-white/80 rounded-lg">
                  <p className="text-xs text-gray-500">Referral Code</p>
                  <code className="text-sm bg-purple-100 px-2 py-1 rounded text-purple-700 font-bold">
                    {selectedNode.referral_code}
                  </code>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg text-white">
                    <p className="text-xs opacity-80">Level</p>
                    <p className="font-bold text-lg">{selectedNode.level}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg text-white">
                    <p className="text-xs opacity-80">Earnings</p>
                    <p className="font-bold text-lg">₹{selectedNode.earnings.toLocaleString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg text-center border border-green-200">
                    <p className="text-xs text-gray-500 mb-1">Left Child</p>
                    <p className={`font-bold text-sm ${selectedNode.left ? 'text-green-600' : 'text-gray-400'}`}>
                      {selectedNode.left ? selectedNode.left.name : 'Empty'}
                    </p>
                  </div>
                  <div className="p-2 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg text-center border border-blue-200">
                    <p className="text-xs text-gray-500 mb-1">Right Child</p>
                    <p className={`font-bold text-sm ${selectedNode.right ? 'text-blue-600' : 'text-gray-400'}`}>
                      {selectedNode.right ? selectedNode.right.name : 'Empty'}
                    </p>
                  </div>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  size="sm"
                  onClick={() => handleViewSubtree(selectedNode)}
                >
                  <ChevronDown className="h-4 w-4 mr-1" />
                  View Subtree
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-800">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 shadow"></div>
                <span className="text-sm font-medium text-gray-700">Root User</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 shadow"></div>
                <span className="text-sm font-medium text-gray-700">Active User</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 shadow"></div>
                <span className="text-sm font-medium text-gray-700">Inactive User</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                <div className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 bg-gray-50"></div>
                <span className="text-sm font-medium text-gray-700">Empty Position</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-green-50">
                <div className="w-8 h-1.5 bg-gradient-to-r from-green-500 to-green-400 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Left Child Link</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-50">
                <div className="w-8 h-1.5 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Right Child Link</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ReferralTreePage() {
  return (
    <Suspense fallback={<div className="flex h-[80vh] items-center justify-center"><LoadingSpinner /></div>}>
      <TreeContent />
    </Suspense>
  );
}
