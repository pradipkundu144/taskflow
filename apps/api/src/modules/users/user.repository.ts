import type { Types } from 'mongoose';
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
  return UserModel.findById(id).lean<UserDoc>().exec();
}

export async function findByEmail(email: string): Promise<UserDoc | null> {
  return UserModel.findOne({ email: email.toLowerCase() })
    .lean<UserDoc>()
    .exec();
}

export async function findByUsername(username: string): Promise<UserDoc | null> {
  return UserModel.findOne({ username }).lean<UserDoc>().exec();
}

export async function create(input: CreateUserInput): Promise<UserDoc> {
  const doc = await UserModel.create(input);
  return doc.toObject();
}
