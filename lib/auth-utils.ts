// Client-side auth utilities

/**
 * Check if user is logged in by looking for token in storage
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return !!token;
}

/**
 * Get the logged-in user from storage
 */
export function getUser(): any | null {
  if (typeof window === 'undefined') return null;
  
  const userString = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (!userString) return null;
  
  try {
    return JSON.parse(userString);
  } catch (error) {
    console.error('Failed to parse user data:', error);
    return null;
  }
}

/**
 * Get the authentication token from storage
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

/**
 * Log out the user by clearing storage
 */
export function logout(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  
  // Redirect to login page
  window.location.href = '/auth/login';
}

/**
 * Kullanıcının belirli bir role sahip olup olmadığını kontrol eder
 * @param role Kontrol edilecek rol
 * @returns Kullanıcı bu role sahipse true, değilse false
 */
export function hasRole(role: string): boolean {
  const user = getUser();
  if (!user) {
    return false;
  }
  
  return user.role === role;
}

/**
 * API istekleri için Authorization header'ı oluşturur
 * @returns Header objesinde Authorization token'ı
 */
export function getAuthHeaders(): HeadersInit {
  const token = getToken();
  
  if (!token) {
    return {};
  }
  
  return {
    'Authorization': `Bearer ${token}`
  };
}

/**
 * Kullanıcı oturumunu yeniler - API'den taze kullanıcı bilgilerini alır
 * @returns Kullanıcı bilgilerini içeren Promise
 */
export async function refreshToken(): Promise<any> {
  const token = getToken();
  
  if (!token) {
    return Promise.reject(new Error('Token bulunamadı'));
  }
  
  try {
    // Önce /api/users/me endpoint'ine istek yap
    const response = await fetch('/api/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      // Alternatif endpoint'i dene
      const altResponse = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!altResponse.ok) {
        throw new Error('Her iki API isteği de başarısız oldu');
      }
      
      const data = await altResponse.json();
      
      if (data && data.user) {
        // LocalStorage ve sessionStorage'da güncelle
        if (localStorage.getItem('token')) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        if (sessionStorage.getItem('token')) {
          sessionStorage.setItem('user', JSON.stringify(data.user));
        }
        return data.user;
      }
    } else {
      const data = await response.json();
      
      if (data && data.user) {
        // LocalStorage ve sessionStorage'da güncelle
        if (localStorage.getItem('token')) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        if (sessionStorage.getItem('token')) {
          sessionStorage.setItem('user', JSON.stringify(data.user));
        }
        return data.user;
      }
    }
    
    throw new Error('Kullanıcı bilgileri alınamadı');
  } catch (error) {
    console.error('Token yenileme hatası:', error);
    // Hata durumunda oturumu temizle
    logout();
    throw error;
  }
} 