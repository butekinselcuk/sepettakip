'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface TestLoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  redirectUrl?: string;
  error?: string;
  message?: string;
}

export default function TestLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('Test123');
  const [bypass, setBypass] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestLoginResponse | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setResult({
          success: true,
          token: storedToken,
          user,
          message: 'Zaten giriş yapmış durumdasınız.'
        });
      } catch (e) {
        console.error('Invalid stored user data:', e);
      }
    }
  }, []);

  const handleTestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setErrorDetails(null);

    try {
      const response = await fetch('/api/auth/test-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, bypass }),
        credentials: 'include' // Ensure cookies are sent with the request
      });

      const data = await response.json();
      console.log('Login response:', data);
      setResult(data);

      // If login was successful
      if (data.success && data.token) {
        // Store token in local storage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Set cookie manually as fallback (cookies should be set by the API)
        document.cookie = `token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      }
    } catch (error) {
      console.error('Login error:', error);
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Bilinmeyen hata' 
      });
      setErrorDetails(error instanceof Error ? error.stack || '' : 'Detaylı hata bilgisi yok');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (url: string) => {
    setShouldRedirect(true);
    setTimeout(() => {
      router.push(url);
    }, 500);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setResult(null);
    window.location.reload();
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Test Login Sayfası</h1>
      <p className="mb-4 text-gray-600">
        Bu sayfa, kimlik doğrulama sistemini test etmek ve korumalı sayfalara erişmek için kullanılabilir.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Test Kullanıcı Girişi</h2>
          
          <form onSubmit={handleTestLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">E-posta</label>
              <select 
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded-md"
                disabled={loading || shouldRedirect}
              >
                <option value="admin@example.com">Admin: admin@example.com</option>
                <option value="business@example.com">İşletme: business@example.com</option>
                <option value="courier@example.com">Kurye: courier@example.com</option>
                <option value="customer@example.com">Müşteri: customer@example.com</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">Şifre</label>
              <input
                id="password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded-md"
                disabled={loading || shouldRedirect}
              />
            </div>
            
            <div className="flex items-center">
              <input
                id="bypass"
                type="checkbox"
                checked={bypass}
                onChange={(e) => setBypass(e.target.checked)}
                className="mr-2"
                disabled={loading || shouldRedirect}
              />
              <label htmlFor="bypass" className="text-sm">
                Şifre kontrolünü atla (test için)
              </label>
            </div>
            
            <button
              type="submit"
              disabled={loading || shouldRedirect || (result?.success && !!result.token)}
              className="w-full p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-70"
            >
              {loading ? 'Giriş yapılıyor...' : shouldRedirect ? 'Yönlendiriliyor...' : 'Test Girişi Yap'}
            </button>

            {result?.success && result.token && (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full p-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Çıkış Yap
              </button>
            )}
          </form>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Sonuçlar</h2>
          
          {result ? (
            <div>
              <div className={`p-3 rounded-md mb-4 ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {result.success ? 'Giriş başarılı!' : 'Giriş başarısız!'}
                {result.message && <p>{result.message}</p>}
                {result.error && <p className="text-red-600">Hata: {result.error}</p>}
              </div>
              
              {result.success && result.user && (
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Kullanıcı Bilgileri:</h3>
                  <p><span className="font-medium">ID:</span> {result.user.id}</p>
                  <p><span className="font-medium">Ad:</span> {result.user.name}</p>
                  <p><span className="font-medium">E-posta:</span> {result.user.email}</p>
                  <p><span className="font-medium">Rol:</span> {result.user.role}</p>
                </div>
              )}
              
              {result.success && result.token && (
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Token (Kısaltılmış):</h3>
                  <p className="text-sm break-all bg-gray-100 p-2 rounded">
                    {result.token.substring(0, 30)}...
                  </p>
                </div>
              )}
              
              {result.success && result.redirectUrl && (
                <div>
                  <h3 className="font-medium mb-2">Yönlendirme URL'i:</h3>
                  <p>{result.redirectUrl}</p>
                  <button
                    onClick={() => handleNavigate(result.redirectUrl!)}
                    className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Bu sayfaya git
                  </button>
                </div>
              )}

              {errorDetails && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2 text-red-600">Hata Detayları:</h3>
                  <pre className="text-xs overflow-auto bg-gray-100 p-2 rounded max-h-40">
                    {errorDetails}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 italic">Henüz bir test yapılmadı.</p>
          )}
        </div>
      </div>
      
      <div className="mt-8 bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Korumalı Sayfalar</h2>
        <p className="mb-4">
          Aşağıdaki sayfalara, başarılı bir test girişi sonrasında erişebilirsiniz.
          Her rol için belirli sayfalar korunmaktadır ve doğru role sahip olmanız gerekir.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="font-medium mb-2">Admin Sayfaları</h3>
            <ul className="space-y-1">
              {result?.success && result.user?.role === 'ADMIN' ? (
                <>
                  <li><button onClick={() => handleNavigate('/admin/dashboard')} className="text-blue-600 hover:underline">Admin Dashboard</button></li>
                  <li><button onClick={() => handleNavigate('/admin/users')} className="text-blue-600 hover:underline">Kullanıcı Yönetimi</button></li>
                  <li><button onClick={() => handleNavigate('/admin/settings')} className="text-blue-600 hover:underline">Sistem Ayarları</button></li>
                </>
              ) : (
                <li className="text-gray-400">Giriş gerekli (Admin)</li>
              )}
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="font-medium mb-2">İşletme Sayfaları</h3>
            <ul className="space-y-1">
              {result?.success && result.user?.role === 'BUSINESS' ? (
                <>
                  <li><button onClick={() => handleNavigate('/business/dashboard')} className="text-blue-600 hover:underline">İşletme Dashboard</button></li>
                  <li><button onClick={() => handleNavigate('/business/orders')} className="text-blue-600 hover:underline">Siparişler</button></li>
                  <li><button onClick={() => handleNavigate('/business/products')} className="text-blue-600 hover:underline">Ürün Yönetimi</button></li>
                </>
              ) : (
                <li className="text-gray-400">Giriş gerekli (İşletme)</li>
              )}
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="font-medium mb-2">Kurye Sayfaları</h3>
            <ul className="space-y-1">
              {result?.success && result.user?.role === 'COURIER' ? (
                <>
                  <li><button onClick={() => handleNavigate('/courier/dashboard')} className="text-blue-600 hover:underline">Kurye Dashboard</button></li>
                  <li><button onClick={() => handleNavigate('/courier/deliveries')} className="text-blue-600 hover:underline">Teslimatlar</button></li>
                  <li><button onClick={() => handleNavigate('/courier/account')} className="text-blue-600 hover:underline">Hesap Bilgileri</button></li>
                </>
              ) : (
                <li className="text-gray-400">Giriş gerekli (Kurye)</li>
              )}
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="font-medium mb-2">Müşteri Sayfaları</h3>
            <ul className="space-y-1">
              {result?.success && result.user?.role === 'CUSTOMER' ? (
                <>
                  <li><button onClick={() => handleNavigate('/customer/dashboard')} className="text-blue-600 hover:underline">Müşteri Dashboard</button></li>
                  <li><button onClick={() => handleNavigate('/customer/orders')} className="text-blue-600 hover:underline">Siparişlerim</button></li>
                  <li><button onClick={() => handleNavigate('/customer/profile')} className="text-blue-600 hover:underline">Profil Bilgileri</button></li>
                </>
              ) : (
                <li className="text-gray-400">Giriş gerekli (Müşteri)</li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="font-medium text-yellow-800">Test Modu Bilgisi</h3>
          <p className="text-sm text-yellow-700">
            Bu sayfa yalnızca test amaçlıdır. Token yönetimi, normal giriş sayfasından farklı çalışabilir.
            API (/api/auth/test-login) backend tarafında çalışıyor olsa da, tarayıcı çerezleri veya CORS
            sorunları nedeniyle frontend navigasyonu problemleri yaşanabilir.
          </p>
        </div>
      </div>

      {/* Debug Console */}
      <div className="mt-8 bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Hata Ayıklama Araçları</h2>
        <div className="space-y-2">
          <button 
            onClick={() => console.log('Current token:', localStorage.getItem('token'))}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Token'ı Konsola Yazdır
          </button>
          <button 
            onClick={() => console.log('Current cookies:', document.cookie)}
            className="ml-2 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Çerezleri Konsola Yazdır
          </button>
          <button 
            onClick={() => console.log('User object:', localStorage.getItem('user'))}
            className="ml-2 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Kullanıcı Bilgisini Yazdır
          </button>
        </div>
      </div>
    </div>
  );
} 