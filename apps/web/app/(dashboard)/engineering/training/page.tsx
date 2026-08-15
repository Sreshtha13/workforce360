"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress-bar";
import { SimpleTabs } from "@/components/ui/simple-tabs";
import { GraduationCap, Clock, Award, ExternalLink } from "lucide-react";
import { TrainingStatus } from "@/types/engineering";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TrainingPage() {
  const queryClient = useQueryClient();

  const { data: allTrainings, isLoading: trainingsLoading } = useQuery({
    queryKey: ["engineering", "training"],
    queryFn: async () => {
      const res = await apiClient.engineering.training.list({});
      return res.data ?? [];
    },
  });

  const { data: myEnrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["engineering", "training", "my-enrollments"],
    queryFn: async () => {
      const res = await apiClient.engineering.training.myEnrollments();
      return res.data ?? [];
    },
  });

  const enrollMutation = useMutation({
    mutationFn: (trainingId: string) => apiClient.engineering.training.enroll({ trainingId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engineering", "training"] });
    },
  });

  const isEnrolled = (trainingId: string) => {
    return myEnrollments?.some((e) => e.trainingId === trainingId);
  };

  const getEnrollment = (trainingId: string) => {
    return myEnrollments?.find((e) => e.trainingId === trainingId);
  };

  const completedCount = myEnrollments?.filter((e) => e.status === TrainingStatus.COMPLETED).length || 0;
  const inProgressCount = myEnrollments?.filter((e) => e.status === TrainingStatus.IN_PROGRESS).length || 0;
  const totalEnrolled = myEnrollments?.length || 0;
  const completionRate = totalEnrolled > 0 ? (completedCount / totalEnrolled) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Technical Training</h1>
        <p className="text-muted-foreground">Learning and development resources</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Enrolled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnrolled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <div className="mt-2">
              <Progress value={completionRate} />
              <p className="text-xs text-muted-foreground mt-1">
                {completionRate.toFixed(0)}% completion rate
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <SimpleTabs
        defaultValue="my-trainings"
        tabs={[
          {
            value: "my-trainings",
            label: "My Trainings",
            content: (
              <div className="grid gap-4 md:grid-cols-2">
                {enrollmentsLoading ? (
                  <div className="col-span-full text-center py-8">Loading...</div>
                ) : myEnrollments && myEnrollments.length > 0 ? (
                  myEnrollments.map((enrollment) => (
                    <Card key={enrollment.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{enrollment.training?.title}</CardTitle>
                            {enrollment.training?.category && (
                              <Badge variant="outline" className="mt-2">
                                {enrollment.training.category}
                              </Badge>
                            )}
                          </div>
                          <Badge
                            variant={enrollment.status === TrainingStatus.COMPLETED ? "default" : "secondary"}
                            className={enrollment.status === TrainingStatus.COMPLETED ? "bg-green-500" : ""}
                          >
                            {enrollment.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {enrollment.training?.description && (
                            <p className="text-sm text-muted-foreground">
                              {enrollment.training.description}
                            </p>
                          )}
                          {enrollment.training?.duration && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {enrollment.training.duration} minutes
                            </p>
                          )}
                          {enrollment.completedAt && (
                            <p className="text-xs text-muted-foreground">
                              Completed: {formatDate(enrollment.completedAt)}
                            </p>
                          )}
                          {enrollment.score !== null && enrollment.score !== undefined && (
                            <p className="text-sm font-medium">Score: {enrollment.score}%</p>
                          )}
                          {enrollment.training?.url && (
                            <a
                              href={enrollment.training.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-primary hover:underline"
                            >
                              <ExternalLink className="mr-1 h-3 w-3" />
                              Start Training
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center text-muted-foreground py-8">
                    No enrollments yet. Browse available trainings to get started.
                  </div>
                )}
              </div>
            ),
          },
          {
            value: "available",
            label: "Available",
            content: (
              <div className="grid gap-4 md:grid-cols-2">
                {trainingsLoading ? (
                  <div className="col-span-full text-center py-8">Loading...</div>
                ) : allTrainings && allTrainings.length > 0 ? (
                  allTrainings.map((training) => {
                    const enrolled = isEnrolled(training.id);
                    const enrollment = getEnrollment(training.id);

                    return (
                      <Card key={training.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{training.title}</CardTitle>
                              {training.category && (
                                <Badge variant="outline" className="mt-2">
                                  {training.category}
                                </Badge>
                              )}
                            </div>
                            {training.isRequired && (
                              <Badge variant="destructive">Required</Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {training.description && (
                              <p className="text-sm text-muted-foreground">
                                {training.description}
                              </p>
                            )}
                            {training.duration && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {training.duration} minutes
                              </p>
                            )}
                            {!enrolled ? (
                              <Button
                                onClick={() => enrollMutation.mutate(training.id)}
                                disabled={enrollMutation.isPending}
                                className="w-full"
                              >
                                Enroll
                              </Button>
                            ) : (
                              <Badge variant="secondary" className="w-full justify-center">
                                Enrolled ({enrollment?.status})
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <div className="col-span-full text-center text-muted-foreground py-8">
                    No trainings available
                  </div>
                )}
              </div>
            ),
          },
          {
            value: "required",
            label: "Required",
            content: (
              <div className="grid gap-4 md:grid-cols-2">
                {trainingsLoading ? (
                  <div className="col-span-full text-center py-8">Loading...</div>
                ) : (
                  allTrainings
                    ?.filter((t) => t.isRequired)
                    .map((training) => {
                      const enrolled = isEnrolled(training.id);
                      const enrollment = getEnrollment(training.id);

                      return (
                        <Card key={training.id}>
                          <CardHeader>
                            <CardTitle className="text-lg">{training.title}</CardTitle>
                            <CardDescription>{training.category}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {training.description && (
                                <p className="text-sm text-muted-foreground">
                                  {training.description}
                                </p>
                              )}
                              {!enrolled ? (
                                <Button
                                  onClick={() => enrollMutation.mutate(training.id)}
                                  disabled={enrollMutation.isPending}
                                  variant="destructive"
                                  className="w-full"
                                >
                                  Enroll Now (Required)
                                </Button>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <Badge
                                    variant={enrollment?.status === TrainingStatus.COMPLETED ? "default" : "secondary"}
                                    className={enrollment?.status === TrainingStatus.COMPLETED ? "bg-green-500" : ""}
                                  >
                                    {enrollment?.status}
                                  </Badge>
                                  {training.url && (
                                    <a
                                      href={training.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <Button variant="outline" size="sm">
                                        <ExternalLink className="mr-1 h-3 w-3" />
                                        Start
                                      </Button>
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
