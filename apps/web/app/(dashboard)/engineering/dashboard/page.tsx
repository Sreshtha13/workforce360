"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress-bar";
import { Code, GraduationCap, GitBranch, CheckCircle, AlertCircle } from "lucide-react";
import type { TaskStatus } from "@/types/pm";

function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
  return new Date(value).toLocaleDateString("en-US", options);
}

const taskStatusColors: Record<TaskStatus, string> = {
  TODO: "bg-gray-500",
  IN_PROGRESS: "bg-blue-500",
  IN_REVIEW: "bg-purple-500",
  DONE: "bg-green-500",
  CANCELLED: "bg-red-500",
};

export default function EngineeringDashboardPage() {
  const { user } = useAuth();

  const { data: sprintDashboard } = useQuery({
    queryKey: ["engineering", "dashboard", "my-sprint"],
    queryFn: async () => (await apiClient.engineering.dashboard.mySprintDashboard()).data,
  });

  const { data: metrics } = useQuery({
    queryKey: ["engineering", "dashboard", "my-metrics"],
    queryFn: async () => (await apiClient.engineering.dashboard.myMetrics()).data,
  });

  const { data: myTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["pm", "tasks", "my-tasks", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await apiClient.pm.tasks.list({ assigneeId: user.id });
      return res.data ?? [];
    },
    enabled: Boolean(user?.id),
  });

  const { data: myCodeReviews } = useQuery({
    queryKey: ["engineering", "code-reviews", "assigned"],
    queryFn: async () => {
      const res = await apiClient.engineering.codeReviews.list({ reviewerId: "me" });
      return res.data ?? [];
    },
  });

  const { data: myTrainings } = useQuery({
    queryKey: ["engineering", "training", "my-enrollments"],
    queryFn: async () => {
      const res = await apiClient.engineering.training.myEnrollments();
      return res.data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Engineering Dashboard</h1>
        <p className="text-muted-foreground">Your development and QA workspace</p>
      </div>

      {sprintDashboard && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Current Sprint: {sprintDashboard.sprint.name}
            </CardTitle>
            <CardDescription>
              {sprintDashboard.sprint.startDate && sprintDashboard.sprint.endDate &&
                `${formatDate(sprintDashboard.sprint.startDate, { month: "short", day: "numeric" })} - ${formatDate(sprintDashboard.sprint.endDate, { month: "short", day: "numeric", year: "numeric" })}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Sprint Progress</span>
                  <span className="text-sm text-muted-foreground">{sprintDashboard.progress}%</span>
                </div>
                <Progress value={sprintDashboard.progress} />
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{sprintDashboard.tasks.todo}</p>
                  <p className="text-xs text-muted-foreground">To Do</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{sprintDashboard.tasks.inProgress}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{sprintDashboard.tasks.done}</p>
                  <p className="text-xs text-muted-foreground">Done</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{sprintDashboard.tasks.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {metrics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Tasks Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.tasksCompleted}</div>
              <p className="text-xs text-muted-foreground mt-1">This period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Code className="h-4 w-4" />
                Code Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.codeReviewsCompleted}</div>
              <p className="text-xs text-muted-foreground mt-1">Reviewed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Test Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.testCasesExecuted}</div>
              <p className="text-xs text-muted-foreground mt-1">Executed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Trainings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.trainingsCompleted}</div>
              <p className="text-xs text-muted-foreground mt-1">Completed</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>My Sprint Items</CardTitle>
          <CardDescription>Tasks assigned to you</CardDescription>
        </CardHeader>
        <CardContent>
          {tasksLoading ? (
            <div>Loading...</div>
          ) : myTasks && myTasks.length > 0 ? (
            <div className="space-y-2">
              {myTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{task.title}</p>
                      <Badge className={taskStatusColors[task.status]}>
                        {task.status}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{task.description}</p>
                    )}
                  </div>
                  {task.estimatedHours && (
                    <span className="text-sm text-muted-foreground">{task.estimatedHours}h</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No tasks assigned</p>
          )}
        </CardContent>
      </Card>

      {myCodeReviews && myCodeReviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Code Reviews</CardTitle>
            <CardDescription>Code reviews waiting for your feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {myCodeReviews.map((review) => (
                <div key={review.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{review.title}</p>
                    <p className="text-sm text-muted-foreground">
                      By: {review.author?.firstName} {review.author?.lastName} •{" "}
                      {formatDate(review.requestedAt, { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <Link href={`/engineering/code-reviews/${review.id}`}>
                    <Badge variant="outline">Review</Badge>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {myTrainings && myTrainings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Training Progress</CardTitle>
            <CardDescription>Technical trainings and assessments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myTrainings.slice(0, 3).map((enrollment) => (
                <div key={enrollment.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{enrollment.training?.title}</p>
                    <Badge variant={enrollment.status === "COMPLETED" ? "default" : "secondary"}>
                      {enrollment.status}
                    </Badge>
                  </div>
                  {enrollment.training?.duration && (
                    <p className="text-sm text-muted-foreground">Duration: {enrollment.training.duration} min</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
