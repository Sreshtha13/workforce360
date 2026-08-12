"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, DollarSign } from "lucide-react";

export default function PayslipsPage() {
  const { data: payslips, isLoading } = useQuery({
    queryKey: ["portal", "payslips"],
    queryFn: () => apiClient.payroll.payslips.list({}),
  });

  const publishedPayslips = payslips?.filter(p => p.isPublished) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Payslips</h1>
        <p className="text-muted-foreground">View and download your salary payslips</p>
      </div>

      {/* Latest Payslip Summary */}
      {publishedPayslips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Latest Payslip
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Period</p>
                  <p className="text-lg font-medium">{publishedPayslips[0].period}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Net Salary</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${Number(publishedPayslips[0].netSalary).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Gross</p>
                  <p className="font-medium">${Number(publishedPayslips[0].grossSalary).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Deductions</p>
                  <p className="font-medium text-red-600">-${Number(publishedPayslips[0].deductions).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Days</p>
                  <p className="font-medium">{publishedPayslips[0].paidDays}/{publishedPayslips[0].workingDays}</p>
                </div>
              </div>
              {publishedPayslips[0].fileId && (
                <a
                  href={apiClient.payroll.payslips.download(publishedPayslips[0].id)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Payslips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Payslips
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : publishedPayslips.length > 0 ? (
            <div className="space-y-3">
              {publishedPayslips.map((payslip) => (
                <div key={payslip.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{payslip.period}</p>
                    <p className="text-sm text-muted-foreground">
                      Published {format(new Date(payslip.publishedAt!), "MMM d, yyyy")}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Gross: ${Number(payslip.grossSalary).toLocaleString()}</span>
                      <span>•</span>
                      <span>Deductions: ${Number(payslip.deductions).toLocaleString()}</span>
                      <span>•</span>
                      <span>{payslip.paidDays} paid days</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Net Salary</p>
                      <p className="text-lg font-bold text-green-600">
                        ${Number(payslip.netSalary).toLocaleString()}
                      </p>
                    </div>
                    {payslip.fileId && (
                      <a
                        href={apiClient.payroll.payslips.download(payslip.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No payslips available yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
