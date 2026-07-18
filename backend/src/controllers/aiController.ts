import { Response } from 'express';
import { Chat } from '../models/Chat';
import { Trip } from '../models/Trip';
import { isDbConnected, mockChats, mockTrips } from '../utils/mockDb';
import { notifyTripUpdate } from '../config/socket';
import { generateGeneralText } from '../utils/llmClient';

export const getChats = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    let chatsList = [];
    if (isDbConnected()) {
      chatsList = await Chat.find({ userId }).sort({ createdAt: -1 });
    } else {
      chatsList = mockChats.filter(c => c.userId === userId);
    }
    return res.json({ success: true, chats: chatsList });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const handleChatMessage = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { message, chatId, activeTripId } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    let chat: any = null;
    if (chatId) {
      if (isDbConnected()) {
        chat = await Chat.findById(chatId);
      } else {
        chat = mockChats.find(c => c._id === chatId);
      }
    }

    if (!chat) {
      if (isDbConnected()) {
        chat = new Chat({ userId, messages: [] });
      } else {
        chat = {
          _id: 'chat_' + Date.now(),
          userId,
          messages: [],
          createdAt: new Date()
        };
        mockChats.push(chat);
      }
    }

    chat.messages.push({ role: 'user', content: message, timestamp: new Date() });

    let responseText = '';
    let updatedTrip: any = null;

    const lowerMessage = message.toLowerCase();

    // Check if we can get a dynamic Gemini response
    try {
      const activeTrip = activeTripId 
        ? (isDbConnected() ? await Trip.findById(activeTripId) : mockTrips.find((t: any) => t._id === activeTripId))
        : null;

      const systemPrompt = `You are the Compass.ai Travel Assistant. The user is asking: "${message}". 
      Current trip context: ${activeTrip ? `Destination: ${activeTrip.meta.destination}, Budget Limit: $${activeTrip.meta.budgetLimit}, Style: ${activeTrip.meta.travelStyle}` : 'No active trip selected'}.
      Provide a helpful, premium, concise response (2-3 sentences max) to assist the traveler. Keep the tone friendly, professional, and clean.`;

      responseText = await generateGeneralText(systemPrompt);
    } catch (err) {
      console.warn('Failed to fetch Gemini chat response, reverting to deterministic rules:', err);
    }

    // Execute state modifications if triggered, even if Gemini answered, to ensure the state machine matches!
    let forceDeterministic = false;

    if (activeTripId && (lowerMessage.includes('reduce my budget') || lowerMessage.includes('cut budget') || lowerMessage.includes('cheaper'))) {
      let trip: any = null;
      if (isDbConnected()) {
        trip = await Trip.findById(activeTripId);
      } else {
        trip = mockTrips.find((t: any) => t._id === activeTripId);
      }

      if (trip) {
        trip.meta.budgetLimit = Math.round(trip.meta.budgetLimit * 0.8);
        trip.itinerary.forEach((day: any) => {
          day.schedule.forEach((act: any) => {
            act.cost = Math.round(act.cost * 0.8);
          });
        });
        
        trip.meta.currentSpent = trip.expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);

        if (isDbConnected()) {
          await trip.save();
        }
        
        updatedTrip = trip;
        responseText = `📉 I've cut the budget limit of your trip "${trip.title}" by 20% to ${trip.meta.budgetLimit} USD, and optimized the itinerary activities to use more cost-effective options!`;
        notifyTripUpdate(activeTripId, 'trip-updated', trip);
        forceDeterministic = true;
      }
    } else if (activeTripId && (lowerMessage.includes('add adventure') || lowerMessage.includes('more excitement'))) {
      let trip: any = null;
      if (isDbConnected()) {
        trip = await Trip.findById(activeTripId);
      } else {
        trip = mockTrips.find((t: any) => t._id === activeTripId);
      }

      if (trip && trip.itinerary.length > 0) {
        const targetDay = trip.itinerary[0];
        targetDay.schedule.push({
          timeSlot: 'Evening',
          activityName: '🚁 Extreme Helicopter City Skyline Tour',
          coords: { 
            lat: trip.logistics.accommodation.coords.lat - 0.01, 
            lng: trip.logistics.accommodation.coords.lng + 0.01 
          },
          cost: 150,
          durationMinutes: 90,
          isIndoorFallback: false,
          category: 'Adventure',
          description: 'A thrilling high-altitude view of the destination.'
        });
        
        if (isDbConnected()) {
          await trip.save();
        }
        
        updatedTrip = trip;
        responseText = `🚁 I've appended an exciting high-altitude helicopter tour to your Day 1 schedule for "${trip.title}"!`;
        notifyTripUpdate(activeTripId, 'trip-updated', trip);
        forceDeterministic = true;
      }
    }

    // Default fallback text if Gemini was unavailable and no mutations triggered
    if (!responseText && !forceDeterministic) {
      if (lowerMessage.includes('hidden') || lowerMessage.includes('gems') || lowerMessage.includes('crowd')) {
        responseText = "💡 Here are some secret spots nearby that tourists usually miss: \n\n1. *Omoide Yokocho Alleyway* (East gate Tokyo) for traditional street yakitori.\n2. *Todoroki Valley* (Urban forest walk just 20 mins from central station).\n3. *Meguro Parasitological Museum* (highly unusual and interactive).";
      } else {
        responseText = `I'd love to help you plan! I can recommend local dining spots, decrease your budget, suggest hidden spots, or swap hotel locations. Try saying "Reduce my budget" or "Add adventure"!`;
      }
    }

    chat.messages.push({ role: 'assistant', content: responseText, timestamp: new Date() });

    if (isDbConnected()) {
      await chat.save();
    }

    return res.json({
      success: true,
      chatId: chat._id,
      messages: chat.messages,
      updatedTrip
    });
  } catch (error) {
    console.error('Handle chat message error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
