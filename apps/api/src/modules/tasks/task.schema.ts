import {
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TITLE_MAX_LENGTH,
} from '@taskflow/shared';
import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'invalid id');
const isoDate = z.string().datetime().or(z.string().date());

export const createTaskSchema = z.object({
  title: z.string().min(1).max(TASK_TITLE_MAX_LENGTH),
  description: z.string().max(TASK_DESCRIPTION_MAX_LENGTH).default(''),
  priority: z.enum(TASK_PRIORITIES).default('medium'),
  dueDate: isoDate.optional(),
  assignedTo: objectId.optional(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().min(1).max(TASK_TITLE_MAX_LENGTH).optional(),
    description: z.string().max(TASK_DESCRIPTION_MAX_LENGTH).optional(),
    status: z.enum(TASK_STATUSES).optional(),
    priority: z.enum(TASK_PRIORITIES).optional(),
    dueDate: isoDate.nullable().optional(),
    assignedTo: objectId.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: 'at least one field required',
  });

export const listFilterSchema = z.object({
  status: z.enum(TASK_STATUSES).optional(),
  assignedTo: objectId.optional(),
  createdBy: objectId.optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListFilterInput = z.infer<typeof listFilterSchema>;
