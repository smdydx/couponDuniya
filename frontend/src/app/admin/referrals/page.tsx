"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Network,
  Users,
  DollarSign,
  TrendingUp,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Award,
  Star,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface ReferralUser {
  id: number;
  email: string;
  full_name: string;
  referral_code: string;
  referred_by_id: number | null;
  referred_by_name: string | null;
  total_referrals: number;
  active_referrals: number;
  total_earnings: number;
  current_level: number;
  left_child_id: number | null;
  right_child_id: number | null;
  left_child_name: string | null;
  right_child_name: string | null;
  created_at: string;
}

interface ReferralStats {
  total_users: number;
  users_with_referrals: number;
  total_referral_earnings: number;
  average_referrals_per_user: number;
  max_level_reached: number;
}

interface LevelStats {
  level: number;
  user_count: number;
  total_earnings: number;
  commission_rate: number;
}

const LEVELS_PER_PAGE = 10;
const MAX_LEVELS = 50;

export default function AdminReferralsPage() {
  const [users, setUsers] = useState<ReferralUser[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [levelStats, setLevelStats] = useState<LevelStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<ReferralUser | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [levelPage, setLevelPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/admin/referrals?page=${page}&limit=20&search=${search}&level=${levelFilter}`
      );
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data?.users || []);
        setStats(data.data?.stats || null);
        setLevelStats(data.data?.level_stats || generateMockLevelStats());
        setTotalPages(data.data?.pagination?.total_pages || 1);
      } else {
        setUsers(generateMockUsers());
        setStats(generateMockStats());
        setLevelStats(generateMockLevelStats());
      }
    } catch (error) {
      console.error("Failed to fetch referrals:", error);
      setUsers(generateMockUsers());
      setStats(generateMockStats());
      setLevelStats(generateMockLevelStats());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, levelFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const generateMockUsers = (): ReferralUser[] => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      email: `user${i + 1}@example.com`,
      full_name: `User ${i + 1}`,
      referral_code: `REF${String(i + 1).padStart(6, '0')}`,
      referred_by_id: i > 0 ? Math.ceil(i / 2) : null,
      referred_by_name: i > 0 ? `User ${Math.ceil(i / 2)}` : null,
      total_referrals: Math.floor(Math.random() * 50),
      active_referrals: Math.floor(Math.random() * 30),
      total_earnings: Math.floor(Math.random() * 10000),
      current_level: Math.floor(Math.random() * 10) + 1,
      left_child_id: i * 2 + 1 < 20 ? i * 2 + 1 : null,
      right_child_id: i * 2 + 2 < 20 ? i * 2 + 2 : null,
      left_child_name: i * 2 + 1 < 20 ? `User ${i * 2 + 1}` : null,
      right_child_name: i * 2 + 2 < 20 ? `User ${i * 2 + 2}` : null,
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    }));
  };

  const generateMockStats = (): ReferralStats => ({
    total_users: 1245,
    users_with_referrals: 432,
    total_referral_earnings: 125000,
    average_referrals_per_user: 2.8,
    max_level_reached: 12,
  });

  const generateMockLevelStats = (): LevelStats[] => {
    return Array.from({ length: MAX_LEVELS }, (_, i) => ({
      level: i + 1,
      user_count: Math.max(0, Math.floor(1000 / Math.pow(1.5, i))),
      total_earnings: Math.max(0, Math.floor(50000 / Math.pow(1.3, i))),
      commission_rate: Math.max(0.5, 10 - i * 0.2),
    }));
  };

  const handleViewDetails = (user: ReferralUser) => {
    setSelectedUser(user);
    setDetailDialogOpen(true);
  };

  const getLevelBadgeColor = (level: number) => {
    if (level >= 40) return "bg-gradient-to-r from-yellow-400 to-amber-500 text-white";
    if (level >= 30) return "bg-gradient-to-r from-purple-500 to-pink-500 text-white";
    if (level >= 20) return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white";
    if (level >= 10) return "bg-gradient-to-r from-green-500 to-emerald-500 text-white";
    return "bg-gradient-to-r from-gray-400 to-gray-500 text-white";
  };

  const getLevelIcon = (level: number) => {
    if (level >= 40) return <Crown className="h-4 w-4" />;
    if (level >= 30) return <Star className="h-4 w-4" />;
    if (level >= 20) return <Award className="h-4 w-4" />;
    return null;
  };

  const filteredUsers = users.filter((user) => {
    if (!search) return true;
    return (
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.referral_code.toLowerCase().includes(search.toLowerCase())
    );
  });

  const currentLevelStats = levelStats.slice(
    (levelPage - 1) * LEVELS_PER_PAGE,
    levelPage * LEVELS_PER_PAGE
  );
  const totalLevelPages = Math.ceil(MAX_LEVELS / LEVELS_PER_PAGE);

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
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Referral Management
          </h1>
          <p className="text-gray-500 mt-1">
            Manage referral network with 50 levels matrix system
          </p>
        </div>
        <Link href="/admin/referrals/tree">
          <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
            <GitBranch className="h-4 w-4 mr-2" />
            View Binary Tree
          </Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs sm:text-sm">Total Users</p>
                <p className="text-2xl sm:text-3xl font-bold">{stats?.total_users?.toLocaleString() || 0}</p>
              </div>
              <Users className="h-8 w-8 sm:h-10 sm:w-10 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-500 to-rose-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100 text-sm">With Referrals</p>
                <p className="text-3xl font-bold">{stats?.users_with_referrals?.toLocaleString() || 0}</p>
              </div>
              <Network className="h-10 w-10 text-pink-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">Total Earnings</p>
                <p className="text-3xl font-bold">₹{stats?.total_referral_earnings?.toLocaleString() || 0}</p>
              </div>
              <DollarSign className="h-10 w-10 text-emerald-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-amber-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Avg Referrals</p>
                <p className="text-3xl font-bold">{stats?.average_referrals_per_user?.toFixed(1) || 0}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Max Level</p>
                <p className="text-3xl font-bold">{stats?.max_level_reached || 0}/50</p>
              </div>
              <Award className="h-10 w-10 text-blue-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            50 Level Matrix Table
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <TableHead className="font-bold">Level</TableHead>
                  <TableHead className="font-bold">Users</TableHead>
                  <TableHead className="font-bold">Commission Rate</TableHead>
                  <TableHead className="font-bold">Total Earnings</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentLevelStats.map((level) => (
                  <TableRow key={level.level} className="hover:bg-purple-50/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${getLevelBadgeColor(level.level)}`}>
                          {getLevelIcon(level.level)}
                          Level {level.level}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-gray-700">{level.user_count.toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-emerald-600">{level.commission_rate.toFixed(1)}%</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-purple-600">₹{level.total_earnings.toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      {level.user_count > 0 ? (
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-500">Inactive</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-gray-500">
              Showing levels {(levelPage - 1) * LEVELS_PER_PAGE + 1} - {Math.min(levelPage * LEVELS_PER_PAGE, MAX_LEVELS)} of {MAX_LEVELS}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLevelPage((p) => Math.max(1, p - 1))}
                disabled={levelPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-3">
                Page {levelPage} of {totalLevelPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLevelPage((p) => Math.min(totalLevelPages, p + 1))}
                disabled={levelPage === totalLevelPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Referral Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by name, email or referral code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {Array.from({ length: 10 }, (_, i) => (
                  <SelectItem key={i} value={String((i + 1) * 5)}>
                    Level 1-{(i + 1) * 5}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>User</TableHead>
                  <TableHead>Referral Code</TableHead>
                  <TableHead>Referred By</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Left Child</TableHead>
                  <TableHead>Right Child</TableHead>
                  <TableHead>Total Referrals</TableHead>
                  <TableHead>Earnings</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-purple-50/30">
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm font-mono">
                        {user.referral_code}
                      </code>
                    </TableCell>
                    <TableCell>
                      {user.referred_by_name ? (
                        <span className="text-blue-600">{user.referred_by_name}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${getLevelBadgeColor(user.current_level)}`}>
                        {getLevelIcon(user.current_level)}
                        {user.current_level}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.left_child_name ? (
                        <div className="flex items-center gap-1 text-sm">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span>{user.left_child_name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Empty</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.right_child_name ? (
                        <div className="flex items-center gap-1 text-sm">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span>{user.right_child_name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Empty</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{user.total_referrals}</span>
                      <span className="text-gray-400 text-sm"> ({user.active_referrals} active)</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-emerald-600">₹{user.total_earnings.toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(user)}
                        className="text-purple-600 hover:text-purple-800 hover:bg-purple-100"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No users found matching your criteria
            </div>
          )}

          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Network className="h-5 w-5 text-purple-600" />
              Referral Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-purple-50">
                  <p className="text-sm text-gray-500">User</p>
                  <p className="font-semibold text-lg">{selectedUser.full_name}</p>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-50">
                  <p className="text-sm text-gray-500">Referral Code</p>
                  <code className="font-bold text-lg text-blue-600">{selectedUser.referral_code}</code>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-emerald-50">
                  <p className="text-sm text-gray-500">Current Level</p>
                  <p className="font-bold text-2xl text-emerald-600">{selectedUser.current_level}</p>
                </div>
                <div className="p-4 rounded-lg bg-amber-50">
                  <p className="text-sm text-gray-500">Total Earnings</p>
                  <p className="font-bold text-2xl text-amber-600">₹{selectedUser.total_earnings.toLocaleString()}</p>
                </div>
              </div>

              <div className="p-4 rounded-lg border">
                <p className="text-sm font-medium text-gray-700 mb-3">Binary Tree Position</p>
                <div className="flex justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold mx-auto mb-2">
                      {selectedUser.full_name?.charAt(0) || "U"}
                    </div>
                    <p className="text-sm font-medium">{selectedUser.full_name}</p>
                    <div className="flex justify-center gap-16 mt-4">
                      <div className="text-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold mx-auto mb-1 ${selectedUser.left_child_name ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                          {selectedUser.left_child_name?.charAt(0) || "?"}
                        </div>
                        <p className="text-xs text-green-600 font-medium">Left</p>
                        <p className="text-xs">{selectedUser.left_child_name || "Empty"}</p>
                      </div>
                      <div className="text-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold mx-auto mb-1 ${selectedUser.right_child_name ? 'bg-gradient-to-br from-blue-400 to-cyan-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                          {selectedUser.right_child_name?.charAt(0) || "?"}
                        </div>
                        <p className="text-xs text-blue-600 font-medium">Right</p>
                        <p className="text-xs">{selectedUser.right_child_name || "Empty"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-2xl font-bold text-gray-700">{selectedUser.total_referrals}</p>
                  <p className="text-xs text-gray-500">Total Referrals</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-2xl font-bold text-green-600">{selectedUser.active_referrals}</p>
                  <p className="text-xs text-gray-500">Active Referrals</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-2xl font-bold text-purple-600">{selectedUser.referred_by_name || "None"}</p>
                  <p className="text-xs text-gray-500">Referred By</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Close
            </Button>
            <Link href={`/admin/referrals/tree?user=${selectedUser?.id}`}>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
                <GitBranch className="h-4 w-4 mr-2" />
                View in Tree
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
