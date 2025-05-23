"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import axios from 'axios';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("redirectTo") || searchParams?.get("callbackUrl") || "/";
  const error = searchParams?.get("error");
  const registered = searchParams?.get("registered");
  
  const submitEmail = process.env.NODE_ENV === 'development' ? "admin1@example.com" : "";
  const [email, setEmail] = useState(submitEmail);
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(error || "");
  const [success, setSuccess] = useState(registered ? "Kayıt başarılı! Şimdi giriş yapabilirsiniz." : "");
  
  // Form gönderim işlemi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccess("");

    try {
      console.log("🔒 Login attempt with:", email);
      
      // Geliştirme ortamında Test123 şifresi ile giriş yap
      let usePassword = password;
      if (process.env.NODE_ENV === 'development' && !password) {
        if (email.includes('@example.com')) {
          usePassword = 'Test123';
          console.log("🔑 Using development default password");
        }
      }
      
      console.log("🔐 Sending login request...");
      const loginResponse = await axios.post('/api/auth/direct', { email, password: usePassword });

      console.log("📨 Login response status:", loginResponse.status);
      
      const data = loginResponse.data;

      if (!data.success) {
        throw new Error(data.error || 'Giriş başarısız');
      }

      // Başarılı giriş
      setSuccess("Giriş başarılı! Yönlendiriliyorsunuz...");
      
      // Token ve kullanıcı bilgilerini her iki depolama alanına da kaydet
      if (rememberMe) {
        // "Beni hatırla" seçilirse localStorage'a kaydet (kalıcı)
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        // SessionStorage'a da kaydet (sekme kapanınca silinir)
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
      } else {
        // "Beni hatırla" seçilmediyse sadece session storage kullan
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        // LocalStorage'daki eski verileri temizle
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      
      console.log("✅ Login successful for:", data.user.role);
      
      // Rol bazlı yönlendirme URL'ini belirle
      let targetUrl = '/';
      if (data.redirectUrl) {
        targetUrl = data.redirectUrl;
      } else {
        // Rol bazlı yönlendirme
        switch (data.user.role.toUpperCase()) {
          case 'ADMIN':
            targetUrl = '/admin/dashboard';
            break;
          case 'BUSINESS':
            targetUrl = '/business/dashboard';
            break;
          case 'COURIER':
            targetUrl = '/courier/dashboard';
            break;
          case 'CUSTOMER':
            targetUrl = '/customer/dashboard';
            break;
        }
      }
      
      console.log("🚀 Redirecting to:", targetUrl);
      
      // Sayfayı yönlendirmeden önce 1 saniye bekle
      setTimeout(() => {
        // Doğrudan window.location.href ile yönlendirme yap
        // Bu şekilde tarayıcı tam sayfa yenileme yapar
        window.location.href = targetUrl;
      }, 1000);
      
    } catch (err: any) {
      console.error("❌ Login error:", err);
      setErrorMessage(err.message || "Giriş yapılırken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Test kullanıcı giriş butonları
  const handleTestLogin = (userType: string) => {
    let testEmail = '';
    const testPassword = 'Test123';

    switch (userType) {
      case 'admin':
        testEmail = 'admin1@example.com';
        break;
      case 'business':
        testEmail = 'business1@example.com';
        break;
      case 'courier':
        testEmail = 'courier1@example.com';
        break;
      case 'customer':
        testEmail = 'customer1@example.com';
        break;
    }

    setEmail(testEmail);
    setPassword(testPassword);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email">E-posta Adresi</Label>
        <Input 
          id="email"
          type="email" 
          placeholder="ornek@mail.com" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="password">Şifre</Label>
          <a href="/auth/forgot-password" className="text-sm text-blue-600 hover:underline">
            Şifremi unuttum
          </a>
        </div>
        <Input 
          id="password" 
          type="password" 
          placeholder="********" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="remember" 
          checked={rememberMe} 
          onCheckedChange={(checked) => setRememberMe(checked as boolean)}
        />
        <Label htmlFor="remember" className="text-sm cursor-pointer">Beni hatırla</Label>
      </div>
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
            Giriş yapılıyor...
          </>
        ) : (
          'Giriş Yap'
        )}
      </Button>
      
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => handleTestLogin('admin')}
          >
            Admin Giriş
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => handleTestLogin('business')}
          >
            İşletme Giriş
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => handleTestLogin('courier')}
          >
            Kurye Giriş
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => handleTestLogin('customer')}
          >
            Müşteri Giriş
          </Button>
        </div>
      )}
    </form>
  );
} 