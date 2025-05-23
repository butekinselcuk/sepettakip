"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Form alanı bileşeni
const FormField = ({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  error,
  maxLength,
  rows,
}: {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  value?: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  required?: boolean;
  error?: string;
  maxLength?: number;
  rows?: number;
}) => {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          id={id}
          name={id}
          value={value || ''}
          onChange={onChange}
          rows={rows || 3}
          maxLength={maxLength}
          placeholder={placeholder}
          className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
        />
      ) : type === 'select' ? (
        <select
          id={id}
          name={id}
          value={value || ''}
          onChange={onChange}
          className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
        >
          <option value="">Seçiniz</option>
          <option value="RESTAURANT">Restoran</option>
          <option value="MARKET">Market</option>
          <option value="CAFE">Kafe</option>
          <option value="PHARMACY">Eczane</option>
          <option value="OTHER">Diğer</option>
        </select>
      ) : (
        <input
          type={type}
          id={id}
          name={id}
          value={value || ''}
          onChange={onChange}
          maxLength={maxLength}
          placeholder={placeholder}
          className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
        />
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

interface BusinessData {
  name?: string;
  description?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  website?: string;
  businessType?: string;
  taxId?: string;
  bankIban?: string;
  logo?: string;
  coverPhoto?: string;
  id?: string;
}

interface GeneralSettingsFormProps {
  initialData?: BusinessData;
}

export default function GeneralSettingsForm({ initialData }: GeneralSettingsFormProps) {
  const [formData, setFormData] = useState<BusinessData>({
    name: '',
    description: '',
    address: '',
    phoneNumber: '',
    email: '',
    website: '',
    businessType: '',
    taxId: '',
    bankIban: '',
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // İşletme bilgilerini yükle
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        address: initialData.address || '',
        phoneNumber: initialData.phoneNumber || '',
        email: initialData.email || '',
        website: initialData.website || '',
        businessType: initialData.businessType || '',
        taxId: initialData.taxId || '',
        bankIban: initialData.bankIban || '',
      });
      setLoadingData(false);
    } else {
      const fetchBusiness = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            toast.error('Oturum bilgisi bulunamadı');
            return;
          }

          const response = await axios.get('/api/business/settings', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.data.business) {
            setFormData({
              name: response.data.business.name || '',
              description: response.data.business.description || '',
              address: response.data.business.address || '',
              phoneNumber: response.data.business.phoneNumber || '',
              email: response.data.business.email || '',
              website: response.data.business.website || '',
              businessType: response.data.business.businessType || '',
              taxId: response.data.business.taxId || '',
              bankIban: response.data.business.bankIban || '',
            });
          }
        } catch (error) {
          console.error('İşletme bilgileri alınırken hata:', error);
          toast.error('İşletme bilgileri yüklenemedi');
        } finally {
          setLoadingData(false);
        }
      };

      fetchBusiness();
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Hata mesajını temizle
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Zorunlu alanların kontrolü
    if (!formData.name?.trim()) {
      newErrors.name = 'İşletme adı zorunludur';
    }

    if (!formData.address?.trim()) {
      newErrors.address = 'Adres zorunludur';
    }

    if (!formData.phoneNumber?.trim()) {
      newErrors.phoneNumber = 'Telefon numarası zorunludur';
    } else if (!/^\+?[0-9]{10,15}$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Geçerli bir telefon numarası giriniz';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'E-posta adresi zorunludur';
    } else if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz';
    }

    if (formData.website && !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(formData.website)) {
      newErrors.website = 'Geçerli bir web sitesi adresi giriniz';
    }

    if (!formData.businessType) {
      newErrors.businessType = 'İşletme türü zorunludur';
    }

    // IBAN formatı kontrolü (örnek olarak)
    if (formData.bankIban && !/^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/.test(formData.bankIban)) {
      newErrors.bankIban = 'Geçerli bir IBAN giriniz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Lütfen formdaki hataları düzeltin');
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

      await axios.put('/api/business/settings', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success('İşletme bilgileri başarıyla güncellendi');
    } catch (error: any) {
      console.error('İşletme bilgileri güncellenirken hata:', error);

      const errorMessage =
        error.response?.data?.error || 'İşletme bilgileri güncellenirken bir hata oluştu';
      toast.error(errorMessage);

      // API'den gelen doğrulama hataları varsa
      if (error.response?.data?.validationErrors) {
        setErrors(error.response.data.validationErrors);
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
      <h2 className="text-lg font-medium text-gray-900 mb-2">Genel İşletme Bilgileri</h2>
      <p className="text-sm text-gray-500 mb-6">
        İşletmeniz hakkında temel bilgileri düzenleyin. Bu bilgiler müşterilerinize gösterilecektir.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <FormField
          label="İşletme Adı"
          id="name"
          value={formData.name}
          onChange={handleChange}
          required
          error={errors.name}
          maxLength={100}
        />

        <FormField
          label="İşletme Türü"
          id="businessType"
          type="select"
          value={formData.businessType}
          onChange={handleChange}
          required
          error={errors.businessType}
        />

        <FormField
          label="Telefon Numarası"
          id="phoneNumber"
          type="tel"
          value={formData.phoneNumber}
          onChange={handleChange}
          required
          error={errors.phoneNumber}
          maxLength={20}
        />

        <FormField
          label="E-posta Adresi"
          id="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          error={errors.email}
          maxLength={100}
        />

        <FormField
          label="Web Sitesi"
          id="website"
          type="url"
          value={formData.website}
          onChange={handleChange}
          error={errors.website}
          maxLength={255}
        />

        <FormField
          label="Vergi Numarası / T.C. Kimlik No"
          id="taxId"
          value={formData.taxId}
          onChange={handleChange}
          error={errors.taxId}
          maxLength={20}
        />

        <FormField
          label="Banka IBAN"
          id="bankIban"
          value={formData.bankIban}
          onChange={handleChange}
          error={errors.bankIban}
          maxLength={50}
        />
      </div>

      <div className="mt-4">
        <FormField
          label="Adres"
          id="address"
          type="textarea"
          value={formData.address}
          onChange={handleChange}
          required
          error={errors.address}
          maxLength={500}
          rows={2}
        />

        <FormField
          label="İşletme Açıklaması"
          id="description"
          type="textarea"
          value={formData.description}
          onChange={handleChange}
          error={errors.description}
          maxLength={1000}
          rows={4}
        />
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
        >
          {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
        </button>
      </div>
    </form>
  );
} 