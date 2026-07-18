import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/compass-ai';

export const connectDB = async (): Promise<boolean> => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.warn('Backend database is not running. It will auto-fallback to mock storage for safety.');
    return false;
  }
};
