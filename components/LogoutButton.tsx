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
      
      // localStorage'dan token ve kullanıcı bilgilerini temizle
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Login sayfasına yönlendir
      router.push('/auth/login');
      router.refresh();
    } catch (error) {
      console.error('Çıkış yapılırken hata:', error);
      alert('Çıkış yaparken bir hata oluştu. Lütfen tekrar deneyin.');
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