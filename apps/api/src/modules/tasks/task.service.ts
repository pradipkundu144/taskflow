import { Types } from 'mongoose';
import type { Task } from '@taskflow/shared';
import { ForbiddenError, NotFoundError } from '../../lib/errors';
import type { AccessPayload } from '../auth/jwt';
import * as userRepo from '../users/user.repository';
import type { TaskDoc } from './task.model';
import * as taskRepo from './task.repository';

type TaskFilter = Record<string, unknown>;
import type {
  CreateTaskInput,
  ListFilterInput,
  UpdateTaskInput,
} from './task.schema';

function toTask(t: TaskDoc): Task {
  return {
    id: t._id.toString(),
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate ? t.dueDate.toISOString() : undefined,
    createdBy: t.createdBy.toString(),
    assignedTo: t.assignedTo.toString(),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

async function canAssignTo(
  actor: AccessPayload,
  targetUserId: string,
): Promise<boolean> {
  if (actor.sub === targetUserId) return true;
  if (actor.role === 'admin') return true;
  if (actor.role === 'employee') return false;
  const target = await userRepo.findById(targetUserId);
  if (!target) return false;
  if (actor.role === 'teamLead') {
    return (
      target.role === 'employee' && target.teamLead?.toString() === actor.sub
    );
  }
  if (actor.role === 'manager') {
    if (target.role === 'teamLead') {
      return target.manager?.toString() === actor.sub;
    }
    if (target.role === 'employee') {
      const tlId = target.teamLead?.toString();
      if (!tlId) return false;
      const tl = await userRepo.findById(tlId);
      return tl?.manager?.toString() === actor.sub;
    }
  }
  return false;
}

async function visibleTaskFilter(actor: AccessPayload): Promise<TaskFilter> {
  if (actor.role === 'admin') return {};
  if (actor.role === 'employee') {
    return { assignedTo: new Types.ObjectId(actor.sub) };
  }
  if (actor.role === 'teamLead') {
    const employees = await userRepo.findEmployeesUnderTeamLead(actor.sub);
    const ids = [new Types.ObjectId(actor.sub), ...employees.map((e) => e._id)];
    return { assignedTo: { $in: ids } };
  }
  const teamLeads = await userRepo.findTeamLeadsUnderManager(actor.sub);
  const employees = await userRepo.findEmployeesInManagerHierarchy(actor.sub);
  const ids = [
    new Types.ObjectId(actor.sub),
    ...teamLeads.map((tl) => tl._id),
    ...employees.map((e) => e._id),
  ];
  return { assignedTo: { $in: ids } };
}

export async function createTask(
  actor: AccessPayload,
  input: CreateTaskInput,
): Promise<Task> {
  const assignedTo = input.assignedTo ?? actor.sub;
  if (!(await canAssignTo(actor, assignedTo))) {
    throw new ForbiddenError('cannot assign to that user');
  }
  const doc = await taskRepo.create({
    title: input.title,
    description: input.description,
    priority: input.priority,
    dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
    createdBy: new Types.ObjectId(actor.sub),
    assignedTo: new Types.ObjectId(assignedTo),
  });
  return toTask(doc);
}

export async function listTasks(
  actor: AccessPayload,
  filter: ListFilterInput,
): Promise<Task[]> {
  const base = await visibleTaskFilter(actor);
  const q: TaskFilter = { ...base };
  if (filter.status) q.status = filter.status;
  if (filter.createdBy) q.createdBy = new Types.ObjectId(filter.createdBy);
  if (filter.assignedTo) {
    q.assignedTo = new Types.ObjectId(filter.assignedTo);
  }
  const docs = await taskRepo.findMany(q);
  return docs.map(toTask);
}

async function loadVisible(actor: AccessPayload, id: string): Promise<TaskDoc> {
  const task = await taskRepo.findById(id);
  if (!task) throw new NotFoundError('task not found');
  const base = await visibleTaskFilter(actor);
  const assignedTo = base.assignedTo;
  if (assignedTo && typeof assignedTo === 'object' && '$in' in assignedTo) {
    const ids = assignedTo.$in as Types.ObjectId[];
    if (!ids.some((id) => id.equals(task.assignedTo))) {
      throw new NotFoundError('task not found');
    }
  } else if (
    assignedTo instanceof Types.ObjectId &&
    !assignedTo.equals(task.assignedTo)
  ) {
    throw new NotFoundError('task not found');
  }
  return task;
}

export async function getTask(actor: AccessPayload, id: string): Promise<Task> {
  const task = await loadVisible(actor, id);
  return toTask(task);
}

export async function updateTask(
  actor: AccessPayload,
  id: string,
  patch: UpdateTaskInput,
): Promise<Task> {
  const task = await loadVisible(actor, id);
  if (patch.assignedTo && !(await canAssignTo(actor, patch.assignedTo))) {
    throw new ForbiddenError('cannot reassign to that user');
  }
  if (
    actor.role === 'employee' &&
    task.assignedTo.toString() !== actor.sub &&
    task.createdBy.toString() !== actor.sub
  ) {
    throw new ForbiddenError('cannot modify this task');
  }
  const cleaned: Parameters<typeof taskRepo.update>[1] = {};
  if (patch.title !== undefined) cleaned.title = patch.title;
  if (patch.description !== undefined) cleaned.description = patch.description;
  if (patch.status !== undefined) cleaned.status = patch.status;
  if (patch.priority !== undefined) cleaned.priority = patch.priority;
  if (patch.dueDate === null) cleaned.dueDate = null;
  else if (patch.dueDate) cleaned.dueDate = new Date(patch.dueDate);
  if (patch.assignedTo) {
    cleaned.assignedTo = new Types.ObjectId(patch.assignedTo);
  }
  const updated = await taskRepo.update(id, cleaned);
  if (!updated) throw new NotFoundError('task not found');
  return toTask(updated);
}

export async function deleteTask(
  actor: AccessPayload,
  id: string,
): Promise<void> {
  const task = await loadVisible(actor, id);
  if (
    actor.role === 'employee' &&
    task.createdBy.toString() !== actor.sub &&
    task.assignedTo.toString() !== actor.sub
  ) {
    throw new ForbiddenError('cannot delete this task');
  }
  const removed = await taskRepo.remove(id);
  if (!removed) throw new NotFoundError('task not found');
}
