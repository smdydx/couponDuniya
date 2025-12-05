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
  Users,
  Search,
  ZoomIn,
  ZoomOut,
  Home,
  ChevronUp,
  ChevronDown,
  User,
  ArrowLeft,
  Maximize2,
  Network,
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

  const renderNode = (node: TreeNode | null, isLeft: boolean = false): React.ReactNode => {
    if (!node) {
      return (
        <div className="flex flex-col items-center">
          <div className={`w-16 h-16 rounded-full border-2 border-dashed ${isLeft ? 'border-green-300' : 'border-blue-300'} flex items-center justify-center bg-gray-50`}>
            <User className="h-6 w-6 text-gray-300" />
          </div>
          <p className="text-xs text-gray-400 mt-1">Empty</p>
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
          className={`relative cursor-pointer transition-all duration-200 hover:scale-110 ${
            selectedNode?.id === node.id ? 'ring-4 ring-purple-400 ring-offset-2' : ''
          } ${isHighlighted ? 'ring-4 ring-yellow-400 ring-offset-2' : ''}`}
        >
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${
            node.is_active 
              ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
              : 'bg-gradient-to-br from-gray-400 to-gray-500'
          }`}>
            {node.name.charAt(0)}
          </div>
          <Badge className={`absolute -top-1 -right-1 text-xs ${
            node.level <= 10 ? 'bg-green-500' : 
            node.level <= 20 ? 'bg-blue-500' : 
            node.level <= 30 ? 'bg-purple-500' : 
            'bg-amber-500'
          }`}>
            L{node.level}
          </Badge>
        </div>
        <div className="text-center mt-2">
          <p className="text-sm font-medium text-gray-800 truncate max-w-24">{node.name}</p>
          <p className="text-xs text-emerald-600 font-semibold">₹{node.earnings.toLocaleString()}</p>
        </div>
      </div>
    );
  };

  const renderTree = (node: TreeNode | null, depth: number = 0): React.ReactNode => {
    if (!node || depth >= parseInt(viewDepth)) return null;

    return (
      <div className="flex flex-col items-center">
        {renderNode(node, false)}
        
        {(node.left || node.right || depth < parseInt(viewDepth) - 1) && (
          <>
            <div className="w-0.5 h-8 bg-gradient-to-b from-purple-400 to-pink-400"></div>
            
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                {node.left && <div className="w-16 h-0.5 bg-green-400 mb-2"></div>}
                <div className="flex flex-col items-center">
                  {renderTree(node.left, depth + 1) || renderNode(null, true)}
                </div>
              </div>
              
              <div className="flex flex-col items-center">
                {node.right && <div className="w-16 h-0.5 bg-blue-400 mb-2"></div>}
                <div className="flex flex-col items-center">
                  {renderTree(node.right, depth + 1) || renderNode(null, false)}
                </div>
              </div>
            </div>
          </>
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
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Referral Tree View
            </h1>
            <p className="text-gray-500">
              Binary tree structure with left and right children
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-3 border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Binary Tree Structure
                {rootUserId && (
                  <Badge className="bg-white/20 ml-2">Viewing User #{rootUserId}</Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleZoomOut}
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium px-2">{Math.round(zoom * 100)}%</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleZoomIn}
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleResetZoom}
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                {rootUserId && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleResetRoot}
                    className="bg-white/20 hover:bg-white/30 text-white border-0"
                  >
                    <Home className="h-4 w-4 mr-1" />
                    Reset Root
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 overflow-auto" style={{ minHeight: "500px" }}>
            <div 
              className="flex justify-center items-start py-8"
              style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
            >
              {treeData ? (
                renderTree(treeData)
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Network className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>No tree data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5 text-purple-600" />
                Search & Filter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Search User</label>
                <Input
                  placeholder="Name, email or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">View Depth</label>
                <Select value={viewDepth} onValueChange={setViewDepth}>
                  <SelectTrigger>
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
            <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-600" />
                  Selected Node
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-semibold">{selectedNode.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-sm">{selectedNode.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Referral Code</p>
                  <code className="text-sm bg-purple-100 px-2 py-1 rounded text-purple-700">
                    {selectedNode.referral_code}
                  </code>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-white rounded-lg">
                    <p className="text-xs text-gray-500">Level</p>
                    <p className="font-bold text-purple-600">{selectedNode.level}</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg">
                    <p className="text-xs text-gray-500">Earnings</p>
                    <p className="font-bold text-emerald-600">₹{selectedNode.earnings.toLocaleString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-white rounded-lg text-center">
                    <p className="text-xs text-gray-500">Left Child</p>
                    <p className={`font-bold ${selectedNode.left ? 'text-green-600' : 'text-gray-400'}`}>
                      {selectedNode.left ? selectedNode.left.name : 'Empty'}
                    </p>
                  </div>
                  <div className="p-2 bg-white rounded-lg text-center">
                    <p className="text-xs text-gray-500">Right Child</p>
                    <p className={`font-bold ${selectedNode.right ? 'text-blue-600' : 'text-gray-400'}`}>
                      {selectedNode.right ? selectedNode.right.name : 'Empty'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    size="sm"
                    onClick={() => handleViewSubtree(selectedNode)}
                  >
                    <ChevronDown className="h-4 w-4 mr-1" />
                    View Subtree
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                <span className="text-sm">Active User</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-gray-400 to-gray-500"></div>
                <span className="text-sm">Inactive User</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-dashed border-gray-300"></div>
                <span className="text-sm">Empty Position</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-green-400"></div>
                <span className="text-sm">Left Child Link</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-blue-400"></div>
                <span className="text-sm">Right Child Link</span>
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
