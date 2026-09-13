import { OPERATIONAL_ROLES } from '@taskflow/shared';
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import {
  createController,
  deleteController,
  getController,
  listController,
  updateController,
} from './task.controller';

export const tasksRouter = Router();

tasksRouter.use(authenticate, authorize(...OPERATIONAL_ROLES));
tasksRouter.get('/', listController);
tasksRouter.post('/', createController);
tasksRouter.get('/:id', getController);
tasksRouter.patch('/:id', updateController);
tasksRouter.delete('/:id', deleteController);
