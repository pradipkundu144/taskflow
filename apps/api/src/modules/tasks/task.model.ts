import { Schema, Types, model } from 'mongoose';
import {
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TITLE_MAX_LENGTH,
  type TaskPriority,
  type TaskStatus,
} from '@taskflow/shared';

export interface TaskDoc {
  _id: Types.ObjectId;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  createdBy: Types.ObjectId;
  assignedTo: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<TaskDoc>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: TASK_TITLE_MAX_LENGTH,
    },
    description: {
      type: String,
      default: '',
      maxlength: TASK_DESCRIPTION_MAX_LENGTH,
    },
    status: {
      type: String,
      enum: [...TASK_STATUSES],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: [...TASK_PRIORITIES],
      default: 'medium',
    },
    dueDate: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ createdBy: 1 });

export const TaskModel = model<TaskDoc>('Task', taskSchema);
