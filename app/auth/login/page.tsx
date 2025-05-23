"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { isAuthenticated, getUser } from '@/lib/auth-utils';
import DirectLoginForm from "@/components/auth/DirectLoginForm";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '';
  const [loading, setLoading] = useState(true);

  // Giriş kontrolü - kullanıcı zaten giriş yapmışsa
  useEffect(() => {
    // Token ve kullanıcı bilgilerini kontrol et
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (token && userStr) {
      try {
        // Kullanıcı bilgilerini parse et
        const user = JSON.parse(userStr);
        
        // Kullanıcı rolüne göre yönlendir
        let redirectUrl = '/dashboard';
        if (callbackUrl) {
          redirectUrl = callbackUrl;
        } else if (user.role) {
        switch (user.role) {
          case 'ADMIN':
              redirectUrl = '/admin/dashboard';
            break;
          case 'BUSINESS':
              redirectUrl = '/business/dashboard';
            break;
          case 'COURIER':
              redirectUrl = '/courier/dashboard';
            break;
          case 'CUSTOMER':
              redirectUrl = '/customer/dashboard';
            break;
        }
      }
        
        console.log(`Kullanıcı zaten giriş yapmış, yönlendiriliyor: ${redirectUrl}`);
        router.replace(redirectUrl);
        return;
      } catch (e) {
        console.error('Kullanıcı bilgileri parse edilemedi:', e);
        // Hatalı veriler var, temizle
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, [router, callbackUrl]);

  if (loading) {
    return (
      <div className="container mx-auto mt-8 max-w-md">
        <Card className="p-6 shadow-lg rounded-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Yükleniyor...
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center p-4">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-8 max-w-md">
      <Card className="p-6 shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
          Hesabınıza Giriş Yapın
          </CardTitle>
        </CardHeader>

        <CardContent>
          <DirectLoginForm />
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600 mt-2">
            Hesabınız yok mu? <Link href="/auth/register" className="text-blue-600 hover:underline">Kaydolun</Link>
          </p>
        </CardFooter>
      </Card>
      
      <Card className="mt-8 p-4 bg-blue-50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-blue-600 text-center">
          Test Kullanıcıları
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
          <p>Admin: admin1@example.com / Test123</p>
          <p>İşletme: business1@example.com / Test123</p>
          <p>Kurye: courier1@example.com / Test123</p>
          <p>Müşteri: customer1@example.com / Test123</p>
        </div>
        </CardContent>
      </Card>
    </div>
  );
} 