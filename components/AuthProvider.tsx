'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';
import { isAuthenticated, getUser, logout } from '@/lib/auth-utils';

// User tipi
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Auth Context tipi
interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

// Auth Context oluştur
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
});

// Auth Provider props
interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider bileşeni
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Kullanıcı bilgisini yükle
  useEffect(() => {
    const checkAuth = async () => {
      // Kullanıcı giriş yapmış mı?
      if (isAuthenticated()) {
        try {
          // localStorage'dan kullanıcı bilgisini al
          const userData = getUser();
          if (userData) {
            setUser(userData as User);
          } else {
            // API'den kullanıcı bilgisini al
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            setUser(response.data.user);
          }
        } catch (error) {
          console.error('Kullanıcı bilgisi alınamadı:', error);
          // Hata durumunda oturumu kapat
          handleLogout();
        }
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Kullanıcı oturumunu sonlandır
  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Çıkış yapılırken hata:', error);
    } finally {
      // Client-side oturumu temizle
      logout();
      setUser(null);
      
      // Login sayfasına yönlendir
      if (pathname && !pathname.startsWith('/auth/')) {
        router.push('/auth/login');
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Auth Context için custom hook
export const useAuth = () => useContext(AuthContext); 