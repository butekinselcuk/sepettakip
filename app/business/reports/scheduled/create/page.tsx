'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type ReportType = 'ORDERS' | 'DELIVERIES' | 'REVENUE' | 'USERS';
type ReportFormat = 'PDF' | 'CSV' | 'EXCEL';
type ReportFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export default function CreateScheduledReportPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<ReportFrequency>('WEEKLY');
  const [type, setType] = useState<ReportType>('ORDERS');
  const [format, setFormat] = useState<ReportFormat>('PDF');
  const [region, setRegion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [dayRange, setDayRange] = useState(30); // Rapor için son X gün

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      router.push('/auth/login');
      return;
    }
    
    const userData = JSON.parse(user);
    if (userData.role !== 'BUSINESS') {
      router.push('/auth/login');
      return;
    }
    
    setIsAuthenticated(true);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/reports/scheduled', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          description,
          frequency,
          type,
          format,
          isActive,
          dayRange,
          filters: {
            region: region || undefined
          },
          recipients
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Planlanmış rapor oluşturulurken bir hata oluştu');
      }
      
      setSuccess(true);
      setTimeout(() => {
        router.push('/business/reports');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addRecipient = () => {
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !recipients.includes(email)) {
      setRecipients([...recipients, email]);
      setEmail('');
    } else {
      setError('Geçerli ve benzersiz bir e-posta adresi girin');
    }
  };

  const removeRecipient = (emailToRemove: string) => {
    setRecipients(recipients.filter(email => email !== emailToRemove));
  };

  if (!isAuthenticated) {
    return <div className="flex justify-center items-center h-screen">Yükleniyor...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Planlanmış Rapor Oluştur</h1>
          <button
            onClick={() => router.push('/business/reports')}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Geri Dön
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Planlanmış rapor başarıyla oluşturuldu! Raporlar sayfasına yönlendiriliyorsunuz...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rapor Başlığı *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Rapor başlığı"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Açıklama
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Rapor açıklaması"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rapor Sıklığı *
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as ReportFrequency)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="DAILY">Günlük</option>
                <option value="WEEKLY">Haftalık</option>
                <option value="MONTHLY">Aylık</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rapor Kapsamı (Son X Gün) *
              </label>
              <input
                type="number"
                value={dayRange}
                onChange={(e) => setDayRange(parseInt(e.target.value))}
                min={1}
                max={365}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rapor Türü *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ReportType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="ORDERS">Siparişler</option>
                <option value="DELIVERIES">Teslimatlar</option>
                <option value="REVENUE">Gelir</option>
                <option value="USERS">Kullanıcılar</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rapor Formatı *
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as ReportFormat)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="PDF">PDF</option>
                <option value="CSV">CSV</option>
                <option value="EXCEL">Excel</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bölge (Opsiyonel)
            </label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Bölge (örn. İstanbul, Ankara)"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Raporu E-posta ile Gönder (Opsiyonel)
            </label>
            <div className="flex space-x-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="E-posta adresi"
              />
              <button
                type="button"
                onClick={addRecipient}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Ekle
              </button>
            </div>
            {recipients.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-700 mb-1">Alıcılar:</p>
                <div className="flex flex-wrap gap-2">
                  {recipients.map((email) => (
                    <div key={email} className="bg-gray-100 px-2 py-1 rounded-md flex items-center">
                      <span className="text-sm">{email}</span>
                      <button
                        type="button"
                        onClick={() => removeRecipient(email)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Raporu hemen aktifleştir
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Oluşturuluyor...' : 'Planlanmış Rapor Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 