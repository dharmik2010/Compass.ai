import { Schema, model, Document } from 'mongoose';

export interface IReview extends Document {
  userId: Schema.Types.ObjectId | string;
  userName: string;
  destinationId?: Schema.Types.ObjectId | string;
  tripId?: Schema.Types.ObjectId | string;
  rating: number;
  comment: string;
  photos: string[];
  likes: string[];
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  userId: { type: Schema.Types.Mixed, required: true },
  userName: { type: String, required: true, default: 'Traveler' },
  destinationId: { type: Schema.Types.Mixed },
  tripId: { type: Schema.Types.Mixed },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  photos: { type: [String], default: [] },
  likes: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

export const Review = model<IReview>('Review', ReviewSchema);
