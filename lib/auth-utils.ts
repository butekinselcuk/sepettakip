// Client tarafında kullanılacak JWT yardımcı fonksiyonları

/**
 * localStorage'dan JWT token'ı alır
 * @returns Token veya undefined
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  return localStorage.getItem('token');
}

/**
 * localStorage'dan kullanıcı bilgisini alır
 * @returns Kullanıcı bilgileri veya null
 */
export function getUser() {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const userJson = localStorage.getItem('user');
  if (!userJson) {
    return null;
  }
  
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
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
 * Kullanıcının herhangi bir oturumu olup olmadığını kontrol eder
 * @returns Kullanıcı giriş yapmışsa true, değilse false
 */
export function isAuthenticated(): boolean {
  return !!getToken() && !!getUser();
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
 * Kullanıcı oturumunu sonlandırır
 */
export function logout(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.removeItem('token');
  localStorage.removeItem('user');
} 