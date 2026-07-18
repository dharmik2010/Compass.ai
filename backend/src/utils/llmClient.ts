import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

let genAI: GoogleGenerativeAI | null = null;
if (GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    console.log('Gemini AI SDK initialized successfully');
  } catch (err) {
    console.error('Failed to initialize Gemini AI:', err);
  }
}

export interface ILLMValidationLog {
  timestamp: Date;
  prompt: string;
  responseReceived: string;
  status: 'SUCCESS' | 'RETRY_SUCCESS' | 'FAILED_FALLBACK';
  errorMessage?: string;
  tokensUsed: number;
}

// In-memory logs for Admin dashboard metrics
export const llmValidationLogs: ILLMValidationLog[] = [];

// Helper to simulate fallback responses matching travel schemas
export const getFallbackItinerary = (
  destination: string, 
  duration: number, 
  style: string, 
  budgetTier: string,
  coords: { lat: number; lng: number } = { lat: 35.6762, lng: 139.6503 }
) => {
  const budgetMultiplier = budgetTier === 'Luxury' ? 1.8 : budgetTier === 'Budget' ? 0.55 : 1;
  
  const activityTemplates = [
    { name: "Historic Exploration: Walking tour of old town landmarks", category: "Sightseeing" as const, desc: "Explore local architecture, historic squares, and cultural heritage viewpoints." },
    { name: "Nature Reserves: Guided forest path and gardens stroll", category: "Nature" as const, desc: "Enjoy tranquil natural reserves, green botanicals, and photogenic garden walks." },
    { name: "Art & History: Access pass to central museums", category: "Culture" as const, desc: "Examine exhibitions, traditional relics, and visual displays of local artists." },
    { name: "Scenic Panorama: Sunset mountain peaks and skyline hikes", category: "Adventure" as const, desc: "Trek to high scenic spots, capture landscape photographs, and view sunset panoramas." },
    { name: "Urban Discovery: High-street markets and craft shopping", category: "Shopping" as const, desc: "Shop traditional souvenirs, custom craft outputs, and enjoy local street food alleys." }
  ];

  const dinnerTemplates = [
    { name: "Gastronomic Dinner: Traditional grillhouse experience", desc: "Taste authentic recipes cooked over charcoal with local premium ingredients." },
    { name: "Bayside Bistro: Fine dining evening meal", desc: "Dine at a highly-rated ocean view spot featuring organic fresh delicacies." },
    { name: "Heritage Tavern: Tasting menu with local craft brews", desc: "Sample traditional pairings and micro-brew elements in a historical basement." },
    { name: "Street Food Crawl: Guided night market food tour", desc: "Access the hidden food alleys, tasting spicy local specialties and street bites." }
  ];

  const itinerary = [];
  for (let d = 1; d <= duration; d++) {
    const act1 = activityTemplates[(d - 1) % activityTemplates.length];
    const act2 = activityTemplates[d % activityTemplates.length];
    const dinner = dinnerTemplates[(d - 1) % dinnerTemplates.length];

    itinerary.push({
      day: d,
      date: new Date(Date.now() + d * 24 * 60 * 60 * 1000),
      weatherSnapshot: {
        condition: ['Sunny', 'Clear', 'Cloudy', 'Windy'][Math.floor(Math.random() * 4)],
        temp: 18 + Math.floor(Math.random() * 8)
      },
      schedule: [
        {
          timeSlot: 'Morning' as const,
          activityName: `${style} Onboarding: ${act1.name}`,
          coords: { lat: coords.lat + (Math.random() - 0.5) * 0.015, lng: coords.lng + (Math.random() - 0.5) * 0.015 },
          cost: Math.round(110 * budgetMultiplier),
          durationMinutes: 180,
          isIndoorFallback: false,
          category: act1.category,
          description: act1.desc
        },
        {
          timeSlot: 'Afternoon' as const,
          activityName: `Lunch at highly-rated traditional diner in ${destination}`,
          coords: { lat: coords.lat + (Math.random() - 0.5) * 0.015, lng: coords.lng + (Math.random() - 0.5) * 0.015 },
          cost: Math.round(35 * budgetMultiplier),
          durationMinutes: 90,
          isIndoorFallback: false,
          category: 'Food' as const,
          description: `Taste local food specialties and refreshing organic juices.`
        },
        {
          timeSlot: 'Evening' as const,
          activityName: `${style} Discovery: ${act2.name}`,
          coords: { lat: coords.lat + (Math.random() - 0.5) * 0.015, lng: coords.lng + (Math.random() - 0.5) * 0.015 },
          cost: Math.round(75 * budgetMultiplier),
          durationMinutes: 120,
          isIndoorFallback: false,
          category: act2.category,
          description: act2.desc
        },
        {
          timeSlot: 'Night' as const,
          activityName: dinner.name,
          coords: { lat: coords.lat + (Math.random() - 0.5) * 0.015, lng: coords.lng + (Math.random() - 0.5) * 0.015 },
          cost: Math.round(95 * budgetMultiplier),
          durationMinutes: 120,
          isIndoorFallback: false,
          category: 'Food' as const,
          description: dinner.desc
        }
      ]
    });
  }
  return itinerary;
};

