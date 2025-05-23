"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Test kullanıcı bilgileri
const testUsers = [
  { role: 'admin', email: 'admin1@example.com', password: 'Test123' },
  { role: 'business', email: 'business1@example.com', password: 'Test123' },
  { role: 'courier', email: 'courier1@example.com', password: 'Test123' },
  { role: 'customer', email: 'customer1@example.com', password: 'Test123' }
];

export default function TestLoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<string | null>(null);

  // Zaten giriş yapılıp yapılmadığını kontrol et
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        setStatus({
          loggedIn: true,
          user: userData
        });
      } catch (e) {
        console.error('Kullanıcı verileri çözümlenemedi', e);
      }
    }
  }, []);

  // Çıkış fonksiyonu
  const handleLogout = async () => {
    try {
      console.log('Çıkış yapılıyor...');
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('Çıkış yanıtı:', data);
      
      // Yerel depolamadan verileri temizle
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      
      setStatus({});
      
      // Bellekteki durumu temizlemek için sayfayı yenile
      window.location.href = '/auth/test-login';
    } catch (error) {
      console.error('Çıkış yapma hatası:', error);
      alert('Çıkış yapma sırasında bir hata oluştu.');
    }
  };

  // Giriş fonksiyonu
  const handleTestLogin = async (userRole: string) => {
    const user = testUsers.find(u => u.role === userRole);
    if (!user) return;
    
    setLoading(userRole);
    setStatus(prev => ({ ...prev, [userRole]: 'Giriş yapılıyor...' }));
    
    try {
      const response = await axios.post('/api/auth/direct', {
        email: user.email,
        password: user.password
      });
      
      const data = response.data;
      
      if (data.success) {
        // Token ve kullanıcı verilerini kaydet
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        
        setStatus(prev => ({ 
          ...prev, 
          [userRole]: 'Başarılı', 
          loggedIn: true,
          user: data.user,
          token: data.token.substring(0, 15) + '...'
        }));

        // Yönlendirme sayfasına git
        if (data.redirectUrl) {
          setTimeout(() => {
            window.location.href = data.redirectUrl;
          }, 800); // Kısa bir gecikme ile yönlendir
        }
      } else {
        setStatus(prev => ({ ...prev, [userRole]: `Hata: ${data.error}` }));
      }
    } catch (error: any) {
      console.error('Giriş hatası:', error);
      setStatus(prev => ({ 
        ...prev, 
        [userRole]: `Hata: ${error.response?.data?.error || error.message}` 
      }));
    } finally {
      setLoading(null);
    }
  };

  // Kontrol paneline git
  const goToDashboard = () => {
    if (status.user?.role) {
      const dashboardPath = `/${status.user.role.toLowerCase()}/dashboard`;
      window.location.href = dashboardPath; // Router.push yerine doğrudan yönlendirme
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Kimlik Doğrulama Testi</CardTitle>
          <CardDescription>
            Farklı kullanıcı rolleriyle kimlik doğrulama sistemini test edin
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {status.loggedIn ? (
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-green-800">Şu anda giriş yapan kullanıcı:</h3>
              <div className="mt-2 text-sm text-green-700">
                <p><strong>İsim:</strong> {status.user?.name}</p>
                <p><strong>E-posta:</strong> {status.user?.email}</p>
                <p><strong>Rol:</strong> {status.user?.role}</p>
                <p><strong>Token:</strong> {status.token}</p>
              </div>
              <div className="mt-4 flex space-x-2">
                <Button 
                  onClick={goToDashboard} 
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Kontrol Paneline Git
                </Button>
                <Button 
                  onClick={handleLogout}
                  variant="outline"
                >
                  Çıkış Yap
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-blue-700">
                Şu anda giriş yapmış değilsiniz. Giriş yapmak için bir test kullanıcısı seçin.
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            {testUsers.map(user => {
              // Rol adlarını Türkçeye çevir
              const roleTr = 
                user.role === 'admin' ? 'Yönetici' :
                user.role === 'business' ? 'İşletme' :
                user.role === 'courier' ? 'Kurye' : 'Müşteri';
                
              return (
                <Button
                  key={user.role}
                  onClick={() => handleTestLogin(user.role)}
                  disabled={loading === user.role}
                  className={`relative ${
                    status[user.role] === 'Başarılı' ? 'bg-green-600 hover:bg-green-700' : ''
                  }`}
                >
                  {loading === user.role && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {roleTr} olarak giriş yap
                </Button>
              );
            })}
          </div>
          
          {Object.entries(status).filter(([key]) => ['admin', 'business', 'courier', 'customer'].includes(key)).map(([key, value]) => {
            // Rol adlarını Türkçeye çevir
            const roleTr = 
              key === 'admin' ? 'Yönetici' :
              key === 'business' ? 'İşletme' :
              key === 'courier' ? 'Kurye' : 'Müşteri';
              
            return (
              <div key={key} className="mt-2 text-sm">
                <span className="font-medium">{roleTr}:</span> {value}
              </div>
            );
          })}
        </CardContent>
        
        <CardFooter className="flex flex-col items-start">
          <h3 className="font-medium mb-2">Test Kullanıcıları</h3>
          <div className="text-sm space-y-1">
            {testUsers.map(user => {
              // Rol adlarını Türkçeye çevir
              const roleTr = 
                user.role === 'admin' ? 'Yönetici' :
                user.role === 'business' ? 'İşletme' :
                user.role === 'courier' ? 'Kurye' : 'Müşteri';
                
              return (
                <p key={user.role}><strong>{roleTr}:</strong> {user.email} / {user.password}</p>
              );
            })}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 