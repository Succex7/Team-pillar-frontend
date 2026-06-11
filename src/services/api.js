// src/services/api.js
// Central HTTP client for all API calls
// Uses full URLs from endpoints.js — does NOT prepend BASE_URL again

async function request(url, options = {}) {
  // Check both localStorage (keep signed in) and sessionStorage (session only)
  const token =
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // Handle empty responses (e.g. 204 No Content)
    if (response.status === 204) {
      return { data: null };
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const err     = new Error(data?.message || 'Request failed');
      err.status    = response.status;
      err.data      = data;
      err.message   = data?.message || err.message;
      throw err;
    }

    return data;

  } catch (err) {
    // Re-throw structured errors as-is
    if (err.status) throw err;

    // Network error (no internet, CORS, server down)
    const networkErr    = new Error('Network error. Check your connection.');
    networkErr.status   = 0;
    networkErr.isNetwork = true;
    throw networkErr;
  }
}

export const api = {
  get:    (url)       => request(url, { method: 'GET' }),
  post:   (url, body) => request(url, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (url, body) => request(url, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  (url, body) => request(url, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: (url)       => request(url, { method: 'DELETE' }),
};