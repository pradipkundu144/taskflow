import { Schema, Types, model } from 'mongoose';
import type { Role } from '@taskflow/shared';

export interface UserDoc {
  _id: Types.ObjectId;
  username: string;
  email: string;
  passwordHash: string;
  role: Role;
  manager?: Types.ObjectId;
  teamLead?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'manager', 'teamLead', 'employee'],
      required: true,
    },
    manager: { type: Schema.Types.ObjectId, ref: 'User' },
    teamLead: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

userSchema.index({ role: 1, teamLead: 1 });
userSchema.index({ role: 1, manager: 1 });

export const UserModel = model<UserDoc>('User', userSchema);
