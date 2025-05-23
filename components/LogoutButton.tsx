'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function LogoutButton({ className = 'text-red-600 hover:text-red-800' }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      // API ile çıkış yap
      await axios.post('/api/auth/logout');
      
      // localStorage'dan tüm kimlik bilgilerini temizle
      const localStorageKeys = [
        'token', 'user', 'role', 'auth', 
        'session', 'next-auth.session-token', 
        'next-auth.callback-url', 'next-auth.csrf-token',
        'userData', 'authState', 'currentBusiness', 'permissions',
        'selectedRole', 'cartItems', 'orderHistory', 'userPreferences'
      ];
      
      localStorageKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn(`Failed to remove ${key} from localStorage:`, e);
        }
      });
      
      // Session storage'daki bilgileri de temizle
      const sessionStorageKeys = [
        'token', 'user', 'role', 'auth', 
        'session', 'next-auth.session-token', 
        'next-auth.callback-url', 'next-auth.csrf-token',
        'userData', 'redirectUrl', 'tempData'
      ];
      
      sessionStorageKeys.forEach(key => {
        try {
          sessionStorage.removeItem(key);
        } catch (e) {
          console.warn(`Failed to remove ${key} from sessionStorage:`, e);
        }
      });
      
      // Tarayıcı önbelleğinden sayfaları temizle ve login sayfasına yönlendir
      console.log('Çıkış yapıldı, login sayfasına yönlendiriliyor...');
      
      try {
        // Caches API kullanarak önbelleği temizle - tarayıcı desteği varsa
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
          console.log('Browser cache cleared');
        }
      } catch (cacheError) {
        console.warn('Failed to clear browser cache:', cacheError);
      }
      
      // Tam sayfa yenileme ile temiz başlangıç
      if (typeof window !== 'undefined') {
        // Geçici oturum bilgilerini önbelleğe almayı engelle
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "next-auth.callback-url=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "next-auth.csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        
        // Önce router.push ile URL'i değiştir, sonra tam sayfa yenile
        router.push('/auth/login');
        
        // Alt sayfaları da temizlemek için kısa bir gecikme sonra yönlendir
        setTimeout(() => {
          window.location.href = '/auth/login'; 
        }, 100);
      } else {
        router.push('/auth/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Çıkış yapılırken hata:', error);
      alert('Çıkış yaparken bir hata oluştu. Lütfen tekrar deneyin.');
      
      // Hata olsa bile güvenlik için token temizlenmeye çalışılsın
      try {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        router.push('/auth/login');
      } catch (e) {
        console.error('Acil durumda token temizleme hatası:', e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={`${className} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isLoading ? 'Çıkış yapılıyor...' : 'Çıkış Yap'}
    </button>
  );
} 