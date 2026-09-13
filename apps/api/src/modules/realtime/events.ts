import type { Task } from '@taskflow/shared';
import * as userRepo from '../users/user.repository';
import { getIo } from './socket';

async function recipientsFor(assignedTo: string): Promise<Set<string>> {
  const ids = new Set<string>();
  ids.add(assignedTo);
  const target = await userRepo.findById(assignedTo);
  if (!target) return ids;
  if (target.role === 'employee' && target.teamLead) {
    const tlId = target.teamLead.toString();
    ids.add(tlId);
    const tl = await userRepo.findById(tlId);
    if (tl?.manager) ids.add(tl.manager.toString());
  } else if (target.role === 'teamLead' && target.manager) {
    ids.add(target.manager.toString());
  }
  return ids;
}

function emitToUsers(event: string, payload: unknown, userIds: Set<string>) {
  const io = getIo();
  if (!io) return;
  const rooms = ['role:admin', ...[...userIds].map((id) => `user:${id}`)];
  io.to(rooms).emit(event, payload);
}

export async function emitTaskCreated(task: Task): Promise<void> {
  const users = await recipientsFor(task.assignedTo);
  users.add(task.createdBy);
  emitToUsers('task.created', { task }, users);
}

export async function emitTaskUpdated(task: Task): Promise<void> {
  const users = await recipientsFor(task.assignedTo);
  users.add(task.createdBy);
  emitToUsers('task.updated', { task }, users);
}

export async function emitTaskDeleted(
  taskId: string,
  assignedTo: string,
  createdBy: string,
): Promise<void> {
  const users = await recipientsFor(assignedTo);
  users.add(createdBy);
  emitToUsers('task.deleted', { taskId }, users);
}
