"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AlertBanner, EmptyState, LoadingState, ErrorState } from "@/components/admin/admin-states";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormField, FormSelect, FormTextarea } from "@/components/admin/form-fields";
import { SearchBar } from "@/components/design-system/search-bar";
import { Badge } from "@/components/ui/badge";
import type { CreateSalaryStructureInput } from "@/types/phase4";

const EMPTY_FORM: CreateSalaryStructureInput = {
  employeeId: "",
  effectiveFrom: new Date().toISOString().slice(0, 10),
  currency: "USD",
  basic: 0,
  hra: 0,
  conveyanceAllowance: 0,
  medicalAllowance: 0,
  specialAllowance: 0,
  otherAllowances: 0,
  providentFund: 0,
  professionalTax: 0,
  incomeTax: 0,
  otherDeductions: 0,
  revisionReason: "",
};

function employeeLabel(e: {
  employeeCode: string;
  user?: { firstName?: string; lastName?: string; department?: { name: string } | null } | null;
}): string {
  const name = `${e.user?.firstName ?? ""} ${e.user?.lastName ?? ""}`.trim() || "Unknown";
  return `${name} — ${e.employeeCode} — ${e.user?.department?.name ?? "No dept"}`;
}

export default function SalaryStructuresPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [form, setForm] = useState<CreateSalaryStructureInput>(EMPTY_FORM);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["payroll", "salary-structures"],
    queryFn: async () => {
      const res = await apiClient.payroll.salaryStructures.list();
      return res.data ?? [];
    },
  });

  const employeesQuery = useQuery({
    queryKey: ["hr", "employees", "all"],
    queryFn: async () => {
      const res = await apiClient.hr.listEmployees();
      return res.data ?? [];
    },
    enabled: createOpen,
  });

  const filteredEmployees = useMemo(() => {
    const employees = employeesQuery.data ?? [];
    const q = employeeFilter.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      [e.user?.firstName, e.user?.lastName, e.employeeCode, e.user?.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [employeesQuery.data, employeeFilter]);

  const employeeMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of employeesQuery.data ?? []) map.set(e.id, employeeLabel(e));
    return map;
  }, [employeesQuery.data]);

  const gross = form.basic + form.hra + form.conveyanceAllowance + form.medicalAllowance + form.specialAllowance + form.otherAllowances;
  const deductions = form.providentFund + form.professionalTax + form.incomeTax + form.otherDeductions;
  const net = gross - deductions;

  const createMutation = useMutation({
    mutationFn: () => apiClient.payroll.salaryStructures.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll", "salary-structures"] });
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      setEmployeeFilter("");
      setFeedback("Salary structure created.");
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "Failed to create salary structure"),
  });

  if (query.isLoading) return <LoadingState message="Loading salary structures..." />;
  if (query.isError) return <ErrorState message="Failed to load salary structures." onRetry={() => query.refetch()} />;

  const structures = query.data ?? [];

  function num(name: keyof CreateSalaryStructureInput, value: string) {
    setForm({ ...form, [name]: Number(value || 0) });
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Salary structures"
        description="Versioned per employee — a new structure supersedes the previous one and keeps historical payslips accurate."
        actionLabel={hasPermission("salary_structure.manage") ? "New structure" : undefined}
        onAction={hasPermission("salary_structure.manage") ? () => setCreateOpen(true) : undefined}
      />

      {feedback && <AlertBanner variant="success" message={feedback} onDismiss={() => setFeedback(null)} />}
      {error && <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} />}

      {structures.length === 0 ? (
        <EmptyState
          title="No salary structures yet"
          description="Create a salary structure for an employee to include them in payroll runs."
          actionLabel={hasPermission("salary_structure.manage") ? "New structure" : undefined}
          onAction={hasPermission("salary_structure.manage") ? () => setCreateOpen(true) : undefined}
        />
      ) : (
        <div className="space-y-3">
          {structures.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/20 bg-white/40 p-4 dark:bg-white/5"
            >
              <div>
                <p className="font-medium">
                  {s.employee?.user ? `${s.employee.user.firstName} ${s.employee.user.lastName}` : s.employeeId}
                  {s.employee?.employeeCode ? ` (${s.employee.employeeCode})` : ""}
                </p>
                <p className="text-sm text-muted-foreground">
                  Effective {new Date(s.effectiveFrom).toLocaleDateString()}
                  {s.effectiveTo ? ` — ${new Date(s.effectiveTo).toLocaleDateString()}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm">
                  Net: <span className="font-medium tabular-nums">{s.netSalary} {s.currency}</span>
                </p>
                <Badge variant={s.status === "ACTIVE" ? "success" : "soft"}>{s.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      <FormSheet
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) {
            setForm(EMPTY_FORM);
            setEmployeeFilter("");
          }
        }}
        title="New salary structure"
        onSubmit={() => {
          if (!form.employeeId) {
            setError("Select an employee.");
            return;
          }
          createMutation.mutate();
        }}
        loading={createMutation.isPending}
        size="wide"
      >
        <SearchBar value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)} placeholder="Filter employees..." />
        <FormSelect
          name="employeeId"
          label="Employee"
          value={form.employeeId}
          onChange={(v) => setForm({ ...form, employeeId: v })}
          options={filteredEmployees.map((e) => ({ value: e.id, label: employeeMap.get(e.id) ?? e.employeeCode }))}
          placeholder={employeesQuery.isLoading ? "Loading employees..." : "Select employee"}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <FormField name="effectiveFrom" label="Effective from" type="date" value={form.effectiveFrom} onChange={(v) => setForm({ ...form, effectiveFrom: v })} required />
          <FormField name="currency" label="Currency" value={form.currency} onChange={(v) => setForm({ ...form, currency: v })} required />
        </div>

        <p className="text-sm font-medium">Earnings</p>
        <div className="grid grid-cols-3 gap-3">
          <FormField name="basic" label="Basic" type="number" value={String(form.basic)} onChange={(v) => num("basic", v)} required />
          <FormField name="hra" label="HRA" type="number" value={String(form.hra)} onChange={(v) => num("hra", v)} />
          <FormField name="conveyanceAllowance" label="Conveyance" type="number" value={String(form.conveyanceAllowance)} onChange={(v) => num("conveyanceAllowance", v)} />
          <FormField name="medicalAllowance" label="Medical" type="number" value={String(form.medicalAllowance)} onChange={(v) => num("medicalAllowance", v)} />
          <FormField name="specialAllowance" label="Special" type="number" value={String(form.specialAllowance)} onChange={(v) => num("specialAllowance", v)} />
          <FormField name="otherAllowances" label="Other" type="number" value={String(form.otherAllowances)} onChange={(v) => num("otherAllowances", v)} />
        </div>

        <p className="text-sm font-medium">Deductions</p>
        <div className="grid grid-cols-2 gap-3">
          <FormField name="providentFund" label="Provident fund" type="number" value={String(form.providentFund)} onChange={(v) => num("providentFund", v)} />
          <FormField name="professionalTax" label="Professional tax" type="number" value={String(form.professionalTax)} onChange={(v) => num("professionalTax", v)} />
          <FormField name="incomeTax" label="Income tax" type="number" value={String(form.incomeTax)} onChange={(v) => num("incomeTax", v)} />
          <FormField name="otherDeductions" label="Other deductions" type="number" value={String(form.otherDeductions)} onChange={(v) => num("otherDeductions", v)} />
        </div>

        <FormTextarea name="revisionReason" label="Reason (optional)" value={form.revisionReason ?? ""} onChange={(v) => setForm({ ...form, revisionReason: v })} />

        <div className="space-y-1 rounded-xl bg-white/30 p-3 text-right text-sm dark:bg-white/5">
          <p>Gross: <span className="font-medium">{gross.toFixed(2)} {form.currency}</span></p>
          <p>Deductions: <span className="font-medium">{deductions.toFixed(2)} {form.currency}</span></p>
          <p className="font-semibold">Net: {net.toFixed(2)} {form.currency}</p>
        </div>
      </FormSheet>
    </div>
  );
}
