"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Leader = {
  rank: number;
  name: string;
  referrals: number;
  earnings: number;
};

const mockLeaders: Leader[] = [
  { rank: 1, name: "Alice", referrals: 24, earnings: 1200 },
  { rank: 2, name: "Bob", referrals: 18, earnings: 900 },
  { rank: 3, name: "Carol", referrals: 15, earnings: 750 },
  { rank: 4, name: "Dan", referrals: 10, earnings: 500 },
  { rank: 5, name: "Eve", referrals: 8, earnings: 400 },
];

export default function ReferralLeaderboardPage() {
  const [leaders, setLeaders] = useState<Leader[]>([]);

  useEffect(() => {
    // TODO: fetch from /api/v1/referrals/leaderboard
    setLeaders(mockLeaders);
  }, []);

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Referral Leaderboard</h1>
          <p className="text-muted-foreground">Top referrers and their earnings.</p>
        </div>
        <Badge className="gap-2">
          <Users className="h-4 w-4" /> Weekly Reset
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top Referrers</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Referrals</th>
                  <th className="p-3">Earnings</th>
                </tr>
              </thead>
              <tbody>
                {leaders.map((leader) => (
                  <tr key={leader.rank} className="border-b">
                    <td className="p-3">
                      {leader.rank <= 3 ? (
                        <Badge variant="secondary" className="gap-1">
                          {leader.rank === 1 && <Trophy className="h-4 w-4 text-amber-500" />}
                          {leader.rank === 2 && <Medal className="h-4 w-4 text-gray-500" />}
                          {leader.rank === 3 && <Medal className="h-4 w-4 text-orange-500" />}
                          #{leader.rank}
                        </Badge>
                      ) : (
                        `#${leader.rank}`
                      )}
                    </td>
                    <td className="p-3 font-medium">{leader.name}</td>
                    <td className="p-3">{leader.referrals}</td>
                    <td className="p-3">₹{leader.earnings}</td>
                  </tr>
                ))}
                {leaders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-muted-foreground">
                      No referral activity yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rewards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border p-3">
              <p className="font-semibold">Weekly Champion</p>
              <p className="text-sm text-muted-foreground">Bonus ₹500 for #1 each week</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="font-semibold">Top 5</p>
              <p className="text-sm text-muted-foreground">₹100 bonus + badge</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="font-semibold">Consistency</p>
              <p className="text-sm text-muted-foreground">5 referrals/week for 4 weeks → ₹750</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
