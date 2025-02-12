import { Schema } from 'mongoose';
import { IUser } from './user.interface';
import bcrypt from 'bcrypt';

export const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  apiKey: { type: String },
  watchlist: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  watchedTokens: [{
    chainId: { type: String, required: true },
    tokenAddress: { type: String, required: true },
    addedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Add password hashing pre-save hook
UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});
