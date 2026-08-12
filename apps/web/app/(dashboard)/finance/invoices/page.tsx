"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, FileText, DollarSign, Send } from "lucide-react";
import { InvoiceStatus } from "@/types/finance";
import Link from "next/link";

export default function InvoicesPage() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["finance", "invoices", search],
    queryFn: () => apiClient.finance.invoices.list({ search }),
  });

  const getStatusColor = (status: InvoiceStatus) => {
    const colors = {
      [InvoiceStatus.DRAFT]: "bg-gray-500",
      [InvoiceStatus.PENDING_APPROVAL]: "bg-yellow-500",
      [InvoiceStatus.APPROVED]: "bg-blue-500",
      [InvoiceStatus.SENT]: "bg-purple-500",
      [InvoiceStatus.PARTIALLY_PAID]: "bg-orange-500",
      [InvoiceStatus.PAID]: "bg-green-500",
      [InvoiceStatus.OVERDUE]: "bg-red-500",
      [InvoiceStatus.CANCELLED]: "bg-gray-400",
    };
    return colors[status] || "bg-gray-500";
  };

  const stats = invoices ? {
    total: invoices.length,
    draft: invoices.filter(i => i.status === InvoiceStatus.DRAFT).length,
    sent: invoices.filter(i => i.status === InvoiceStatus.SENT).length,
    paid: invoices.filter(i => i.status === InvoiceStatus.PAID).length,
    totalAmount: invoices.reduce((sum, inv) => sum + Number(inv.total), 0),
    paidAmount: invoices.reduce((sum, inv) => sum + Number(inv.amountPaid), 0),
  } : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Manage client invoices and payments</p>
        </div>
        <Link href="/finance/invoices/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Draft</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.draft}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalAmount.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${stats.paidAmount.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search invoices..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : invoices && invoices.length > 0 ? (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <Link key={invoice.id} href={`/finance/invoices/${invoice.id}`}>
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {invoice.client?.name || "Unknown Client"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Issued: {format(new Date(invoice.issueDate), "MMM d, yyyy")} • 
                        Due: {format(new Date(invoice.dueDate), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${Number(invoice.total).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        Paid: ${Number(invoice.amountPaid).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No invoices found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
