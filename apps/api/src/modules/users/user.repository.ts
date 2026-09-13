import { Types } from 'mongoose';
import type { Role } from '@taskflow/shared';
import { UserModel, type UserDoc } from './user.model';

export interface CreateUserInput {
  username: string;
  email: string;
  passwordHash: string;
  role: Role;
  manager?: Types.ObjectId;
  teamLead?: Types.ObjectId;
}

export async function findById(id: string): Promise<UserDoc | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  return UserModel.findById(id).lean<UserDoc>().exec();
}

export async function findByEmail(email: string): Promise<UserDoc | null> {
  return UserModel.findOne({ email: email.toLowerCase() })
    .lean<UserDoc>()
    .exec();
}

export async function findByUsername(
  username: string,
): Promise<UserDoc | null> {
  return UserModel.findOne({ username }).lean<UserDoc>().exec();
}

export async function create(input: CreateUserInput): Promise<UserDoc> {
  const doc = await UserModel.create(input);
  return doc.toObject();
}

export async function findAllByRole(role: Role): Promise<UserDoc[]> {
  return UserModel.find({ role }).lean<UserDoc[]>().exec();
}

export async function findTeamLeadsUnderManager(
  managerId: string,
): Promise<UserDoc[]> {
  return UserModel.find({
    role: 'teamLead',
    manager: new Types.ObjectId(managerId),
  })
    .lean<UserDoc[]>()
    .exec();
}

export async function findEmployeesUnderTeamLead(
  teamLeadId: string,
): Promise<UserDoc[]> {
  return UserModel.find({
    role: 'employee',
    teamLead: new Types.ObjectId(teamLeadId),
  })
    .lean<UserDoc[]>()
    .exec();
}

export async function findEmployeesInManagerHierarchy(
  managerId: string,
): Promise<UserDoc[]> {
  const teamLeads = await findTeamLeadsUnderManager(managerId);
  if (teamLeads.length === 0) return [];
  return UserModel.find({
    role: 'employee',
    teamLead: { $in: teamLeads.map((tl) => tl._id) },
  })
    .lean<UserDoc[]>()
    .exec();
}

export async function findUnassigned(
  role: 'teamLead' | 'employee',
): Promise<UserDoc[]> {
  const filter =
    role === 'teamLead'
      ? { role, manager: { $exists: false } }
      : { role, teamLead: { $exists: false } };
  return UserModel.find(filter).lean<UserDoc[]>().exec();
}

export async function setManager(
  userId: string,
  managerId: string | null,
): Promise<UserDoc | null> {
  const patch =
    managerId === null
      ? { $unset: { manager: 1 } }
      : { manager: new Types.ObjectId(managerId) };
  return UserModel.findByIdAndUpdate(userId, patch, { new: true })
    .lean<UserDoc>()
    .exec();
}

export async function setTeamLead(
  userId: string,
  teamLeadId: string | null,
): Promise<UserDoc | null> {
  const patch =
    teamLeadId === null
      ? { $unset: { teamLead: 1 } }
      : { teamLead: new Types.ObjectId(teamLeadId) };
  return UserModel.findByIdAndUpdate(userId, patch, { new: true })
    .lean<UserDoc>()
    .exec();
}
