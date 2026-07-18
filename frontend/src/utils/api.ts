const getAuthToken = () => localStorage.getItem('token');

export const apiFetch = async (url: string, options: any = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  let data: any = {};
  const contentType = response.headers.get('content-type');
  
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (err) {
      console.error('JSON parsing failed:', err);
      data = { message: 'Malformed JSON payload received from server.' };
    }
  } else {
    try {
      const text = await response.text();
      data = { message: text || `HTTP ${response.status}: ${response.statusText}` };
    } catch (err) {
      data = { message: `Request failed with status ${response.status}` };
    }
  }

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }
  return data;
};
