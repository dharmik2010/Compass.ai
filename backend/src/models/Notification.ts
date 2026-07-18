import { Schema, model, Document } from 'mongoose';

export interface INotification extends Document {
  userId: Schema.Types.ObjectId | string;
  type: 'weather' | 'packing' | 'budget' | 'reminder';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.Mixed, required: true },
  type: { type: String, enum: ['weather', 'packing', 'budget', 'reminder'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const Notification = model<INotification>('Notification', NotificationSchema);
