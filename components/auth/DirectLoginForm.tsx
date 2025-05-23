'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DirectLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Store token and user data based on remember me selection
        if (remember) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          // Also set in sessionStorage for consistent access
          sessionStorage.setItem('token', data.token);
          sessionStorage.setItem('user', JSON.stringify(data.user));
        } else {
          sessionStorage.setItem('token', data.token);
          sessionStorage.setItem('user', JSON.stringify(data.user));
          // Clear localStorage if not remembering
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        
        console.log('Login successful, redirecting to:', data.redirectUrl);
        
        // Use window.location for full page refresh to ensure correct state
        window.location.href = data.redirectUrl || '/dashboard';
      } else {
        setError(data.error || 'Giriş başarısız. Lütfen tekrar deneyin.');
      }
    } catch (err) {
      console.error('Giriş hatası:', err);
      setError('Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 border border-red-200 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium">E-posta Adresi</label>
        <input 
          type="email" 
          id="email" 
          name="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded-md" 
          placeholder="ornek@mail.com" 
          required 
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium">Şifre</label>
        <div className="relative">
          <input 
            type={showPassword ? "text" : "password"}
            id="password" 
            name="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)} 
            className="w-full p-2 border rounded-md" 
            placeholder="********" 
            required 
          />
          <div className="absolute right-0 top-0 mt-3 mr-3">
            <button 
              type="button" 
              className="text-gray-500 focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {showPassword ? (
                  <>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </>
                ) : (
                  <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
        <div className="text-right">
          <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:underline">
            Şifremi unuttum
          </Link>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <input 
          type="checkbox" 
          id="remember-me" 
          name="remember-me" 
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="rounded border-gray-300" 
        />
        <label htmlFor="remember-me" className="text-sm">Beni hatırla</label>
      </div>
      
      <button 
        type="submit" 
        disabled={loading}
        className="w-full p-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-70"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Giriş yapılıyor...
          </div>
        ) : 'Giriş Yap'}
      </button>
    </form>
  );
} 