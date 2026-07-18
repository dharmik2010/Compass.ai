import { Schema, model, Document } from 'mongoose';

export interface IDestination extends Document {
  name: string;
  country: string;
  description: string;
  weatherSnapshot: {
    condition: string;
    temp: number;
  };
  estimatedCost: number;
  bestTime: string;
  safetyScore: number;
  reason: string;
  popularityScore: number;
  visaInfo: string;
  avgBudget: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  imageUrl: string;
  tags: string[];
  vectorEmbeddings: number[];
  createdAt: Date;
}

const DestinationSchema = new Schema<IDestination>({
  name: { type: String, required: true },
  country: { type: String, required: true },
  description: { type: String, default: '' },
  weatherSnapshot: {
    condition: { type: String, default: 'Clear' },
    temp: { type: Number, default: 22 }
  },
  estimatedCost: { type: Number, required: true },
  bestTime: { type: String, required: true },
  safetyScore: { type: Number, default: 4.5 },
  reason: { type: String, default: '' },
  popularityScore: { type: Number, default: 90 },
  visaInfo: { type: String, default: 'Visa Free/On Arrival' },
  avgBudget: { type: Number, default: 1000 },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  imageUrl: { type: String, default: '' },
  tags: { type: [String], default: [] },
  vectorEmbeddings: { type: [Number], default: [] },
  createdAt: { type: Date, default: Date.now }
});

export const Destination = model<IDestination>('Destination', DestinationSchema);
