'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (user: User, token: string, remember: boolean) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

// Context oluştur
const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
  isAuthenticated: () => false,
});

// Auth context hook
export const useAuth = () => useContext(AuthContext);

// AuthProvider component
export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Kullanıcı bilgilerini localStorage/sessionStorage'dan al
  useEffect(() => {
    const loadUserData = () => {
      try {
        setIsLoading(true);
        
        // Token kontrolü
        let savedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!savedToken) {
          setIsLoading(false);
          return;
        }
        
        // Kullanıcı bilgilerini al
        let userData: User | null = null;
        const localUser = localStorage.getItem('user');
        const sessionUser = sessionStorage.getItem('user');
        
        if (localUser) {
          userData = JSON.parse(localUser);
        } else if (sessionUser) {
          userData = JSON.parse(sessionUser);
        }
        
        if (userData && savedToken) {
          setUser(userData);
          setToken(savedToken);
        }
      } catch (error) {
        console.error('Kullanıcı bilgileri yüklenirken hata:', error);
        // Hata durumunda tüm depolanan verileri temizle
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserData();
    
    // Sayfa yüklendiğinde çalışsın
    window.addEventListener('storage', loadUserData);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', loadUserData);
    };
  }, []);

  // Giriş işlemi
  const login = (userData: User, newToken: string, remember: boolean) => {
    setUser(userData);
    setToken(newToken);
    
    // Remember me seçeneğine göre localStorage veya sessionStorage kullan
    if (remember) {
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', newToken);
      // Tutarlılık için sessionStorage'a da kaydet
      sessionStorage.setItem('user', JSON.stringify(userData));
      sessionStorage.setItem('token', newToken);
    } else {
      sessionStorage.setItem('user', JSON.stringify(userData));
      sessionStorage.setItem('token', newToken);
      // Remember me seçilmediyse localStorage'daki verileri temizle
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  };

  // Çıkış işlemi
  const logout = async () => {
    try {
      // API'ya çıkış isteği gönder
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Çıkış yapma API hatası:', error);
    } finally {
      // Yerel durumu temizle
    setUser(null);
    setToken(null);
    
      // Tarayıcı depolamasını temizle
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
      
      // Sayfa yenileme ile ana sayfaya yönlendir
      window.location.href = '/';
    }
  };
  
  // Kimlik doğrulama durumu kontrolü
  const isAuthenticated = () => {
    return !!token && !!user;
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
} 