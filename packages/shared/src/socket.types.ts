import type { Task } from './task.types';

export const TASK_EVENTS = {
  CREATED: 'task.created',
  UPDATED: 'task.updated',
  DELETED: 'task.deleted',
} as const;

export type TaskEvent = (typeof TASK_EVENTS)[keyof typeof TASK_EVENTS];

export interface TaskCreatedEvent {
  task: Task;
}

export interface TaskUpdatedEvent {
  task: Task;
}

export interface TaskDeletedEvent {
  taskId: string;
}
