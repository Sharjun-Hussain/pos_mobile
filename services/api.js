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

const apiRequest = async (endpoint, options = {}, isRetry = false) => {
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

    // 401 Handling: Silent Refresh Logic
    if (response.status === 401 && !isRetry && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      const refreshToken = useAuthStore.getState().refreshToken || await storage.get('refresh_token');
      
      if (refreshToken) {
        try {
          console.log('[API] Token expired, attempting silent refresh...');
          const refreshRes = await api.auth.refresh(refreshToken);
          
          if (refreshRes.status === 'success') {
            // New token set by api.auth.refresh in the store
            // Retry the original request with IS_RETRY = TRUE
            return await apiRequest(endpoint, options, true);
          }
        } catch (refreshErr) {
          console.error('[API] Silent refresh failed:', refreshErr);
        }
      }

      // If we get here, refresh failed or was not possible
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') window.location.href = '/login';
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
        useAuthStore.getState().login(res.data.auth_token, res.data.refresh_token, res.data.user);
      }
      return res;
    },
    refresh: async (refreshToken) => {
      const res = await api.post('/auth/refresh', { refresh_token: refreshToken });
      if (res.status === 'success' && res.data?.auth_token) {
        // Update store with new access token and rotated refresh token
        useAuthStore.getState().login(res.data.auth_token, res.data.refresh_token, useAuthStore.getState().user);
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
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return api.get(`/products?${query}`);
    },
    getActiveList: () => api.get('/products/active/list'),
    getByBarcode: (barcode) => api.get(`/products/barcode/${barcode}`)
  },

  stocks: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return api.get(`/stocks?${query}`);
    },
    adjust: (data) => api.post('/stocks/adjust', data)
  },

  categories: {
    getActiveList: () => api.get('/main-categories/active/list')
  },

  customers: {
    getActiveList: () => api.get('/customers/active/list'),
    create: (data) => api.post('/customers', data)
  },

  sales: {
    create: (data) => api.post('/sales', data)
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
