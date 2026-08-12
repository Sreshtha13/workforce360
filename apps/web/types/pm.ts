// Project Management Module Types

export type ProjectStatus =
  | "PLANNING"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED";

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "DONE"
  | "CANCELLED";

export type TaskPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";

export type SprintStatus =
  | "PLANNING"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED";

export interface Project {
  id: string;
  leadId?: string;
  name: string;
  code?: string;
  description?: string;
  status: ProjectStatus;
  budget?: string;
  currency: string;
  startDate?: string;
  endDate?: string;
  managerId?: string;
  clientName?: string;
  clientContactId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  clientContact?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  lead?: {
    id: string;
    title: string;
    status: string;
  };
  _count?: {
    tasks: number;
    milestones: number;
    sprints: number;
    teamAllocations: number;
  };
  milestones?: Milestone[];
  tasks?: Task[];
  sprints?: Sprint[];
  teamAllocations?: ProjectTeamAllocation[];
  budgetTracking?: ProjectBudgetEntry[];
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  dueDate?: string;
  completedAt?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  project?: {
    id: string;
    name: string;
    code?: string;
  };
  _count?: {
    tasks: number;
  };
  tasks?: Task[];
}

export interface Task {
  id: string;
  projectId: string;
  milestoneId?: string;
  sprintId?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  reporterId?: string;
  estimatedHours?: string;
  actualHours?: string;
  dueDate?: string;
  completedAt?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  project?: {
    id: string;
    name: string;
    code?: string;
  };
  milestone?: {
    id: string;
    title: string;
  };
  sprint?: {
    id: string;
    name: string;
    status: SprintStatus;
  };
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  reporter?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  _count?: {
    timeEntries: number;
    comments: number;
  };
  timeEntries?: TaskTimeEntry[];
  comments?: TaskComment[];
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal?: string;
  status: SprintStatus;
  startDate?: string;
  endDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  project?: {
    id: string;
    name: string;
    code?: string;
  };
  _count?: {
    tasks: number;
  };
  tasks?: Task[];
}

export interface TaskTimeEntry {
  id: string;
  taskId: string;
  userId: string;
  hours: string;
  date: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  task?: {
    id: string;
    title: string;
    project?: {
      id: string;
      name: string;
      code?: string;
    };
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
}

export interface ProjectTeamAllocation {
  id: string;
  projectId: string;
  userId: string;
  role?: string;
  allocatedHours?: string;
  joinedAt: string;
  leftAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  project?: {
    id: string;
    name: string;
    code?: string;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    designation?: {
      name: string;
    };
  };
}

export interface ProjectBudgetEntry {
  id: string;
  projectId: string;
  category: string;
  amount: string;
  description?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface ProjectReport {
  project: Project;
  summary: {
    totalTasks: number;
    tasksByStatus: Record<TaskStatus, number>;
    totalEstimatedHours: number;
    totalActualHours: number;
    totalBudgetSpent: number;
    budgetRemaining: number | null;
    completionPercentage: number;
  };
}

// Input Types
export interface CreateProjectInput {
  leadId?: string;
  name: string;
  code?: string;
  description?: string;
  status?: ProjectStatus;
  budget?: number;
  currency?: string;
  startDate?: string;
  endDate?: string;
  managerId?: string;
  clientName?: string;
  clientContactId?: string;
}

export interface UpdateProjectInput {
  name?: string;
  code?: string | null;
  description?: string | null;
  status?: ProjectStatus;
  budget?: number | null;
  currency?: string;
  startDate?: string | null;
  endDate?: string | null;
  managerId?: string | null;
  clientName?: string | null;
  clientContactId?: string | null;
}

export interface CreateMilestoneInput {
  projectId: string;
  title: string;
  description?: string;
  dueDate?: string;
  sortOrder?: number;
}

export interface UpdateMilestoneInput {
  title?: string;
  description?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  sortOrder?: number;
}

export interface CreateTaskInput {
  projectId: string;
  milestoneId?: string;
  sprintId?: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  reporterId?: string;
  estimatedHours?: number;
  dueDate?: string;
  sortOrder?: number;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  milestoneId?: string | null;
  sprintId?: string | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  dueDate?: string | null;
  completedAt?: string | null;
  sortOrder?: number;
}

export interface CreateSprintInput {
  projectId: string;
  name: string;
  goal?: string;
  status?: SprintStatus;
  startDate?: string;
  endDate?: string;
}

export interface UpdateSprintInput {
  name?: string;
  goal?: string | null;
  status?: SprintStatus;
  startDate?: string | null;
  endDate?: string | null;
  completedAt?: string | null;
}

export interface CreateTimeEntryInput {
  taskId: string;
  userId: string;
  hours: number;
  date: string;
  description?: string;
}

export interface UpdateTimeEntryInput {
  hours?: number;
  date?: string;
  description?: string | null;
}

export interface CreateTaskCommentInput {
  taskId: string;
  userId: string;
  content: string;
}

export interface AllocateTeamMemberInput {
  projectId: string;
  userId: string;
  role?: string;
  allocatedHours?: number;
}

export interface UpdateTeamAllocationInput {
  role?: string | null;
  allocatedHours?: number | null;
  leftAt?: string | null;
}

export interface CreateBudgetEntryInput {
  projectId: string;
  category: string;
  amount: number;
  description?: string;
  date: string;
}

export interface UpdateBudgetEntryInput {
  category?: string;
  amount?: number;
  description?: string | null;
  date?: string;
}
