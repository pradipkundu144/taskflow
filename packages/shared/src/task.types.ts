export const TASK_STATUSES = ['pending', 'completed'] as const;
export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdBy: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  priority?: TaskPriority;
  dueDate?: string;
  assignedTo?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  assignedTo?: string;
}

export interface TaskListFilter {
  status?: TaskStatus;
  assignedTo?: string;
  createdBy?: string;
}
