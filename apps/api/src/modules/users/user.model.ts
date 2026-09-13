import { Schema, Types, model } from 'mongoose';
import {
  ROLES,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  type Role,
} from '@taskflow/shared';

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
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: USERNAME_MIN_LENGTH,
      maxlength: USERNAME_MAX_LENGTH,
    },
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
      enum: [...ROLES],
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
