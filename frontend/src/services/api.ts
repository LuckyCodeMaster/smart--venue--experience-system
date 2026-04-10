import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { store } from '../store';
import { setTokens, logout } from '../store/slices/authSlice';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = store.getState().auth.accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token as string);
    }
  });
  failedQueue = [];
};

// Response interceptor: handle 401 and token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const storedRefreshToken = localStorage.getItem('refreshToken');

      if (!storedRefreshToken) {
        store.dispatch(logout());
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken: storedRefreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        store.dispatch(setTokens({ accessToken, refreshToken: newRefreshToken }));
        localStorage.setItem('refreshToken', newRefreshToken);

        processQueue(null, accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        store.dispatch(logout());
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Auth endpoints ──────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (payload: object) => api.post('/auth/register', payload),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me'),
};

// ─── Venue endpoints ─────────────────────────────────────────────────────────

export const venuesApi = {
  getAll: (params?: object) => api.get('/venues', { params }),
  getById: (id: string) => api.get(`/venues/${id}`),
  create: (data: object) => api.post('/venues', data),
  update: (id: string, data: object) => api.put(`/venues/${id}`, data),
  delete: (id: string) => api.delete(`/venues/${id}`),
  getOccupancy: (id: string, params?: object) =>
    api.get(`/venues/${id}/occupancy`, { params }),
  getZones: (id: string) => api.get(`/venues/${id}/zones`),
};

// ─── Queue endpoints ─────────────────────────────────────────────────────────

export const queuesApi = {
  getAll: (params?: object) => api.get('/queues', { params }),
  getById: (id: string) => api.get(`/queues/${id}`),
  create: (data: object) => api.post('/queues', data),
  update: (id: string, data: object) => api.put(`/queues/${id}`, data),
  delete: (id: string) => api.delete(`/queues/${id}`),
  join: (id: string) => api.post(`/queues/${id}/join`),
  leave: (id: string) => api.post(`/queues/${id}/leave`),
  getTicket: (id: string, ticketId: string) =>
    api.get(`/queues/${id}/tickets/${ticketId}`),
  callNext: (id: string) => api.post(`/queues/${id}/call-next`),
};

// ─── Sensor endpoints ────────────────────────────────────────────────────────

export const sensorsApi = {
  getAll: (params?: object) => api.get('/sensors', { params }),
  getById: (id: string) => api.get(`/sensors/${id}`),
  getReadings: (id: string, params?: object) =>
    api.get(`/sensors/${id}/readings`, { params }),
  getHistory: (id: string, from: string, to: string) =>
    api.get(`/sensors/${id}/history`, { params: { from, to } }),
};

// ─── Analytics endpoints ─────────────────────────────────────────────────────

export const analyticsApi = {
  getDashboardMetrics: () => api.get('/analytics/dashboard'),
  getOccupancyTrend: (venueId?: string, period?: string) =>
    api.get('/analytics/occupancy-trend', { params: { venueId, period } }),
  getQueueMetrics: (params?: object) =>
    api.get('/analytics/queue-metrics', { params }),
};

// ─── Alerts endpoints ────────────────────────────────────────────────────────

export const alertsApi = {
  getAll: (params?: object) => api.get('/alerts', { params }),
  markRead: (id: string) => api.patch(`/alerts/${id}/read`),
  markAllRead: () => api.patch('/alerts/read-all'),
};

// ─── Settings endpoints ──────────────────────────────────────────────────────

export const settingsApi = {
  getUserSettings: () => api.get('/settings'),
  updateUserSettings: (data: object) => api.put('/settings', data),
  updateProfile: (data: object) => api.put('/auth/profile', data),
  changePassword: (data: object) => api.post('/auth/change-password', data),
};

export default api;
