"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState } from "@/components/admin/admin-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { TestCaseStatus } from "@/types/engineering";

export default function TestCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [status, setStatus] = useState<TestCaseStatus>(TestCaseStatus.PASSED);
  const [actualResult, setActualResult] = useState("");
  const [notes, setNotes] = useState("");

  const query = useQuery({
    queryKey: ["engineering", "test-cases", id],
    queryFn: async () => (await apiClient.engineering.testCases.get(id)).data,
  });

  const executeMutation = useMutation({
    mutationFn: () =>
      apiClient.engineering.testCases.execute(id, { status, actualResult, notes }),
    onSuccess: () => query.refetch(),
  });

  if (query.isLoading) return <LoadingState message="Loading test case..." />;
  if (query.isError || !query.data) {
    return <ErrorState message="Test case not found." onRetry={() => query.refetch()} />;
  }

  const tc = query.data;

  return (
    <div className="space-y-6">
      <AdminPageHeader title={tc.title} description={tc.project?.name ?? "Test case details"}>
        <Button variant="outline" onClick={() => router.push("/engineering/test-cases")}>
          Back to test cases
        </Button>
      </AdminPageHeader>

      <div className="flex items-center gap-2">
        <Badge>{tc.status}</Badge>
        <Badge variant="outline">{tc.priority}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border p-5 space-y-3 text-sm">
          <h3 className="font-semibold">Details</h3>
          {tc.description && <p>{tc.description}</p>}
          {tc.steps && (
            <div>
              <p className="font-medium">Steps</p>
              <pre className="whitespace-pre-wrap text-muted-foreground">{tc.steps}</pre>
            </div>
          )}
          {tc.expectedResult && (
            <div>
              <p className="font-medium">Expected Result</p>
              <p className="text-muted-foreground">{tc.expectedResult}</p>
            </div>
          )}
          {tc.actualResult && (
            <div>
              <p className="font-medium">Actual Result</p>
              <p className="text-muted-foreground">{tc.actualResult}</p>
            </div>
          )}
        </section>

        <section className="rounded-xl border p-5 space-y-4">
          <h3 className="font-semibold">Execute Test</h3>
          <div className="space-y-2">
            <Label>Result Status</Label>
            <Select value={status} onChange={(e) => setStatus(e.target.value as TestCaseStatus)}>
              {[TestCaseStatus.PASSED, TestCaseStatus.FAILED, TestCaseStatus.BLOCKED, TestCaseStatus.SKIPPED].map(
                (s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ),
              )}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Actual Result</Label>
            <Textarea value={actualResult} onChange={(e) => setActualResult(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          <Button onClick={() => executeMutation.mutate()} disabled={executeMutation.isPending}>
            Record Result
          </Button>
        </section>
      </div>
    </div>
  );
}