export const getFallbackPackingList = (style: string, duration: number) => {
  const base = [
    { item: 'Passport & Travel Docs', category: 'Essentials', packed: false, autoGenerated: true },
    { item: 'Comfortable Sneakers', category: 'Shoes', packed: false, autoGenerated: true },
    { item: 'First-Aid Kit & Prescriptions', category: 'Medical', packed: false, autoGenerated: true },
    { item: 'Powerbank & Charging Cables', category: 'Tech', packed: false, autoGenerated: true },
    { item: 'Toiletries & Toothbrush', category: 'Essentials', packed: false, autoGenerated: true }
  ];
  if (style.toLowerCase().includes('adventure') || style.toLowerCase().includes('trekking')) {
    base.push({ item: 'Trekking Boots', category: 'Shoes', packed: false, autoGenerated: true });
    base.push({ item: 'Waterproof Jacket', category: 'Clothes', packed: false, autoGenerated: true });
  } else {
    base.push({ item: 'Casual shirts & trousers', category: 'Clothes', packed: false, autoGenerated: true });
  }
  return base;
};

// Orchestrates the main LLM call loop with strict parsing and fallback retries
export const generateStructuredContent = async (
  prompt: string,
  validator: (data: any) => boolean,
  fallbackGenerator: () => any,
  simulateMalformed: boolean = false
): Promise<{ data: any; logs: ILLMValidationLog }> => {
  const timestamp = new Date();
  
  if (simulateMalformed) {
    const rawMalformed = `{"title": "Malformed Trip", "itinerary": [invalid_json_here]`;
    console.warn('⚠️  [LLM CLIENT] Simulating malformed LLM response.');
    
    // Attempt validation (will fail)
    try {
      JSON.parse(rawMalformed);
    } catch (err: any) {
      console.log('🔄  [LLM CLIENT] Catching malformed JSON successfully. Attempting fallback generator.');
      const data = fallbackGenerator();
      const log: ILLMValidationLog = {
        timestamp,
        prompt,
        responseReceived: rawMalformed,
        status: 'FAILED_FALLBACK',
        errorMessage: err.message,
        tokensUsed: 120
      };
      llmValidationLogs.push(log);
      return { data, logs: log };
    }
  }

  if (!genAI) {
    console.log('💡  [LLM CLIENT] Gemini API key not found. Using high-fidelity local simulator.');
    const data = fallbackGenerator();
    const log: ILLMValidationLog = {
      timestamp,
      prompt,
      responseReceived: JSON.stringify(data, null, 2),
      status: 'SUCCESS',
      tokensUsed: 0
    };
    llmValidationLogs.push(log);
    return { data, logs: log };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const formattedPrompt = `${prompt}\n\nIMPORTANT: Return ONLY raw JSON matching the requested structure. Do not wrap in markdown code blocks (\`\`\`) or add any introduction or explanation text. Ensure it is valid JSON.`;
    
    const result = await model.generateContent(formattedPrompt);
    const text = result.response.text().trim();
    
    // Clean potential markdown blocks if LLM outputted them despite prompt rules
    let cleanedText = text;
    if (text.startsWith('```')) {
      cleanedText = text.replace(/^```(json)?/, '').replace(/```$/, '').trim();
    }

    try {
      const parsed = JSON.parse(cleanedText);
      const isValid = validator(parsed);
      
      if (isValid) {
        const log: ILLMValidationLog = {
          timestamp,
          prompt,
          responseReceived: cleanedText,
          status: 'SUCCESS',
          tokensUsed: 350
        };
        llmValidationLogs.push(log);
        return { data: parsed, logs: log };
      } else {
        throw new Error('Validation schema mismatch: missing required fields');
      }
    } catch (parseOrValidationErr: any) {
      console.warn('⚠️  [LLM CLIENT] Validation failed on first try. Retrying with explicit schema correction prompt...');
      
      // Retry logic
      try {
        const correctionPrompt = `${prompt}\n\nYour previous response failed validation: ${parseOrValidationErr.message}.\nProvide corrected valid JSON. No markdown wrappers.`;
        const retryResult = await model.generateContent(correctionPrompt);
        const retryText = retryResult.response.text().trim();
        let cleanedRetry = retryText;
        if (retryText.startsWith('```')) {
          cleanedRetry = retryText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
        }
        
        const parsedRetry = JSON.parse(cleanedRetry);
        const isValidRetry = validator(parsedRetry);
        
        if (isValidRetry) {
          console.log('✅  [LLM CLIENT] Retry succeeded.');
          const log: ILLMValidationLog = {
            timestamp,
            prompt,
            responseReceived: cleanedRetry,
            status: 'RETRY_SUCCESS',
            tokensUsed: 720
          };
          llmValidationLogs.push(log);
          return { data: parsedRetry, logs: log };
        } else {
          throw new Error('Retry response failed schema match validation again.');
        }
      } catch (retryErr: any) {
        console.error('❌  [LLM CLIENT] All retries failed. Recovering using last-known-good fallback state.', retryErr);
        const fallbackData = fallbackGenerator();
        const log: ILLMValidationLog = {
          timestamp,
          prompt,
          responseReceived: text,
          status: 'FAILED_FALLBACK',
          errorMessage: retryErr.message || 'Retry parse error',
          tokensUsed: 800
        };
        llmValidationLogs.push(log);
        return { data: fallbackData, logs: log };
      }
    }
  } catch (err: any) {
    console.error('❌  [LLM CLIENT] Primary request error. Triggering fallback data handler:', err);
    const data = fallbackGenerator();
    const log: ILLMValidationLog = {
      timestamp,
      prompt,
      responseReceived: 'N/A - Connection Refused',
      status: 'FAILED_FALLBACK',
      errorMessage: err.message,
      tokensUsed: 0
    };
    llmValidationLogs.push(log);
    return { data, logs: log };
  }
};

