import { Response } from 'express';
import { Trip, ITrip, IActivity } from '../models/Trip';
import { Notification } from '../models/Notification';
import { performVectorSearch } from '../utils/vectorSearch';
import { generateStructuredContent, getFallbackItinerary, getFallbackPackingList } from '../utils/llmClient';
import { isDbConnected, mockTrips, mockNotifications } from '../utils/mockDb';
import { notifyTripUpdate } from '../config/socket';

const validateItinerarySchema = (data: any): boolean => {
  if (!data || typeof data !== 'object') return false;
  if (!data.title || !data.itinerary || !Array.isArray(data.itinerary)) return false;
  
  for (const day of data.itinerary) {
    if (typeof day.day !== 'number' || !Array.isArray(day.schedule)) return false;
    for (const act of day.schedule) {
      if (!act.timeSlot || !act.activityName || !act.coords || typeof act.coords.lat !== 'number' || typeof act.coords.lng !== 'number') {
        return false;
      }
    }
  }
  return true;
};

export const createTrip = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const {
      source,
      destination,
      startDate,
      endDate,
      budgetLimit,
      travelStyle,
      interests,
      adults = 1,
      children = 0,
      seniors = 0,
      diet = 'None',
      accessibility = [],
      specialRequirements = '',
      simulateMalformed = false
    } = req.body;

    if (!source || !startDate || !endDate || !budgetLimit) {
      return res.status(400).json({ success: false, message: 'Source, dates, and budget limit are required.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 1;

    let targetDestination = destination;
    let coordinates = { lat: 35.6762, lng: 139.6503 }; // Default Tokyo
    let destinationData: any = null;

    // Vector search matching if no destination provided
    if (!targetDestination) {
      const tags = [...(travelStyle ? [travelStyle] : []), ...(interests || [])];
      const matches = await performVectorSearch(tags, budgetLimit, 1);
      if (matches.length > 0) {
        destinationData = matches[0];
        targetDestination = destinationData.name;
        coordinates = destinationData.coordinates;
      } else {
        targetDestination = 'Tokyo';
        coordinates = { lat: 35.6762, lng: 139.6503 };
      }
    } else {
      // Find coordinates of target destination from vectors
      const matches = await performVectorSearch([targetDestination], 0, 1);
      if (matches.length > 0) {
        destinationData = matches[0];
        coordinates = destinationData.coordinates;
      }
    }

    const budgetTier = budgetLimit > 3000 ? 'Luxury' : budgetLimit > 1200 ? 'Standard' : 'Budget';

    const prompt = `Generate a travel itinerary for a trip from ${source} to ${targetDestination}.
Duration: ${durationDays} days.
Travel Style: ${travelStyle}.
Budget Tier: ${budgetTier} (Max budget: ${budgetLimit} USD).
Travelers: ${adults} Adults, ${children} Children, ${seniors} Seniors.
Dietary Preference: ${diet}.
Accessibility constraints: ${accessibility.join(', ')}.
Special wishes: ${specialRequirements}.
Respond in strict JSON with schema:
{
  "title": "Trip Title",
  "itinerary": [
    {
      "day": 1,
      "date": "2026-07-19",
      "weatherSnapshot": { "condition": "Clear", "temp": 24 },
      "schedule": [
        {
          "timeSlot": "Morning",
          "activityName": "Activity Name",
          "coords": { "lat": ${coordinates.lat}, "lng": ${coordinates.lng} },
          "cost": 100,
          "durationMinutes": 120,
          "isIndoorFallback": false,
          "category": "Sightseeing",
          "description": "Short explanation"
        }
      ]
    }
  ]
}`;

    const fallbackGenerator = () => {
      return {
        title: `Adventure in ${targetDestination}`,
        itinerary: getFallbackItinerary(targetDestination, durationDays, travelStyle || 'Exploration', budgetTier, coordinates)
      };
    };

    // LLM structured parser
    const { data: generatedItinerary, logs } = await generateStructuredContent(
      prompt,
      validateItinerarySchema,
      fallbackGenerator,
      simulateMalformed
    );

    const packingItems = getFallbackPackingList(travelStyle || 'Exploration', durationDays);

    let trip: any = null;

    if (isDbConnected()) {
      trip = new Trip({
        userId,
        title: generatedItinerary.title || `Trip to ${targetDestination}`,
        meta: {
          source,
          destination: targetDestination,
          startDate: start,
          endDate: end,
          budgetLimit,
          currentSpent: 0
        },
        logistics: {
          currencyCode: budgetTier === 'Luxury' ? 'USD' : 'INR',
          accommodation: {
            name: `${budgetTier} Plaza Hotel ${targetDestination}`,
            coords: {
              lat: coordinates.lat + 0.005,
              lng: coordinates.lng + 0.005
            },
            tier: budgetTier
          }
        },
        itinerary: generatedItinerary.itinerary,
        packingList: packingItems.map((item, idx) => ({ ...item, id: `pack_${idx}_${Date.now()}` })),
        expenses: []
      });
      await trip.save();
    } else {
      trip = {
        _id: 'mock_trip_' + Date.now(),
        userId,
        title: generatedItinerary.title || `Trip to ${targetDestination}`,
        meta: {
          source,
          destination: targetDestination,
          startDate: start,
          endDate: end,
          budgetLimit,
          currentSpent: 0
        },
        logistics: {
          currencyCode: budgetTier === 'Luxury' ? 'USD' : 'INR',
          accommodation: {
            name: `${budgetTier} Plaza Hotel ${targetDestination}`,
            coords: {
              lat: coordinates.lat + 0.005,
              lng: coordinates.lng + 0.005
            },
            tier: budgetTier
          }
        },
        itinerary: generatedItinerary.itinerary.map((day: any, dIdx: number) => ({
          ...day,
          _id: `day_${dIdx}_${Date.now()}`,
          schedule: day.schedule.map((act: any, aIdx: number) => ({
            ...act,
            _id: `act_${dIdx}_${aIdx}_${Date.now()}`
          }))
        })),
        packingList: packingItems.map((item, idx) => ({ ...item, id: `pack_${idx}_${Date.now()}` })),
        expenses: [],
        createdAt: new Date()
      };
      mockTrips.push(trip);
    }

    return res.status(201).json({
      success: true,
      message: 'Trip plan generated successfully.',
      trip,
      llmLogs: logs
    });
  } catch (error: any) {
    console.error('Create trip error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create trip plan. ' + error.message });
  }
};

