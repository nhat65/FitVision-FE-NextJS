import { getAccessToken, refreshAccessToken, clearTokens } from './auth-store';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface FetchApiOptions extends RequestInit {
  skipAuth?: boolean;
}

export interface ApiResponse<T = any> {
  status?: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

export async function fetchApi<T = any>(
  endpoint: string,
  options: FetchApiOptions = {}
): Promise<T> {
  const { skipAuth = false, headers, ...customOptions } = options;

  // Chuẩn hóa endpoint: đảm bảo có tiền tố /api
  let cleanEndpoint = endpoint;
  if (!cleanEndpoint.startsWith('http://') && !cleanEndpoint.startsWith('https://')) {
    if (!cleanEndpoint.startsWith('/')) {
      cleanEndpoint = `/${cleanEndpoint}`;
    }
    if (!cleanEndpoint.startsWith('/api/') && cleanEndpoint !== '/api') {
      cleanEndpoint = `/api${cleanEndpoint}`;
    }
    cleanEndpoint = `${API_BASE_URL}${cleanEndpoint}`;
  }

  const requestHeaders = new Headers(headers);

  // Chỉ gắn Content-Type là json nếu body không phải FormData
  if (!(customOptions.body instanceof FormData) && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`);
    }
  }

  let response: Response;
  try {
    response = await fetch(cleanEndpoint, {
      ...customOptions,
      headers: requestHeaders,
    });
  } catch (networkError: any) {
    console.error('[fetchApi] Network error:', networkError);
    throw new Error(networkError.message || 'Lỗi kết nối mạng đến máy chủ');
  }

  // Tự động xử lý Refresh Token nếu token hết hạn (401)
  if (response.status === 401 && !skipAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newToken = getAccessToken();
      if (newToken) {
        requestHeaders.set('Authorization', `Bearer ${newToken}`);
      }
      response = await fetch(cleanEndpoint, {
        ...customOptions,
        headers: requestHeaders,
      });
    } else {
      clearTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
  }

  let result: any;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    result = await response.json();
  } else {
    result = await response.text();
  }

  if (!response.ok) {
    const errorMessage =
      (result && typeof result === 'object' && (result.message || result.error)) ||
      `HTTP error! status: ${response.status}`;
    throw new Error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
  }

  // Nếu backend trả về format NestJS chuẩn: { status: true, message: "...", data: [...] }
  if (result && typeof result === 'object') {
    if (result.status === false) {
      throw new Error(result.message || 'Thao tác không thành công');
    }
    if (result.data !== undefined) {
      return result.data as T;
    }
  }

  return result as T;
}

