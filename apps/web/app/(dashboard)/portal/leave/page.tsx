"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { LeaveStatus, type LeavePolicy } from "@/types/attendance";

export default function LeavePage() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();

  const { data: policies, isLoading: policiesLoading } = useQuery({
    queryKey: ["leave", "policies"],
    queryFn: () => apiClient.leave.policies.list(),
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ["leave", "applications"],
    queryFn: () => apiClient.leave.applications.list(),
  });

  const { data: balances, isLoading: balancesLoading } = useQuery({
    queryKey: ["leave", "balance"],
    queryFn: () => apiClient.leave.balance(),
  });

  const createMutation = useMutation({
    mutationFn: () => apiClient.leave.applications.create({
      policyId: selectedPolicy,
      startDate,
      endDate,
      reason,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave"] });
      setIsOpen(false);
      resetForm();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiClient.leave.applications.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave"] });
    },
  });

  const resetForm = () => {
    setSelectedPolicy("");
    setStartDate("");
    setEndDate("");
    setReason("");
  };

  const getStatusBadge = (status: LeaveStatus) => {
    const variants = {
      [LeaveStatus.PENDING]: { variant: "secondary" as const, icon: Clock },
      [LeaveStatus.APPROVED]: { variant: "default" as const, icon: CheckCircle, className: "bg-green-500" },
      [LeaveStatus.REJECTED]: { variant: "destructive" as const, icon: XCircle },
      [LeaveStatus.CANCELLED]: { variant: "outline" as const, icon: XCircle },
    };
    const config = variants[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="mr-1 h-3 w-3" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground">Apply for leave and track your balance</p>
        </div>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Apply for Leave
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>New Leave Application</SheetTitle>
              <SheetDescription>Submit a new leave request</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Leave Type</Label>
                <Select value={selectedPolicy} onValueChange={setSelectedPolicy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {policies?.filter(p => p.isActive).map((policy) => (
                      <SelectItem key={policy.id} value={policy.id}>
                        {policy.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              </div>
              <div className="space-y-2">
                <Label>Reason (Optional)</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for leave..."
                  rows={3}
                />
              </div>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!selectedPolicy || !startDate || !endDate || createMutation.isPending}
                className="w-full"
              >
                Submit Application
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Leave Balance Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {balancesLoading ? (
          <div>Loading balances...</div>
        ) : (
          balances?.map((balance) => (
            <Card key={balance.policyId}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">{balance.policyName}</CardTitle>
                <CardDescription>{balance.leaveType}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{balance.available}/{balance.annualQuota}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {balance.used} used • {balance.pending} pending
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Leave Applications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            My Leave Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {applicationsLoading ? (
            <div>Loading applications...</div>
          ) : applications && applications.length > 0 ? (
            <div className="space-y-3">
              {applications.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{app.policy?.name}</p>
                      {getStatusBadge(app.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(app.startDate), "MMM d, yyyy")} - {format(new Date(app.endDate), "MMM d, yyyy")} ({app.days} {app.days === 1 ? "day" : "days"})
                    </p>
                    {app.reason && (
                      <p className="text-sm text-muted-foreground">Reason: {app.reason}</p>
                    )}
                    {app.reviewNotes && (
                      <p className="text-sm text-muted-foreground">Review: {app.reviewNotes}</p>
                    )}
                  </div>
                  {app.status === LeaveStatus.PENDING && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cancelMutation.mutate(app.id)}
                      disabled={cancelMutation.isPending}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No leave applications yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