export const getTrips = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    let tripsList = [];

    if (isDbConnected()) {
      tripsList = await Trip.find({ userId });
    } else {
      tripsList = mockTrips.filter(t => t.userId === userId);
    }

    return res.json({ success: true, trips: tripsList });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getTripById = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    let trip: any = null;

    if (isDbConnected()) {
      trip = await Trip.findById(id);
    } else {
      trip = mockTrips.find(t => t._id === id);
    }

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    return res.json({ success: true, trip });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateTripItinerary = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { itinerary } = req.body;

    let trip: any = null;
    if (isDbConnected()) {
      trip = await Trip.findById(id);
    } else {
      trip = mockTrips.find(t => t._id === id);
    }

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    trip.itinerary = itinerary;
    if (isDbConnected()) {
      await trip.save();
    }

    notifyTripUpdate(id, 'trip-updated', trip);

    return res.json({ success: true, message: 'Itinerary updated.', trip });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateTripAccommodation = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { accommodation } = req.body;

    if (!accommodation || !accommodation.name || !accommodation.coords) {
      return res.status(400).json({ success: false, message: 'Accommodation name and coordinates are required.' });
    }

    let trip: any = null;
    if (isDbConnected()) {
      trip = await Trip.findById(id);
    } else {
      trip = mockTrips.find((t: any) => t._id === id);
    }

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    trip.logistics.accommodation = {
      name: accommodation.name,
      coords: accommodation.coords,
      tier: accommodation.tier || 'Standard',
      price: accommodation.price || 120
    };

    if (isDbConnected()) {
      await trip.save();
    }

    notifyTripUpdate(id, 'trip-updated', trip);

    return res.json({ success: true, message: 'Accommodation swapped.', trip });
  } catch (error: any) {
    console.error('Swap accommodation controller error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteTrip = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      await Trip.findByIdAndDelete(id);
    } else {
      const idx = mockTrips.findIndex(t => t._id === id);
      if (idx !== -1) mockTrips.splice(idx, 1);
    }

    return res.json({ success: true, message: 'Trip deleted successfully.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Expenses CRUD + Auto balance updates
export const addExpense = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, category, description, date } = req.body;

    let trip: any = null;
    if (isDbConnected()) {
      trip = await Trip.findById(id);
    } else {
      trip = mockTrips.find(t => t._id === id);
    }

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    const newExpense = {
      id: 'exp_' + Date.now(),
      amount: parseFloat(amount),
      category,
      description,
      date: new Date(date || Date.now())
    };

    trip.expenses.push(newExpense);
    
    // Recalculate spent
    const totalSpent = trip.expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
    trip.meta.currentSpent = totalSpent;

    if (isDbConnected()) {
      await trip.save();
    }

    // Trigger reactive Socket notification if spent exceeds limit
    if (totalSpent > trip.meta.budgetLimit) {
      const title = 'Budget Limit Exceeded!';
      const msg = `Your trip "${trip.title}" has spent ${totalSpent} USD, which exceeds your set limit of ${trip.meta.budgetLimit} USD.`;
      
      if (isDbConnected()) {
        const notif = new Notification({ userId: trip.userId, type: 'budget', title, message: msg });
        await notif.save();
      } else {
        mockNotifications.push({ _id: 'notif_' + Date.now(), userId: trip.userId, type: 'budget', title, message: msg, isRead: false, createdAt: new Date() });
      }

      notifyTripUpdate(id, 'budget-alert', { totalSpent, limit: trip.meta.budgetLimit, message: msg });
    }

    notifyTripUpdate(id, 'trip-updated', trip);

    return res.json({ success: true, trip });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

export const deleteExpense = async (req: any, res: Response) => {
  try {
    const { id, expenseId } = req.params;

    let trip: any = null;
    if (isDbConnected()) {
      trip = await Trip.findById(id);
    } else {
      trip = mockTrips.find(t => t._id === id);
    }

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    trip.expenses = trip.expenses.filter((exp: any) => exp.id !== expenseId);
    trip.meta.currentSpent = trip.expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);

    if (isDbConnected()) {
      await trip.save();
    }

    notifyTripUpdate(id, 'trip-updated', trip);

    return res.json({ success: true, trip });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Packing List CRUD
export const addPackingItem = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { item, category } = req.body;

    let trip: any = null;
    if (isDbConnected()) {
      trip = await Trip.findById(id);
    } else {
      trip = mockTrips.find(t => t._id === id);
    }

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    const newItem = {
      id: 'pack_' + Date.now(),
      item,
      category,
      packed: false,
      autoGenerated: false
    };

    trip.packingList.push(newItem);

    if (isDbConnected()) {
      await trip.save();
    }

    notifyTripUpdate(id, 'trip-updated', trip);

    return res.json({ success: true, trip });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const togglePackingItem = async (req: any, res: Response) => {
  try {
    const { id, itemId } = req.params;

    let trip: any = null;
    if (isDbConnected()) {
      trip = await Trip.findById(id);
    } else {
      trip = mockTrips.find(t => t._id === id);
    }

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    const item = trip.packingList.find((p: any) => p.id === itemId);
    if (item) {
      item.packed = !item.packed;
    }

    if (isDbConnected()) {
      await trip.save();
    }

    notifyTripUpdate(id, 'trip-updated', trip);

    return res.json({ success: true, trip });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deletePackingItem = async (req: any, res: Response) => {
  try {
    const { id, itemId } = req.params;

    let trip: any = null;
    if (isDbConnected()) {
      trip = await Trip.findById(id);
    } else {
      trip = mockTrips.find(t => t._id === id);
    }

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    trip.packingList = trip.packingList.filter((p: any) => p.id !== itemId);

    if (isDbConnected()) {
      await trip.save();
    }

    notifyTripUpdate(id, 'trip-updated', trip);

    return res.json({ success: true, trip });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// SELF-HEALING / WEATHER ALERT TRIGGER
// Swaps outdoor spots with indoor alternatives, pushes umbrella checklist, generates notifications
export const simulateWeatherAlert = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    let trip: any = null;

    if (isDbConnected()) {
      trip = await Trip.findById(id);
    } else {
      trip = mockTrips.find(t => t._id === id);
    }

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    console.log(`🌧️  [WEATHER ALERT SIMULATION] Triggering rain disruption alert for: ${trip.title}`);

    // 1. Mutate weather snapshot of Day 1 to rainy
    if (trip.itinerary && trip.itinerary.length > 0) {
      const targetDay = trip.itinerary[0];
      targetDay.weatherSnapshot = {
        condition: 'Rainy',
        temp: 16
      };

      // 2. Perform atomic modifications on activities: swap outdoor sightseeing/adventures to indoor fallbacks
      targetDay.schedule.forEach((activity: any) => {
        if (!activity.isIndoorFallback && (activity.category === 'Sightseeing' || activity.category === 'Adventure')) {
          console.log(`   🔁 Swapping outdoor activity "${activity.activityName}" to indoor museum fallback.`);
          activity.activityName = `🏛️ Indoor Culture & Museum Pass: ${activity.activityName.replace(/Exploration|Tour|Viewpoint/gi, '')}`;
          activity.isIndoorFallback = true;
          // shift coords slightly to simulate the museum location
          activity.coords.lat = activity.coords.lat + 0.002;
          activity.coords.lng = activity.coords.lng - 0.002;
          activity.description = '🌦️ Outdoor weather advisory active. Automatically re-routed to this premium indoor museum fallback option.';
          // add cost correction (e.g. entry ticket)
          activity.cost = activity.cost + 15;
        }
      });
    }

    // 3. Atomically update packing list: Add "Umbrella" or "Raincoat" if missing
    const hasUmbrella = trip.packingList.some((p: any) => p.item.toLowerCase().includes('umbrella') || p.item.toLowerCase().includes('raincoat'));
    if (!hasUmbrella) {
      trip.packingList.push({
        id: 'pack_rain_' + Date.now(),
        item: 'Umbrella (Rain advisory active)',
        category: 'Essentials',
        packed: false,
        autoGenerated: true
      });
      console.log('   🎒 Appended "Umbrella" to packing list.');
    }

    // 4. Create in-app system notification
    const notifTitle = 'Heavy Rain Alert & Re-routing';
    const notifMsg = `We detected high precipitation forecasts for your trip "${trip.title}". Outdoor events were re-routed to nearby indoor cultural fallbacks, and rain essentials were added to your checklist.`;
    
    if (isDbConnected()) {
      const notif = new Notification({
        userId: trip.userId,
        type: 'weather',
        title: notifTitle,
        message: notifMsg
      });
      await notif.save();
    } else {
      mockNotifications.push({
        _id: 'notif_' + Date.now(),
        userId: trip.userId,
        type: 'weather',
        title: notifTitle,
        message: notifMsg,
        isRead: false,
        createdAt: new Date()
      });
    }

    if (isDbConnected()) {
      await trip.save();
    }

    // 5. Broadcast live update over Socket.io
    notifyTripUpdate(id, 'weather-disruption', {
      tripId: id,
      message: notifMsg,
      updatedTrip: trip
    });

    notifyTripUpdate(id, 'trip-updated', trip);

    return res.json({
      success: true,
      message: 'Weather alert simulated, activities re-routed, packing list updated.',
      trip
    });
  } catch (error: any) {
    console.error('Weather alert simulation error:', error);
    return res.status(500).json({ success: false, message: 'Server error during simulation.' });
  }
};
