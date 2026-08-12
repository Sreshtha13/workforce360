"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SearchBar } from "@/components/ui/search-bar";
import { Plus, FileText } from "lucide-react";
import { BidStatus } from "@/types/bd";

export default function BidsPage() {
  const [search, setSearch] = useState("");

  const { data: bids, isLoading } = useQuery({
    queryKey: ["bd", "bids", search],
    queryFn: () => apiClient.bd.bids.list({ search }),
  });

  const getStatusColor = (status: BidStatus) => {
    const colors = {
      [BidStatus.DRAFT]: "bg-gray-500",
      [BidStatus.SUBMITTED]: "bg-blue-500",
      [BidStatus.UNDER_REVIEW]: "bg-yellow-500",
      [BidStatus.SHORTLISTED]: "bg-purple-500",
      [BidStatus.WON]: "bg-green-500",
      [BidStatus.LOST]: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bids</h1>
          <p className="text-muted-foreground">Track and manage bid submissions</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Bid
        </Button>
      </div>

      {/* Search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search bids..."
      />

      {/* Bids List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Bids
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : bids && bids.length > 0 ? (
            <div className="space-y-3">
              {bids.map((bid) => (
                <div key={bid.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{bid.title}</p>
                      <Badge className={getStatusColor(bid.status)}>
                        {bid.status}
                      </Badge>
                    </div>
                    {bid.lead && (
                      <p className="text-sm text-muted-foreground">
                        Lead: {bid.lead.title} ({bid.lead.company})
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Amount: ${Number(bid.amount).toLocaleString()} • 
                      Submitted: {bid.submittedAt ? format(new Date(bid.submittedAt), "MMM d, yyyy") : "Not yet"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No bids found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
