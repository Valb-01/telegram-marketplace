import axios from 'axios';

export function createApiClient(baseURL: string, getToken?: () => string | null) {
  const client = axios.create({ baseURL, timeout: 15000 });

  client.interceptors.request.use((config) => {
    const token = getToken?.();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  return client;
}