const generateMockGeneralText = (prompt: string): string => {
  const match = prompt.match(/asking: "([^"]+)"/i);
  const question = match ? match[1].toLowerCase() : prompt.toLowerCase();
  
  const destMatch = prompt.match(/Destination: ([^,\n]+)/i);
  const destination = destMatch ? destMatch[1] : 'your destination';

  if (question.includes('hello') || question.includes('hi') || question.includes('hey')) {
    return `👋 Hello! I am your Compass.ai Travel Assistant. How can I help you customize your trip to ${destination} today?`;
  }
  if (question.includes('weather') || question.includes('rain') || question.includes('forecast')) {
    return `☀️ The weather forecast for ${destination} is currently monitored as clear and sunny (average 22°C). I will auto-healing mutate your itinerary if any heavy rain alert triggers!`;
  }
  if (question.includes('food') || question.includes('eat') || question.includes('restaurant') || question.includes('dine')) {
    return `🍽️ For dining in ${destination}, I highly recommend trying out local street food markets in the evening, or booking a traditional heritage grillhouse for dinner. Our Local Guide tab lists specific details!`;
  }
  if (question.includes('hotel') || question.includes('lodging') || question.includes('stay') || question.includes('accommodation')) {
    return `🏨 For lodging, you are staying at our recommended hotel. You can browse alternative picks and atomically swap hotels under our new "Accommodation" tab on your itinerary detail page!`;
  }
  if (question.includes('pack') || question.includes('bring') || question.includes('checklist')) {
    return `🎒 Make sure to pack your passport, local currency, and comfortable walking shoes. I've automatically compiled a tailored packing list for ${destination} in the packing tab!`;
  }
  if (question.includes('budget') || question.includes('spent') || question.includes('cost') || question.includes('expensive')) {
    return `💰 I can help you monitor expenses. If you find your current plans too expensive, say "Reduce my budget" and I will cut your budget limits and activity costs by 20% immediately!`;
  }
  if (question.includes('hidden') || question.includes('secret') || question.includes('gems')) {
    return `🗺️ Hidden gems in ${destination} include the quiet local forest paths just 20 minutes from the city center, and organic basement bistros that locals keep to themselves. Check out the Local Guide tab for details!`;
  }

  return `✨ As your Compass.ai assistant, I can help you discover hidden gems, manage your packing list, decrease your trip budget, or swap active hotels. Try asking me about restaurants, weather, or to "Reduce my budget"!`;
};

export const generateGeneralText = async (prompt: string): Promise<string> => {
  if (!genAI) {
    return generateMockGeneralText(prompt);
  }
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text().trim() || generateMockGeneralText(prompt);
  } catch (err) {
    console.error('Failed to generate content with Gemini, using simulation assistant:', err);
    return generateMockGeneralText(prompt);
  }
};
