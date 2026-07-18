import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  isVerified: boolean;
  verificationOtp?: string;
  verificationOtpExpires?: Date;
  resetPasswordOtp?: string;
  resetPasswordOtpExpires?: Date;
  preferences: {
    diet: string;
    accessibility: string[];
    travelStyle: string[];
  };
  savedPlaces: string[];
  achievements: string[];
  role: 'user' | 'admin';
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  verificationOtp: { type: String },
  verificationOtpExpires: { type: Date },
  resetPasswordOtp: { type: String },
  resetPasswordOtpExpires: { type: Date },
  preferences: {
    diet: { type: String, default: 'None' },
    accessibility: { type: [String], default: [] },
    travelStyle: { type: [String], default: [] }
  },
  savedPlaces: { type: [String], default: [] },
  achievements: { type: [String], default: [] },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

export const User = model<IUser>('User', UserSchema);
