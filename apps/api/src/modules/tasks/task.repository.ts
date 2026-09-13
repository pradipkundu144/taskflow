import { Types } from 'mongoose';
import { TaskModel, type TaskDoc } from './task.model';

type TaskFilter = Record<string, unknown>;

export interface CreateTaskInput {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  createdBy: Types.ObjectId;
  assignedTo: Types.ObjectId;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: 'pending' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date | null;
  assignedTo?: Types.ObjectId;
}

export async function create(input: CreateTaskInput): Promise<TaskDoc> {
  const doc = await TaskModel.create(input);
  return doc.toObject();
}

export async function findById(id: string): Promise<TaskDoc | null> {
  return TaskModel.findById(id).lean<TaskDoc>().exec();
}

export async function findMany(filter: TaskFilter): Promise<TaskDoc[]> {
  return TaskModel.find(filter)
    .sort({ createdAt: -1 })
    .lean<TaskDoc[]>()
    .exec();
}

export async function update(
  id: string,
  patch: UpdateTaskInput,
): Promise<TaskDoc | null> {
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    if (k === 'dueDate' && v === null) {
      cleaned.$unset = {
        ...(cleaned.$unset as object | undefined),
        dueDate: 1,
      };
    } else {
      cleaned[k] = v;
    }
  }
  return TaskModel.findByIdAndUpdate(id, cleaned, { new: true })
    .lean<TaskDoc>()
    .exec();
}

export async function remove(id: string): Promise<boolean> {
  const r = await TaskModel.deleteOne({ _id: new Types.ObjectId(id) }).exec();
  return r.deletedCount === 1;
}
