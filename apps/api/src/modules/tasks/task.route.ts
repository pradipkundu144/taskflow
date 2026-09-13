import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import {
  createController,
  deleteController,
  getController,
  listController,
  updateController,
} from './task.controller';

export const tasksRouter = Router();

tasksRouter.use(authenticate);
tasksRouter.get('/', listController);
tasksRouter.post('/', createController);
tasksRouter.get('/:id', getController);
tasksRouter.patch('/:id', updateController);
tasksRouter.delete('/:id', deleteController);
