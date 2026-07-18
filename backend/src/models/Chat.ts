import { Schema, model, Document } from 'mongoose';

export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface IChat extends Document {
  userId: Schema.Types.ObjectId | string;
  messages: IChatMessage[];
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const ChatSchema = new Schema<IChat>({
  userId: { type: Schema.Types.Mixed, required: true },
  messages: [ChatMessageSchema],
  createdAt: { type: Date, default: Date.now }
});

export const Chat = model<IChat>('Chat', ChatSchema);
