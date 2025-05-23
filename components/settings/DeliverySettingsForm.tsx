"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Form alanı bileşeni
const FormField = ({
  label,
  id,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  required = false,
  disabled = false,
  className = '',
  error = '',
  min,
  max,
  step,
}: {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
}) => (
  <div className={`mb-4 ${className}`}>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {type === 'textarea' ? (
      <textarea
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`w-full p-2 border ${
          error ? 'border-red-500' : 'border-gray-300'
        } rounded-md ${disabled ? 'bg-gray-100' : ''}`}
        rows={3}
      />
    ) : (
      <input
        type={type}
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={`w-full p-2 border ${
          error ? 'border-red-500' : 'border-gray-300'
        } rounded-md ${disabled ? 'bg-gray-100' : ''}`}
      />
    )}
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
);

export default function DeliverySettingsForm() {
  const [formData, setFormData] = useState({
    deliveryRadius: 5,
    deliveryFee: 0,
    minimumOrderAmount: 0,
    freeDeliveryThreshold: 100,
    estimatedDeliveryTime: 30,
    deliveryNotes: '',
    deliveryOptions: ['STANDARD'],
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Teslimat ayarlarını yükle
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Oturum bilgisi bulunamadı');
          return;
        }

        const response = await axios.get('/api/business/settings/delivery', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const { deliverySettings } = response.data;
        setFormData({
          deliveryRadius: deliverySettings.deliveryRadius || 5,
          deliveryFee: deliverySettings.deliveryFee || 0,
          minimumOrderAmount: deliverySettings.minimumOrderAmount || 0,
          freeDeliveryThreshold: deliverySettings.freeDeliveryThreshold || 100,
          estimatedDeliveryTime: deliverySettings.estimatedDeliveryTime || 30,
          deliveryNotes: deliverySettings.deliveryNotes || '',
          deliveryOptions: deliverySettings.deliveryOptions || ['STANDARD'],
        });
      } catch (error) {
        console.error('Teslimat ayarları alınırken hata:', error);
        toast.error('Teslimat ayarları yüklenemedi');
      } finally {
        setLoadingData(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Sayısal değerler için dönüşüm
    if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Hata mesajını temizle
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.deliveryRadius < 0.1) {
      newErrors.deliveryRadius = 'Teslimat mesafesi en az 0.1 km olmalıdır';
    } else if (formData.deliveryRadius > 30) {
      newErrors.deliveryRadius = 'Teslimat mesafesi en fazla 30 km olabilir';
    }

    if (formData.deliveryFee < 0) {
      newErrors.deliveryFee = 'Teslimat ücreti negatif olamaz';
    }

    if (formData.minimumOrderAmount < 0) {
      newErrors.minimumOrderAmount = 'Minimum sipariş tutarı negatif olamaz';
    }

    if (formData.freeDeliveryThreshold < 0) {
      newErrors.freeDeliveryThreshold = 'Ücretsiz teslimat eşiği negatif olamaz';
    }

    if (formData.estimatedDeliveryTime < 5) {
      newErrors.estimatedDeliveryTime = 'Tahmini teslimat süresi en az 5 dakika olmalıdır';
    } else if (formData.estimatedDeliveryTime > 120) {
      newErrors.estimatedDeliveryTime = 'Tahmini teslimat süresi en fazla 120 dakika olabilir';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Oturum bilgisi bulunamadı');
        setLoading(false);
        return;
      }

      await axios.put('/api/business/settings/delivery', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success('Teslimat ayarları başarıyla güncellendi');
    } catch (error: any) {
      console.error('Teslimat ayarları güncellenirken hata:', error);

      const errorMessage =
        error.response?.data?.error || 'Teslimat ayarları güncellenirken bir hata oluştu';
      toast.error(errorMessage);

      if (error.response?.data?.details) {
        const fieldErrors = error.response.data.details;
        const formattedErrors: Record<string, string> = {};

        Object.entries(fieldErrors).forEach(([field, errorObj]: [string, any]) => {
          formattedErrors[field] = errorObj._errors?.join(', ') || 'Geçersiz değer';
        });

        setErrors(formattedErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-lg font-medium text-gray-900 mb-6">Teslimat Ayarları</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Teslimat Mesafesi (km)"
          id="deliveryRadius"
          type="number"
          value={formData.deliveryRadius}
          onChange={handleChange}
          required
          min={0.1}
          max={30}
          step={0.1}
          error={errors.deliveryRadius}
        />

        <FormField
          label="Teslimat Ücreti (TL)"
          id="deliveryFee"
          type="number"
          value={formData.deliveryFee}
          onChange={handleChange}
          required
          min={0}
          step={0.5}
          error={errors.deliveryFee}
        />

        <FormField
          label="Minimum Sipariş Tutarı (TL)"
          id="minimumOrderAmount"
          type="number"
          value={formData.minimumOrderAmount}
          onChange={handleChange}
          required
          min={0}
          step={1}
          error={errors.minimumOrderAmount}
        />

        <FormField
          label="Ücretsiz Teslimat Eşiği (TL)"
          id="freeDeliveryThreshold"
          type="number"
          value={formData.freeDeliveryThreshold}
          onChange={handleChange}
          min={0}
          step={1}
          error={errors.freeDeliveryThreshold}
        />

        <FormField
          label="Tahmini Teslimat Süresi (dakika)"
          id="estimatedDeliveryTime"
          type="number"
          value={formData.estimatedDeliveryTime}
          onChange={handleChange}
          min={5}
          max={120}
          step={5}
          error={errors.estimatedDeliveryTime}
        />

        <div className="md:col-span-2">
          <FormField
            label="Teslimat Notları"
            id="deliveryNotes"
            type="textarea"
            value={formData.deliveryNotes}
            onChange={handleChange}
            placeholder="Teslimat ile ilgili önemli bilgiler (ör. 'Apartman girişine bırakılabilir')"
            error={errors.deliveryNotes}
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
        >
          {loading ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
        </button>
      </div>
    </form>
  );
} 