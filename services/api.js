import { Preferences } from '@capacitor/preferences';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const storage = {
  get: async (key) => {
    const { value } = await Preferences.get({ key });
    return value;
  },
  set: async (key, value) => {
    await Preferences.set({ key, value });
  },
  remove: async (key) => {
    await Preferences.remove({ key });
  },
  getRootUrl: async () => {
    const customUrl = await storage.get('custom_api_url');
    const base = customUrl || API_BASE_URL;
    // Strip /api/v1 (case insensitive) if present to get the server root
    return base.replace(/\/api\/v1\/?$/i, '');
  }
};

const apiRequest = async (endpoint, options = {}) => {
  const token = await storage.get('auth_token');
  const customUrl = await storage.get('custom_api_url');
  
  const baseUrl = customUrl || API_BASE_URL;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Clear token on auth failure
      await storage.remove('auth_token');
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

export const api = {
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
  post: (endpoint, body) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
  
  // Auth Helpers
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.auth_token) {
      await storage.set('auth_token', res.data.auth_token);
      if (res.data.refresh_token) {
        await storage.set('refresh_token', res.data.refresh_token);
      }
    }
    return res;
  },
  
  logout: async () => {
    await storage.remove('auth_token');
    await storage.remove('refresh_token');
  },
  
  // Image Helper
  getImageUrl: async (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const root = await storage.getRootUrl();
    // Ensure path starts with / if root doesn't end with it
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${root}${cleanPath}`;
  }
};
