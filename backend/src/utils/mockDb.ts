import mongoose from 'mongoose';

// In-memory arrays for runtime persistence when MongoDB is offline
export const mockUsers: any[] = [];
export const mockTrips: any[] = [];
export const mockDestinations: any[] = [];
export const mockReviews: any[] = [];
export const mockNotifications: any[] = [];
export const mockChats: any[] = [];

// Seed pre-loaded destinations in the mock DB for instant planning
export const seedMockDestinations = () => {
  if (mockDestinations.length > 0) return;
  
  const sampleDestinations = [
    {
      _id: 'dest_tokyo_123',
      name: 'Tokyo',
      country: 'Japan',
      description: 'A futuristic city blended with ancient shrines, incredible food, and neon lights.',
      weatherSnapshot: { condition: 'Clear', temp: 18 },
      estimatedCost: 1500,
      bestTime: 'March to May (Cherry Blossom Season)',
      safetyScore: 4.9,
      reason: 'Perfect for photography, food lovers, and solo or family travel.',
      popularityScore: 98,
      visaInfo: 'Visa on arrival for most passports',
      avgBudget: 1500,
      coordinates: { lat: 35.6762, lng: 139.6503 },
      imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?q=80&w=600&auto=format&fit=crop',
      tags: ['Food', 'Nature', 'Culture', 'Nightlife', 'Shopping', 'History', 'Metro', 'Couple', 'Solo', 'Family'],
      vectorEmbeddings: [0.9, 0.1, 0.4, 0.8, 0.9, 0.5, 0.9, 0.8]
    },
    {
      _id: 'dest_paris_123',
      name: 'Paris',
      country: 'France',
      description: 'The city of light, romance, high fashion, world-class museums, and pastries.',
      weatherSnapshot: { condition: 'Cloudy', temp: 14 },
      estimatedCost: 1800,
      bestTime: 'June to August',
      safetyScore: 4.2,
      reason: 'Top destination for art museums, romantic strolls, and luxury experiences.',
      popularityScore: 96,
      visaInfo: 'Schengen Visa required for some countries',
      avgBudget: 1800,
      coordinates: { lat: 48.8566, lng: 2.3522 },
      imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=600&auto=format&fit=crop',
      tags: ['Culture', 'History', 'Museums', 'Food', 'Relaxation', 'Couple', 'Photography', 'Friends'],
      vectorEmbeddings: [0.7, 0.8, 0.1, 0.2, 0.9, 0.9, 0.3, 0.6]
    },
    {
      _id: 'dest_bali_123',
      name: 'Bali',
      country: 'Indonesia',
      description: 'A tropical paradise known for its forested volcanic mountains, beaches, and coral reefs.',
      weatherSnapshot: { condition: 'Rainy', temp: 28 },
      estimatedCost: 800,
      bestTime: 'April to October',
      safetyScore: 4.5,
      reason: 'Incredibly budget-friendly tropical getaway with beaches, temples, and surfing.',
      popularityScore: 95,
      visaInfo: 'Visa on arrival valid for 30 days',
      avgBudget: 800,
      coordinates: { lat: -8.4095, lng: 115.1889 },
      imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=600&auto=format&fit=crop',
      tags: ['Beaches', 'Nature', 'Adventure', 'Relaxation', 'Temple', 'Backpacking', 'Solo', 'Couple', 'Water Sports'],
      vectorEmbeddings: [0.1, 0.9, 0.8, 0.1, 0.3, 0.2, 0.8, 0.9]
    },
    {
      _id: 'dest_swiss_123',
      name: 'Swiss Alps (Zermatt)',
      country: 'Switzerland',
      description: 'Stunning alpine heights, ski resorts, hiking trails, and clear glacial lakes.',
      weatherSnapshot: { condition: 'Snowy', temp: -2 },
      estimatedCost: 2500,
      bestTime: 'December to February (Skiing) or July to August',
      safetyScore: 4.9,
      reason: 'Unmatched mountains, snow sports, premium train travel, and luxury chalets.',
      popularityScore: 92,
      visaInfo: 'Schengen Visa required for some countries',
      avgBudget: 2500,
      coordinates: { lat: 46.0207, lng: 7.7491 },
      imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600&auto=format&fit=crop',
      tags: ['Mountains', 'Snow', 'Trekking', 'Adventure', 'Nature', 'Luxury', 'Train', 'Family', 'Camping'],
      vectorEmbeddings: [0.2, 0.9, 0.9, 0.9, 0.1, 0.1, 0.6, 0.4]
    },
    {
      _id: 'dest_cairo_123',
      name: 'Cairo',
      country: 'Egypt',
      description: 'Home to the Pyramids of Giza, Sphinx, Nile cruises, and bustling historic bazaars.',
      weatherSnapshot: { condition: 'Sunny', temp: 32 },
      estimatedCost: 900,
      bestTime: 'October to April',
      safetyScore: 3.9,
      reason: 'Ideal for history enthusiasts, architectural explorers, and budget backpacking.',
      popularityScore: 89,
      visaInfo: 'Visa on arrival for many countries',
      avgBudget: 900,
      coordinates: { lat: 30.0444, lng: 31.2357 },
      imageUrl: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?q=80&w=600&auto=format&fit=crop',
      tags: ['History', 'Museums', 'Culture', 'Shopping', 'Adventure', 'Backpacking', 'Solo'],
      vectorEmbeddings: [0.8, 0.2, 0.2, 0.9, 0.3, 0.7, 0.1, 0.4]
    }
  ];

  mockDestinations.push(...sampleDestinations);
};

export const isDbConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};
