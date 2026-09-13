import type { AuthUser, Role } from '@taskflow/shared';
import { BadRequestError, NotFoundError } from '../../lib/errors';
import { asyncHandler } from '../../middleware/error';
import type { UserDoc } from '../users/user.model';
import * as userRepo from '../users/user.repository';
import { setManagerSchema, setTeamLeadSchema } from './admin.schema';

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

export const listByRoleController = asyncHandler(async (req, res) => {
  const role = req.params.role as Role;
  if (!['manager', 'teamLead', 'employee'].includes(role)) {
    throw new BadRequestError('invalid role');
  }
  const users = await userRepo.findAllByRole(role);
  res.json(users.map(toAuthUser));
});

export const listUnassignedController = asyncHandler(async (req, res) => {
  const role = req.params.role;
  if (role !== 'teamLead' && role !== 'employee') {
    throw new BadRequestError('role must be teamLead or employee');
  }
  const users = await userRepo.findUnassigned(role);
  res.json(users.map(toAuthUser));
});

export const setManagerController = asyncHandler(async (req, res) => {
  const { managerId } = setManagerSchema.parse(req.body);
  const target = await userRepo.findById(String(req.params.id));
  if (!target) throw new NotFoundError('user not found');
  if (target.role !== 'teamLead') {
    throw new BadRequestError('only teamLeads have a manager');
  }
  if (managerId) {
    const mgr = await userRepo.findById(managerId);
    if (!mgr || mgr.role !== 'manager') {
      throw new BadRequestError('managerId is not a manager');
    }
  }
  const updated = await userRepo.setManager(String(req.params.id), managerId);
  if (!updated) throw new NotFoundError('user not found');
  res.json(toAuthUser(updated));
});

export const setTeamLeadController = asyncHandler(async (req, res) => {
  const { teamLeadId } = setTeamLeadSchema.parse(req.body);
  const target = await userRepo.findById(String(req.params.id));
  if (!target) throw new NotFoundError('user not found');
  if (target.role !== 'employee') {
    throw new BadRequestError('only employees have a teamLead');
  }
  if (teamLeadId) {
    const tl = await userRepo.findById(teamLeadId);
    if (!tl || tl.role !== 'teamLead') {
      throw new BadRequestError('teamLeadId is not a teamLead');
    }
  }
  const updated = await userRepo.setTeamLead(String(req.params.id), teamLeadId);
  if (!updated) throw new NotFoundError('user not found');
  res.json(toAuthUser(updated));
});
