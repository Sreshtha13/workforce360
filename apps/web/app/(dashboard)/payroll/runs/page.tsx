"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, PlayCircle, Send, DollarSign, Users } from "lucide-react";
import { PayrollRunStatus } from "@/types/payroll";
import Link from "next/link";

export default function PayrollRunsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [period, setPeriod] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const queryClient = useQueryClient();

  const { data: runs, isLoading } = useQuery({
    queryKey: ["payroll", "runs"],
    queryFn: () => apiClient.payroll.runs.list({}),
  });

  const createMutation = useMutation({
    mutationFn: () => apiClient.payroll.runs.create({
      title,
      period,
      startDate,
      endDate,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      setIsOpen(false);
      resetForm();
    },
  });

  const calculateMutation = useMutation({
    mutationFn: (id: string) => apiClient.payroll.runs.calculate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
    },
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => apiClient.payroll.runs.submit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
    },
  });

  const processMutation = useMutation({
    mutationFn: (id: string) => apiClient.payroll.runs.process(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => apiClient.payroll.runs.markPaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
    },
  });

  const resetForm = () => {
    setTitle("");
    setPeriod("");
    setStartDate("");
    setEndDate("");
  };

  const getStatusColor = (status: PayrollRunStatus) => {
    const colors = {
      [PayrollRunStatus.DRAFT]: "bg-gray-500",
      [PayrollRunStatus.CALCULATING]: "bg-yellow-500",
      [PayrollRunStatus.CALCULATED]: "bg-blue-500",
      [PayrollRunStatus.PENDING_APPROVAL]: "bg-orange-500",
      [PayrollRunStatus.APPROVED]: "bg-purple-500",
      [PayrollRunStatus.PROCESSING]: "bg-indigo-500",
      [PayrollRunStatus.PROCESSED]: "bg-teal-500",
      [PayrollRunStatus.PAID]: "bg-green-500",
      [PayrollRunStatus.FAILED]: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getActions = (run: any) => {
    switch (run.status) {
      case PayrollRunStatus.DRAFT:
        return (
          <Button
            size="sm"
            onClick={() => calculateMutation.mutate(run.id)}
            disabled={calculateMutation.isPending}
          >
            <PlayCircle className="mr-1 h-3 w-3" />
            Calculate
          </Button>
        );
      case PayrollRunStatus.CALCULATED:
        return (
          <Button
            size="sm"
            onClick={() => submitMutation.mutate(run.id)}
            disabled={submitMutation.isPending}
          >
            <Send className="mr-1 h-3 w-3" />
            Submit for Approval
          </Button>
        );
      case PayrollRunStatus.APPROVED:
        return (
          <Button
            size="sm"
            onClick={() => processMutation.mutate(run.id)}
            disabled={processMutation.isPending}
          >
            Process Payslips
          </Button>
        );
      case PayrollRunStatus.PROCESSED:
        return (
          <Button
            size="sm"
            onClick={() => markPaidMutation.mutate(run.id)}
            disabled={markPaidMutation.isPending}
          >
            Mark as Paid
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payroll Runs</h1>
          <p className="text-muted-foreground">Manage payroll processing cycles</p>
        </div>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Payroll Run
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Create Payroll Run</SheetTitle>
              <SheetDescription>Start a new payroll processing cycle</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., January 2026 Payroll"
                />
              </div>
              <div className="space-y-2">
                <Label>Period</Label>
                <Input
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="e.g., 2026-01"
                />
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
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!title || !period || !startDate || !endDate || createMutation.isPending}
                className="w-full"
              >
                Create Run
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Payroll Runs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            All Payroll Runs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : runs && runs.length > 0 ? (
            <div className="space-y-3">
              {runs.map((run) => (
                <div key={run.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/payroll/runs/${run.id}`}>
                        <p className="font-medium hover:underline cursor-pointer">{run.title}</p>
                      </Link>
                      <Badge className={getStatusColor(run.status)}>
                        {run.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(run.startDate), "MMM d")} - {format(new Date(run.endDate), "MMM d, yyyy")}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {run.totalEmployees} employees
                      </span>
                      <span>Gross: ${Number(run.totalGross).toLocaleString()}</span>
                      <span>Net: ${Number(run.totalNet).toLocaleString()}</span>
                    </div>
                  </div>
                  {getActions(run)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No payroll runs yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
