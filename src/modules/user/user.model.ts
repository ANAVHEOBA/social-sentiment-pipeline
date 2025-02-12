import { model } from 'mongoose';
import { IUser } from './user.interface';
import { UserSchema } from './user.schema';

export const UserModel = model<IUser>('User', UserSchema);
