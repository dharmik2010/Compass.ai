import { Request, Response } from 'express';

export const getLocalGuide = (req: Request, res: Response) => {
  const { destination } = req.query;
  const destName = (destination as string) || 'Tokyo';

  const guides: { [key: string]: any } = {
    tokyo: {
      culture: 'Bow slightly when greeting. Avoid talking loudly on trains. Do not tip at restaurants.',
      phrases: [
        { foreign: 'Konnichiwa', english: 'Hello' },
        { foreign: 'Arigatou gozaimasu', english: 'Thank you very much' },
        { foreign: 'Sumimasen', english: 'Excuse me / Sorry' },
        { foreign: 'Kore wa ikura desu ka?', english: 'How much is this?' }
      ],
      emergencies: {
        police: '110',
        fire_ambulance: '119',
        embassy: 'US Embassy Tokyo: +81 3-3224-5000',
        hospital: 'St. Luke’s International Hospital, Chuo City'
      },
      scamAlerts: 'Beware of bar-scouts in Roppongi and Kabukicho offering cheap entry but charging exorbitant table fees later.',
      dressCode: 'Smart casual. Remove shoes before entering traditional tea houses and temples.'
    },
    paris: {
      culture: 'Greet shopkeepers with "Bonjour". Keep voices moderate in bistros.',
      phrases: [
        { foreign: 'Bonjour', english: 'Hello' },
        { foreign: 'Merci beaucoup', english: 'Thank you very much' },
        { foreign: 'S\'il vous plaît', english: 'Please' },
        { foreign: 'Où sont les toilettes?', english: 'Where are the restrooms?' }
      ],
      emergencies: {
        police: '17 (or 112 European emergency)',
        fire_ambulance: '18 / 15',
        embassy: 'US Embassy Paris: +33 1 43 12 22 22',
        hospital: 'Hôpital Saint-Louis, 10th Arr.'
      },
      scamAlerts: 'Watch out for pickpockets near the Eiffel Tower, the "gold ring" trick, and petition signatures scam.',
      dressCode: 'Casual chic. Dress up slightly for high-end dining.'
    },
    bali: {
      culture: 'Use your right hand for giving/receiving. Dress modestly when visiting temples (cover shoulders/knees).',
      phrases: [
        { foreign: 'Suksma', english: 'Thank you (Balinese)' },
        { foreign: 'Selamat pagi', english: 'Good morning' },
        { foreign: 'Berapa harganya?', english: 'How much is this?' },
        { foreign: 'Bisa kurang?', english: 'Can you lower the price?' }
      ],
      emergencies: {
        police: '110',
        fire_ambulance: '113 / 118',
        embassy: 'Consulate General Bali: +62 361 233 605',
        hospital: 'BIMC Hospital Nusa Dua'
      },
      scamAlerts: 'Avoid unofficial money changers offering rates that look too good to be true (they skim bills).',
      dressCode: 'Sarongs are required at temples. Casual beach wear is fine in resorts.'
    }
  };

  const matched = guides[destName.toLowerCase()] || {
    culture: 'Observe local traditions, dress modestly in sacred spots, and keep valuable documents locked safely.',
    phrases: [
      { foreign: 'Hello', english: 'Hello' },
      { foreign: 'Thank you', english: 'Thank you' },
      { foreign: 'Excuse me', english: 'Excuse me' }
    ],
    emergencies: {
      police: '112 / 911',
      fire_ambulance: '112 / 911',
      embassy: 'Local embassy lookup recommended',
      hospital: 'Nearest general district hospital'
    },
    scamAlerts: 'Verify taxi meters before starting rides and buy transit tickets from official station kiosks.',
    dressCode: 'Smart casual, comfortable walking shoes.'
  };

  return res.json({ success: true, destination: destName, guide: matched });
};

export const getHotels = (req: Request, res: Response) => {
  const { destination, tier = 'Standard' } = req.query;
  const destName = (destination as string) || 'Tokyo';

  const mockHotels = [
    {
      name: `${tier} Resort & Spa ${destName}`,
      rating: 4.7,
      price: tier === 'Luxury' ? 320 : tier === 'Standard' ? 140 : 60,
      amenities: ['Free WiFi', 'Swimming Pool', 'Fitness Center', 'Spa'],
      distance: '1.2 km from center',
      imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop'
    },
    {
      name: `Grand Central ${tier} Hotel`,
      rating: 4.5,
      price: tier === 'Luxury' ? 280 : tier === 'Standard' ? 110 : 50,
      amenities: ['Free WiFi', 'Breakfast Included', 'Rooftop Bar'],
      distance: '0.4 km from center',
      imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=600&auto=format&fit=crop'
    }
  ];

  return res.json({ success: true, hotels: mockHotels });
};

export const getRestaurants = (req: Request, res: Response) => {
  const { destination, diet = 'None' } = req.query;
  const destName = (destination as string) || 'Tokyo';

  const mockRestaurants = [
    {
      name: `Traditional Delicacies ${destName}`,
      cuisine: 'Local Traditional',
      rating: 4.6,
      distance: '0.8 km from hotel',
      priceLevel: '$$',
      isVeg: true,
      isNonVeg: true,
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600&auto=format&fit=crop'
    },
    {
      name: `Green Garden Cafe`,
      cuisine: 'Healthy / Organic / Vegan',
      rating: 4.8,
      distance: '1.5 km from hotel',
      priceLevel: '$',
      isVeg: true,
      isNonVeg: false,
      imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600&auto=format&fit=crop'
    }
  ];

  const filtered = mockRestaurants.filter(r => {
    if (diet === 'Veg' || diet === 'Vegan') return r.isVeg;
    return true;
  });

  return res.json({ success: true, restaurants: filtered });
};

export const getTransitRecommendations = (req: Request, res: Response) => {
  const transit = [
    { mode: 'Flight', duration: '2h 15m', cost: 120, availability: 'Frequent daily flights' },
    { mode: 'Train (High Speed)', duration: '4h 30m', cost: 75, availability: 'Every 30 minutes' },
    { mode: 'Bus (Express)', duration: '8h 00m', cost: 35, availability: 'Twice daily' },
    { mode: 'Car Rental', duration: '5h 15m', cost: 90, availability: 'Available' }
  ];

  return res.json({ success: true, options: transit });
};
