"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Plus, FlaskConical } from "lucide-react";
import { TestCasePriority, TestCaseStatus } from "@/types/engineering";

const statusColors: Record<TestCaseStatus, string> = {
  [TestCaseStatus.DRAFT]: "bg-gray-500",
  [TestCaseStatus.READY]: "bg-blue-500",
  [TestCaseStatus.PASSED]: "bg-green-500",
  [TestCaseStatus.FAILED]: "bg-red-500",
  [TestCaseStatus.BLOCKED]: "bg-orange-500",
  [TestCaseStatus.SKIPPED]: "bg-yellow-500",
};

export default function TestCasesPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");
  const [expectedResult, setExpectedResult] = useState("");
  const [priority, setPriority] = useState<TestCasePriority>(TestCasePriority.MEDIUM);
  const queryClient = useQueryClient();

  const { data: testCases, isLoading } = useQuery({
    queryKey: ["engineering", "test-cases"],
    queryFn: async () => {
      const res = await apiClient.engineering.testCases.list({});
      return res.data ?? [];
    },
  });

  const { data: projects } = useQuery({
    queryKey: ["pm", "projects"],
    queryFn: async () => {
      const res = await apiClient.pm.projects.list({});
      return res.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.engineering.testCases.create({
        projectId,
        title,
        description,
        steps,
        expectedResult,
        priority,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engineering", "test-cases"] });
      setIsOpen(false);
      setProjectId("");
      setTitle("");
      setDescription("");
      setSteps("");
      setExpectedResult("");
      setPriority(TestCasePriority.MEDIUM);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Test Cases</h1>
          <p className="text-muted-foreground">QA test case management and execution</p>
        </div>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Test Case
        </Button>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Create Test Case</SheetTitle>
              <SheetDescription>Define a new test case for QA</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  <option value="">Select project</option>
                  {projects?.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onChange={(e) => setPriority(e.target.value as TestCasePriority)}>
                  {Object.values(TestCasePriority).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Steps</Label>
                <Textarea value={steps} onChange={(e) => setSteps(e.target.value)} rows={4} />
              </div>
              <div className="space-y-2">
                <Label>Expected Result</Label>
                <Textarea value={expectedResult} onChange={(e) => setExpectedResult(e.target.value)} rows={2} />
              </div>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!projectId || !title || createMutation.isPending}
                className="w-full"
              >
                Create Test Case
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            All Test Cases
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : testCases && testCases.length > 0 ? (
            <div className="space-y-3">
              {testCases.map((tc) => (
                <div key={tc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/engineering/test-cases/${tc.id}`} className="font-medium hover:underline">
                        {tc.title}
                      </Link>
                      <Badge className={statusColors[tc.status]}>{tc.status}</Badge>
                      <Badge variant="outline">{tc.priority}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{tc.project?.name}</p>
                    {tc.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{tc.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No test cases yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
