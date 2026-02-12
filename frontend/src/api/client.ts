import axios from 'axios';
import type {
  AuthResponse,
  DashboardCounts,
  Evaluation,
  FiscalYear,
  Goal,
  Notification,
  User,
  Department,
  Position,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// リクエストインターセプター: JWTトークン付与
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// レスポンスインターセプター: 401時にリフレッシュ試行
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// ===== 認証 =====

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  refresh: (refreshToken: string) =>
    api.post<{ accessToken: string }>('/auth/refresh', { refreshToken }),
};

// ===== 目標 =====

export const goalApi = {
  list: (fiscalYearId: number) =>
    api.get<Goal[]>('/goals', { params: { fiscalYearId } }),

  save: (goals: { fiscalYearId: number; goals: string[] }) =>
    api.post<Goal[]>('/goals', goals),
};

// ===== 評価 =====

export const evaluationApi = {
  mine: () =>
    api.get<Evaluation[]>('/evaluations/mine'),

  pending: () =>
    api.get<Evaluation[]>('/evaluations/pending'),

  counts: () =>
    api.get<DashboardCounts>('/evaluations/counts'),

  submitSelf: (id: number) =>
    api.post<Evaluation>(`/evaluations/${id}/self-evaluate`),

  evaluate: (id: number, grade: string, comment: string) =>
    api.post<Evaluation>(`/evaluations/${id}/evaluate`, { grade, comment }),

  approve: (id: number, grade: string, comment: string) =>
    api.post<Evaluation>(`/evaluations/${id}/approve`, { grade, comment }),

  reject: (id: number, reason: string) =>
    api.post<Evaluation>(`/evaluations/${id}/reject`, { reason }),

  directorEvaluate: (id: number, grade: string, comment: string) =>
    api.post<Evaluation>(`/evaluations/${id}/director-evaluate`, { grade, comment }),

  finalize: (id: number) =>
    api.post<Evaluation>(`/evaluations/${id}/finalize`),

  managerPending: () =>
    api.get<Evaluation[]>('/evaluations/manager-pending'),

  directorPending: () =>
    api.get<Evaluation[]>('/evaluations/director-pending'),

  finalizePending: () =>
    api.get<Evaluation[]>('/evaluations/finalize-pending'),
};

// ===== 通知 =====

export const notificationApi = {
  list: () =>
    api.get<Notification[]>('/notifications'),

  markRead: (id: number) =>
    api.put(`/notifications/${id}/read`),

  unreadCount: () =>
    api.get<number>('/notifications/unread-count'),
};

// ===== 管理 =====

export const adminApi = {
  users: () => api.get<User[]>('/admin/users'),
  createUser: (data: Partial<User>) => api.post<User>('/admin/users', data),
  updateUser: (id: number, data: Partial<User>) => api.put<User>(`/admin/users/${id}`, data),
  departments: () => api.get<Department[]>('/admin/departments'),
  positions: () => api.get<Position[]>('/admin/positions'),
  fiscalYears: () => api.get<FiscalYear[]>('/admin/fiscal-years'),
};

export default api;
