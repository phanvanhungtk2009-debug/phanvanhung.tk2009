const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export const buildApiUrl = (path: string): string => {
  if (/^https?:\/\//.test(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
};

export const apiFetch = (path: string, init?: RequestInit) => {
  return fetch(buildApiUrl(path), init);
};

export const getApiBaseUrl = () => API_BASE_URL;

export const getApiErrorMessage = async (response: Response, fallback: string) => {
  let details = '';
  try {
    const data = await response.json();
    details = data?.message || '';
  } catch {
    // ignore parse errors
  }

  if (response.status === 404) {
    const suffix = API_BASE_URL
      ? `API_BASE_URL hiện tại là: ${API_BASE_URL}`
      : 'Bạn chưa cấu hình VITE_API_BASE_URL khi frontend chạy tách backend.';
    return `${fallback} (404 Not Found). Endpoint không tồn tại hoặc backend chưa được route đúng. ${suffix}`;
  }

  return details ? `${fallback}: ${details}` : `${fallback}: HTTP ${response.status}`;
};
