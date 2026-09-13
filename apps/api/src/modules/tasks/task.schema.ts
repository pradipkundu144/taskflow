import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'invalid id');
const isoDate = z.string().datetime().or(z.string().date());

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).default(''),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: isoDate.optional(),
  assignedTo: objectId.optional(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    status: z.enum(['pending', 'completed']).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    dueDate: isoDate.nullable().optional(),
    assignedTo: objectId.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: 'at least one field required',
  });

export const listFilterSchema = z.object({
  status: z.enum(['pending', 'completed']).optional(),
  assignedTo: objectId.optional(),
  createdBy: objectId.optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListFilterInput = z.infer<typeof listFilterSchema>;
