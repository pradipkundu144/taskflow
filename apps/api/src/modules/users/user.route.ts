import { OPERATIONAL_ROLES, type AuthUser } from '@taskflow/shared';
import { Router } from 'express';
import { UnauthorizedError } from '../../lib/errors';
import { asyncHandler } from '../../middleware/error';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import type { UserDoc } from './user.model';
import * as userRepo from './user.repository';

function toAuthUser(u: UserDoc): AuthUser {
  return {
    id: u._id.toString(),
    username: u.username,
    email: u.email,
    role: u.role,
    manager: u.manager?.toString(),
    teamLead: u.teamLead?.toString(),
  };
}

export const usersRouter = Router();

usersRouter.use(authenticate, authorize(...OPERATIONAL_ROLES));

usersRouter.get(
  '/assignable',
  asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError('not authenticated');
    const actor = req.user;

    if (actor.role === 'employee') {
      const self = await userRepo.findById(actor.sub);
      res.json(self ? [toAuthUser(self)] : []);
      return;
    }

    if (actor.role === 'teamLead') {
      const [self, employees] = await Promise.all([
        userRepo.findById(actor.sub),
        userRepo.findEmployeesUnderTeamLead(actor.sub),
      ]);
      const out: AuthUser[] = [];
      if (self) out.push(toAuthUser(self));
      for (const e of employees) out.push(toAuthUser(e));
      res.json(out);
      return;
    }

    if (actor.role === 'manager') {
      const [self, teamLeads, employees] = await Promise.all([
        userRepo.findById(actor.sub),
        userRepo.findTeamLeadsUnderManager(actor.sub),
        userRepo.findEmployeesInManagerHierarchy(actor.sub),
      ]);
      const out: AuthUser[] = [];
      if (self) out.push(toAuthUser(self));
      for (const tl of teamLeads) out.push(toAuthUser(tl));
      for (const e of employees) out.push(toAuthUser(e));
      res.json(out);
      return;
    }

    res.json([]);
  }),
);
