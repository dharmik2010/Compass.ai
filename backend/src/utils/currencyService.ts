const EXCHANGE_RATES: { [key: string]: number } = {
  USD: 1.0,
  EUR: 0.92,
  INR: 83.5,
  JPY: 155.0,
  GBP: 0.79,
  AUD: 1.51,
  CAD: 1.36
};

export const getExchangeRate = async (from: string, to: string): Promise<number> => {
  const rateFrom = EXCHANGE_RATES[from.toUpperCase()] || 1.0;
  const rateTo = EXCHANGE_RATES[to.toUpperCase()] || 1.0;
  return rateTo / rateFrom;
};
