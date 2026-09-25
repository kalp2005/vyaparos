'use client';

import { firebaseAuth } from './firebase/client';

/**
 * Authenticated API Fetch Wrapper
 * Automatically attaches fresh Firebase ID Token in Authorization: Bearer <token>
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers || {});

  // Retrieve current Firebase user ID token if available
  const currentUser = firebaseAuth.currentUser;
  if (currentUser) {
    try {
      const idToken = await currentUser.getIdToken(false);
      if (idToken) {
        headers.set('Authorization', `Bearer ${idToken.trim()}`);
      }
    } catch (tokenErr) {
      console.warn('Failed to retrieve fresh Firebase ID token:', tokenErr);
    }
  }

  // Set default JSON Content-Type if body is present and not multipart
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // If 401 Unauthorized, attempt a one-time force refresh of the Firebase token
  if (response.status === 401 && currentUser) {
    try {
      const refreshedToken = await currentUser.getIdToken(true);
      if (refreshedToken) {
        headers.set('Authorization', `Bearer ${refreshedToken.trim()}`);
        return await fetch(url, {
          ...options,
          headers,
        });
      }
    } catch (refreshErr) {
      console.error('Token refresh retry failed:', refreshErr);
    }
  }

  return response;
}
