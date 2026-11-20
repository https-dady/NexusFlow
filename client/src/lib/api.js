import axios from 'axios';

const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api/v1`;

let accessToken = null;
let unauthorizedHandler = null;
let refreshPromise = null;

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

export const setAccessToken = (token) => {
  accessToken = token ?? null;
};

export const getAccessToken = () => accessToken;

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

export const refreshSession = async () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE}/auth/refresh`, null, { withCredentials: true, timeout: 30_000 })
      .then((response) => {
        const token = response.data?.accessToken;
        if (!token) throw new Error('No access token returned');
        accessToken = token;
        return response.data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const original = error.config ?? {};
    const isAuthPath =
      /\/auth\/(login|register|refresh|logout|forgot-password|reset-password|accept-invite)/.test(
        original.url ?? ''
      );

    if (status === 401 && !original._retried && !isAuthPath && accessToken) {
      original._retried = true;
      try {
        await refreshSession();
        original.headers = { ...original.headers, Authorization: `Bearer ${accessToken}` };
        return api.request(original);
      } catch (refreshError) {
        accessToken = null;
        unauthorizedHandler?.();
        return Promise.reject(refreshError);
      }
    }

    if (status === 401 && !isAuthPath && !accessToken) {
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  }
);

export const apiBaseUrl = API_BASE;

export async function downloadReport(type, params = {}) {
  const response = await api.get(`/reports/${type}`, { params, responseType: 'blob' });
  return {
    blob: response.data,
    filename:
      /filename="?([^"]+)"?/i.exec(response.headers['content-disposition'] ?? '')?.[1] ??
      `nexusflow-${type}.csv`,
    rows: Number(response.headers['x-report-rows'] ?? 0),
    truncated: response.headers['x-report-truncated'] === 'true',
  };
}

export async function downloadTelemetryCsv(params = {}) {
  const response = await api.get('/telemetry/export', { params, responseType: 'blob' });
  return {
    blob: response.data,
    filename:
      /filename="?([^"]+)"?/i.exec(response.headers['content-disposition'] ?? '')?.[1] ??
      'nexusflow-telemetry.csv',
  };
}
