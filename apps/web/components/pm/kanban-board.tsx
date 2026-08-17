"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Task, TaskPriority, TaskStatus } from "@/types/pm";

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: "bg-green-500",
  MEDIUM: "bg-blue-500",
  HIGH: "bg-orange-500",
  URGENT: "bg-red-500",
};

type KanbanBoardProps = {
  columns: TaskStatus[];
  columnLabels: Record<TaskStatus, string>;
  columnColors: Record<TaskStatus, string>;
  grouped: Record<TaskStatus, Task[]>;
  onStatusChange: (taskId: string, status: TaskStatus, sortOrder?: number) => void;
  taskHref?: (taskId: string) => string;
};

export function KanbanBoard({
  columns,
  columnLabels,
  columnColors,
  grouped,
  onStatusChange,
  taskHref = (id) => `/pm/tasks/${id}`,
}: KanbanBoardProps) {
  const router = useRouter();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const handleDrop = (status: TaskStatus, index: number) => {
    if (!draggedId) return;
    onStatusChange(draggedId, status, index);
    setDraggedId(null);
    setDragOverColumn(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((status) => (
        <div
          key={status}
          className={cn(
            "flex-shrink-0 w-80 rounded-lg border bg-card transition-shadow",
            dragOverColumn === status && "ring-2 ring-brand-500 shadow-md",
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverColumn(status);
          }}
          onDragLeave={() => setDragOverColumn((prev) => (prev === status ? null : prev))}
          onDrop={() => handleDrop(status, grouped[status].length)}
        >
          <div className={`px-4 py-3 rounded-t-lg ${columnColors[status]}`}>
            <h3 className="font-semibold">
              {columnLabels[status]}
              <span className="ml-2 text-sm font-normal">({grouped[status].length})</span>
            </h3>
          </div>
          <div className="p-2 space-y-2 max-h-[calc(100vh-20rem)] overflow-y-auto">
            {grouped[status].map((task, index) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => {
                  setDraggedId(task.id);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", task.id);
                }}
                onDragEnd={() => {
                  setDraggedId(null);
                  setDragOverColumn(null);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.stopPropagation();
                  handleDrop(status, index);
                }}
                className={cn(
                  "p-3 rounded-lg border bg-background hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing",
                  draggedId === task.id && "opacity-50",
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <button
                    type="button"
                    className="font-medium flex-1 text-left hover:underline"
                    onClick={() => router.push(taskHref(task.id))}
                  >
                    {task.title}
                  </button>
                  <div
                    className={`w-2 h-2 rounded-full ml-2 mt-1 shrink-0 ${PRIORITY_COLORS[task.priority]}`}
                    title={task.priority}
                  />
                </div>
                {task.description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {task.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs">
                  {task.assignee && (
                    <span className="text-muted-foreground">
                      {task.assignee.firstName} {task.assignee.lastName}
                    </span>
                  )}
                  {task.estimatedHours && (
                    <Badge variant="outline" className="text-xs">
                      {task.estimatedHours}h
                    </Badge>
                  )}
                </div>
                {task._count && (task._count.comments > 0 || task._count.timeEntries > 0) && (
                  <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                    {task._count.comments > 0 && <span>💬 {task._count.comments}</span>}
                    {task._count.timeEntries > 0 && <span>⏱️ {task._count.timeEntries}</span>}
                  </div>
                )}
              </div>
            ))}
            {grouped[status].length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Drop tasks here</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
