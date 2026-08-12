"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TaskStatus, TaskPriority } from "@/types/pm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectBacklogPage({ params }: PageProps) {
  const { id } = use(params);

  const { data: project } = useQuery({
    queryKey: ["pm", "projects", id],
    queryFn: () => apiClient.pm.projects.get(id),
  });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["pm", "tasks", id, "backlog"],
    queryFn: () => apiClient.pm.tasks.list({ projectId: id, status: TaskStatus.TODO }),
  });

  const getPriorityColor = (priority: TaskPriority) => {
    const colors = {
      [TaskPriority.LOW]: "bg-gray-500",
      [TaskPriority.MEDIUM]: "bg-blue-500",
      [TaskPriority.HIGH]: "bg-orange-500",
      [TaskPriority.URGENT]: "bg-red-500",
    };
    return colors[priority];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Backlog</h1>
          <p className="text-muted-foreground">{project?.name}</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Backlog Items</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : tasks && tasks.length > 0 ? (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{task.title}</p>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {task.assignee && (
                        <span>Assigned to: {task.assignee.firstName} {task.assignee.lastName}</span>
                      )}
                      {task.estimatedHours && (
                        <span>Est: {task.estimatedHours}h</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No backlog items</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
