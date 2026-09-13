import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import {
  listByRoleController,
  listUnassignedController,
  setManagerController,
  setTeamLeadController,
} from './admin.controller';

export const adminRouter = Router();

adminRouter.use(authenticate, authorize('admin'));

adminRouter.get('/users/by-role/:role', listByRoleController);
adminRouter.get('/users/unassigned/:role', listUnassignedController);
adminRouter.patch('/users/:id/manager', setManagerController);
adminRouter.patch('/users/:id/team-lead', setTeamLeadController);
