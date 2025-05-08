import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Kullanıcı ayarlarını düzenlemek için form bileşeni
 */
interface SettingsFormProps {
  onUpdate?: (data: any) => void;
}

export default function SettingsForm({ onUpdate }: SettingsFormProps) {
  const [formData, setFormData] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    preferences: {
      language: 'tr',
      darkMode: false,
      newsletter: true
    },
    privacy: {
      shareData: false,
      locationTracking: true
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Kullanıcı ayarlarını API'den al
  useEffect(() => {
    fetchUserSettings();
  }, []);

  const fetchUserSettings = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        setError('Oturum açmanız gerekiyor');
        setLoading(false);
        return;
      }
      
      const response = await axios.get('/api/users/settings', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Kullanıcı ayarları alındı:', response.data);
      
      if (response.data && response.data.settings) {
        setFormData(response.data.settings);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Kullanıcı ayarları alınırken hata:', err);
      setError('Kullanıcı ayarları alınamadı');
      setLoading(false);
    }
  };

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
      setLoading(true);
      setError('');
      setSuccess('');
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        setError('Oturum açmanız gerekiyor');
        setLoading(false);
        return;
      }
      
      const response = await axios.put('/api/users/settings', { settings: formData }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Ayarlar güncellendi:', response.data);
      setSuccess('Ayarlar başarıyla güncellendi');
      
      if (onUpdate) {
        onUpdate(response.data);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Ayarlar güncellenirken hata:', err);
      setError('Ayarlar güncellenemedi');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Kullanıcı Ayarları</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-8">
          {/* Bildirim Ayarları */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Bildirim Ayarları</h3>
            <p className="text-sm text-gray-600 mb-4">
              Hangi bildirimler almak istediğinizi seçin.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notifications.email"
                  name="notifications.email"
                  checked={formData.notifications.email}
                  onChange={() => handleCheckboxChange('notifications', 'email')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="notifications.email" className="ml-2 block text-sm text-gray-700">
                  E-posta bildirimleri
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notifications.push"
                  name="notifications.push"
                  checked={formData.notifications.push}
                  onChange={() => handleCheckboxChange('notifications', 'push')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="notifications.push" className="ml-2 block text-sm text-gray-700">
                  Anlık bildirimler
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notifications.sms"
                  name="notifications.sms"
                  checked={formData.notifications.sms}
                  onChange={() => handleCheckboxChange('notifications', 'sms')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="notifications.sms" className="ml-2 block text-sm text-gray-700">
                  SMS bildirimleri
                </label>
              </div>
            </div>
          </div>
          
          {/* Tercihler */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Tercihler</h3>
            <p className="text-sm text-gray-600 mb-4">
              Uygulama tercihlerinizi düzenleyin.
            </p>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="preferences.language" className="block text-sm font-medium text-gray-700 mb-1">
                  Dil
                </label>
                <select
                  id="preferences.language"
                  name="preferences.language"
                  value={formData.preferences.language}
                  onChange={handleSelectChange}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="tr">Türkçe</option>
                  <option value="en">English</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="preferences.darkMode"
                  name="preferences.darkMode"
                  checked={formData.preferences.darkMode}
                  onChange={() => handleCheckboxChange('preferences', 'darkMode')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="preferences.darkMode" className="ml-2 block text-sm text-gray-700">
                  Karanlık mod
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="preferences.newsletter"
                  name="preferences.newsletter"
                  checked={formData.preferences.newsletter}
                  onChange={() => handleCheckboxChange('preferences', 'newsletter')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="preferences.newsletter" className="ml-2 block text-sm text-gray-700">
                  Bülten ve özel teklifler almak istiyorum
                </label>
              </div>
            </div>
          </div>
          
          {/* Gizlilik */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Gizlilik</h3>
            <p className="text-sm text-gray-600 mb-4">
              Gizlilik ve veri paylaşım tercihlerinizi yönetin.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="privacy.shareData"
                  name="privacy.shareData"
                  checked={formData.privacy.shareData}
                  onChange={() => handleCheckboxChange('privacy', 'shareData')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="privacy.shareData" className="ml-2 block text-sm text-gray-700">
                  Verilerimi geliştiriciler ile paylaş
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="privacy.locationTracking"
                  name="privacy.locationTracking"
                  checked={formData.privacy.locationTracking}
                  onChange={() => handleCheckboxChange('privacy', 'locationTracking')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="privacy.locationTracking" className="ml-2 block text-sm text-gray-700">
                  Konum izinleri
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
} 