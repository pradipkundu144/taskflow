import { UnauthorizedError } from '../../lib/errors';
import { asyncHandler } from '../../middleware/error';
import {
  createTaskSchema,
  listFilterSchema,
  updateTaskSchema,
} from './task.schema';
import * as taskService from './task.service';

function requireUser(req: Parameters<Parameters<typeof asyncHandler>[0]>[0]) {
  if (!req.user) throw new UnauthorizedError('not authenticated');
  return req.user;
}

export const createController = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const input = createTaskSchema.parse(req.body);
  const task = await taskService.createTask(user, input);
  res.status(201).json(task);
});

export const listController = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const filter = listFilterSchema.parse(req.query);
  const tasks = await taskService.listTasks(user, filter);
  res.json(tasks);
});

export const getController = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const task = await taskService.getTask(user, String(req.params.id));
  res.json(task);
});

export const updateController = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const patch = updateTaskSchema.parse(req.body);
  const task = await taskService.updateTask(user, String(req.params.id), patch);
  res.json(task);
});

export const deleteController = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  await taskService.deleteTask(user, String(req.params.id));
  res.status(204).end();
});
