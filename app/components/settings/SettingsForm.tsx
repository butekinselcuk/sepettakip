'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface SettingsFormProps {
  onUpdate?: (data: any) => void;
}

export default function SettingsForm({ onUpdate }: SettingsFormProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    preferences: {
      language: 'tr',
      darkMode: false,
      newsletter: true,
    },
    privacy: {
      shareData: false,
      locationTracking: true,
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchUserSettings = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth/login');
          return;
        }

        const response = await axios.get('/api/users/settings', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const userData = response.data;
        setUser(userData);
        
        // If we have user settings data, update the form
        if (userData?.settings) {
          setFormData(userData.settings);
        }
      } catch (err) {
        console.error('Kullanıcı ayarları alınamadı:', err);
        setError('Ayarlar yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserSettings();
  }, [router]);

  const handleCheckboxChange = (category: string, setting: string) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: !prev[category as keyof typeof prev][setting as any]
      }
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    const [category, setting] = name.split('.');
    
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setError('');
      const token = localStorage.getItem('token');
      
      const response = await axios.put('/api/users/settings', { settings: formData }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setSuccessMessage('Ayarlar başarıyla güncellendi');
      
      if (onUpdate) {
        onUpdate(response.data);
      }
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Ayarlar güncellenirken hata:', err);
      setError('Ayarlar güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="text-center">
          <div className="spinner"></div>
          <p className="mt-2 text-gray-600">Ayarlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-4">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-600">
          {successMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-8">
          {/* Bildirim Ayarları */}
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Bildirim Ayarları</h3>
            <p className="mt-1 text-sm text-gray-500">Sistem bildirimlerinin nasıl alınacağını seçin.</p>
            
            <div className="mt-4 space-y-4">
              <div className="flex items-center">
                <input
                  id="notifications.email"
                  name="notifications.email"
                  type="checkbox"
                  checked={formData.notifications.email}
                  onChange={() => handleCheckboxChange('notifications', 'email')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="notifications.email" className="ml-3 block text-sm font-medium text-gray-700">
                  E-posta bildirimleri
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="notifications.push"
                  name="notifications.push"
                  type="checkbox"
                  checked={formData.notifications.push}
                  onChange={() => handleCheckboxChange('notifications', 'push')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="notifications.push" className="ml-3 block text-sm font-medium text-gray-700">
                  Push bildirimleri
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="notifications.sms"
                  name="notifications.sms"
                  type="checkbox"
                  checked={formData.notifications.sms}
                  onChange={() => handleCheckboxChange('notifications', 'sms')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="notifications.sms" className="ml-3 block text-sm font-medium text-gray-700">
                  SMS bildirimleri
                </label>
              </div>
            </div>
          </div>
          
          {/* Tercihler */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Uygulama Tercihleri</h3>
            <p className="mt-1 text-sm text-gray-500">Uygulama deneyiminizi kişiselleştirin.</p>
            
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="preferences.language" className="block text-sm font-medium text-gray-700 mb-1">Dil</label>
                <select
                  id="preferences.language"
                  name="preferences.language"
                  value={formData.preferences.language}
                  onChange={handleSelectChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="tr">Türkçe</option>
                  <option value="en">English</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  id="preferences.darkMode"
                  name="preferences.darkMode"
                  type="checkbox"
                  checked={formData.preferences.darkMode}
                  onChange={() => handleCheckboxChange('preferences', 'darkMode')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="preferences.darkMode" className="ml-3 block text-sm font-medium text-gray-700">
                  Karanlık mod
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="preferences.newsletter"
                  name="preferences.newsletter"
                  type="checkbox"
                  checked={formData.preferences.newsletter}
                  onChange={() => handleCheckboxChange('preferences', 'newsletter')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="preferences.newsletter" className="ml-3 block text-sm font-medium text-gray-700">
                  Haber bülteni ve kampanyaları al
                </label>
              </div>
            </div>
          </div>
          
          {/* Gizlilik */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Gizlilik Ayarları</h3>
            <p className="mt-1 text-sm text-gray-500">Gizlilik ve veri paylaşımı tercihlerinizi ayarlayın.</p>
            
            <div className="mt-4 space-y-4">
              <div className="flex items-center">
                <input
                  id="privacy.shareData"
                  name="privacy.shareData"
                  type="checkbox"
                  checked={formData.privacy.shareData}
                  onChange={() => handleCheckboxChange('privacy', 'shareData')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="privacy.shareData" className="ml-3 block text-sm font-medium text-gray-700">
                  Kişiselleştirilmiş reklamlar için veri paylaşımı
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="privacy.locationTracking"
                  name="privacy.locationTracking"
                  type="checkbox"
                  checked={formData.privacy.locationTracking}
                  onChange={() => handleCheckboxChange('privacy', 'locationTracking')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="privacy.locationTracking" className="ml-3 block text-sm font-medium text-gray-700">
                  Konum takibi
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <button
            type="submit"
            disabled={isSaving}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isSaving ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
} 