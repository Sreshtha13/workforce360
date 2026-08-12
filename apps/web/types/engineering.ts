// Phase 7: Development & QA Module Types

export enum ReleaseStatus {
  PLANNING = "PLANNING",
  IN_PROGRESS = "IN_PROGRESS",
  TESTING = "TESTING",
  STAGING = "STAGING",
  RELEASED = "RELEASED",
  ROLLED_BACK = "ROLLED_BACK",
}

export enum ReleaseType {
  MAJOR = "MAJOR",
  MINOR = "MINOR",
  PATCH = "PATCH",
  HOTFIX = "HOTFIX",
}

export enum TestCaseStatus {
  DRAFT = "DRAFT",
  READY = "READY",
  PASSED = "PASSED",
  FAILED = "FAILED",
  BLOCKED = "BLOCKED",
  SKIPPED = "SKIPPED",
}

export enum TestCasePriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum TrainingStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  EXPIRED = "EXPIRED",
}

export interface Release {
  id: string;
  projectId: string;
  version: string;
  name: string;
  type: ReleaseType;
  status: ReleaseStatus;
  description?: string;
  releaseDate?: string;
  deployedAt?: string;
  deployedById?: string;
  releaseNotes?: string;
  tagName?: string;
  commitHash?: string;
  buildNumber?: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  };
  deployedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  tasks?: Array<{
    id: string;
    title: string;
    status: string;
  }>;
  testCases?: TestCase[];
}

export interface TestCase {
  id: string;
  projectId: string;
  releaseId?: string;
  title: string;
  description?: string;
  steps?: string;
  expectedResult?: string;
  status: TestCaseStatus;
  priority: TestCasePriority;
  assignedToId?: string;
  createdById: string;
  executedAt?: string;
  executedById?: string;
  actualResult?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  };
  release?: {
    id: string;
    version: string;
    name: string;
  };
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  executedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface Documentation {
  id: string;
  projectId?: string;
  title: string;
  description?: string;
  category?: string;
  url?: string;
  content?: string;
  version?: string;
  isPublished: boolean;
  publishedAt?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface TechTraining {
  id: string;
  title: string;
  description?: string;
  category?: string;
  content?: string;
  url?: string;
  duration?: number;
  isRequired: boolean;
  isActive: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  enrollments?: TrainingEnrollment[];
}

export interface TrainingEnrollment {
  id: string;
  trainingId: string;
  userId: string;
  status: TrainingStatus;
  enrolledAt: string;
  startedAt?: string;
  completedAt?: string;
  score?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  training?: TechTraining;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CodeReview {
  id: string;
  taskId?: string;
  projectId: string;
  title: string;
  description?: string;
  pullRequestUrl?: string;
  authorId: string;
  reviewerId?: string;
  status: string;
  reviewNotes?: string;
  requestedAt: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  task?: {
    id: string;
    title: string;
  };
  project?: {
    id: string;
    name: string;
  };
  author?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  reviewer?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface SprintDashboard {
  sprint: {
    id: string;
    name: string;
    goal?: string;
    status: string;
    startDate?: string;
    endDate?: string;
  };
  tasks: {
    todo: number;
    inProgress: number;
    done: number;
    total: number;
  };
  team: Array<{
    userId: string;
    userName: string;
    tasksAssigned: number;
    tasksCompleted: number;
  }>;
  progress: number;
}

export interface EngineeringMetrics {
  userId: string;
  userName: string;
  period: string;
  tasksCompleted: number;
  codeReviewsCompleted: number;
  testCasesExecuted: number;
  trainingsCompleted: number;
  avgTaskCompletionTime: number;
}

// Input types
export interface CreateReleaseInput {
  projectId: string;
  version: string;
  name: string;
  type?: ReleaseType;
  description?: string;
  releaseDate?: string;
  releaseNotes?: string;
  tagName?: string;
  commitHash?: string;
  buildNumber?: string;
}

export interface UpdateReleaseInput {
  name?: string;
  status?: ReleaseStatus;
  description?: string;
  releaseDate?: string;
  releaseNotes?: string;
  tagName?: string;
  commitHash?: string;
  buildNumber?: string;
}

export interface CreateTestCaseInput {
  projectId: string;
  releaseId?: string;
  title: string;
  description?: string;
  steps?: string;
  expectedResult?: string;
  priority?: TestCasePriority;
  assignedToId?: string;
}

export interface UpdateTestCaseInput {
  title?: string;
  description?: string;
  steps?: string;
  expectedResult?: string;
  status?: TestCaseStatus;
  priority?: TestCasePriority;
  assignedToId?: string;
}

export interface ExecuteTestCaseInput {
  status: TestCaseStatus;
  actualResult?: string;
  notes?: string;
}

export interface CreateDocumentationInput {
  projectId?: string;
  title: string;
  description?: string;
  category?: string;
  url?: string;
  content?: string;
  version?: string;
}

export interface UpdateDocumentationInput {
  title?: string;
  description?: string;
  category?: string;
  url?: string;
  content?: string;
  version?: string;
  isPublished?: boolean;
}

export interface CreateTrainingInput {
  title: string;
  description?: string;
  category?: string;
  content?: string;
  url?: string;
  duration?: number;
  isRequired?: boolean;
}

export interface UpdateTrainingInput {
  title?: string;
  description?: string;
  category?: string;
  content?: string;
  url?: string;
  duration?: number;
  isRequired?: boolean;
  isActive?: boolean;
}

export interface EnrollTrainingInput {
  trainingId: string;
}

export interface UpdateEnrollmentInput {
  status?: TrainingStatus;
  startedAt?: string;
  completedAt?: string;
  score?: number;
  notes?: string;
}

export interface CreateCodeReviewInput {
  taskId?: string;
  projectId: string;
  title: string;
  description?: string;
  pullRequestUrl?: string;
  reviewerId?: string;
}

export interface UpdateCodeReviewInput {
  reviewerId?: string;
  status?: string;
  reviewNotes?: string;
}
