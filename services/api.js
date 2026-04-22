import { Preferences } from '@capacitor/preferences';
import { useAuthStore } from '@/store/useAuthStore';

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
    return base.replace(/\/api\/v1\/?$/i, '');
  }
};

const apiRequest = async (endpoint, options = {}) => {
  // Pull token from Store first (reactive), then storage (backup)
  const storeToken = useAuthStore.getState().token;
  const token = storeToken || await storage.get('auth_token');
  
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
      // TRIGGER GLOBAL LOGOUT via state
      useAuthStore.getState().logout();
      window.location.href = '/login'; // Force clear UI
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
  
  auth: {
    login: async (email, password) => {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.user && res.data?.auth_token) {
        // Updated to set store user immediately
        useAuthStore.getState().login(res.data.auth_token, res.data.user);
      }
      return res;
    },
    me: () => api.get('/auth/me'),
    logout: async () => {
      await useAuthStore.getState().logout();
    }
  },

  reports: {
    getDashboardSummary: () => api.get('/reports/dashboard/summary')
  },

  products: {
    getActiveList: () => api.get('/products?size=2000'),
    getByBarcode: (barcode) => api.get(`/products/barcode/${barcode}`)
  },

  categories: {
    getActiveList: () => api.get('/main-categories/active/list')
  },

  customers: {
    getActiveList: () => api.get('/customers/active/list')
  },
  
  getImageUrl: async (imageField) => {
    if (!imageField) return null;
    
    let path = null;
    try {
      const parsed = typeof imageField === 'string' && imageField.startsWith('[') 
        ? JSON.parse(imageField) 
        : imageField;
      if (Array.isArray(parsed) && parsed.length > 0) {
        path = parsed[0];
      } else {
        path = imageField;
      }
    } catch (e) {
      path = imageField;
    }

    if (!path) return null;
    if (path.startsWith('http')) return path;
    
    const root = await storage.getRootUrl();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${root}${cleanPath}`;
  }
};
