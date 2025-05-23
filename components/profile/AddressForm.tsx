import React, { useState } from 'react';
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
}: {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
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
        className={`w-full p-2 border ${
          error ? 'border-red-500' : 'border-gray-300'
        } rounded-md ${disabled ? 'bg-gray-100' : ''}`}
      />
    )}
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
);

// Adres formu bileşeni
interface AddressFormProps {
  address?: any;
  onSuccess?: (data: any) => void;
  onCancel?: () => void;
}

export default function AddressForm({ address, onSuccess, onCancel }: AddressFormProps) {
  const [formData, setFormData] = useState({
    title: address?.title || '',
    firstName: address?.firstName || '',
    lastName: address?.lastName || '',
    addressLine1: address?.addressLine1 || '',
    addressLine2: address?.addressLine2 || '',
    city: address?.city || '',
    state: address?.state || '',
    postalCode: address?.postalCode || '',
    country: address?.country || 'Türkiye',
    phone: address?.phone || '',
    notes: address?.notes || '',
    isDefault: address?.isDefault || false,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Hata mesajını temizle
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Adres başlığı gereklidir';
    }
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Ad gereklidir';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Soyad gereklidir';
    }
    
    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = 'Adres satırı gereklidir';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'Şehir gereklidir';
    }
    
    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'Posta kodu gereklidir';
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
        toast.error('Oturum açmanız gerekiyor');
        setLoading(false);
        return;
      }
      
      let response;
      
      if (address?.id) {
        // Güncelleme işlemi
        response = await axios.put('/api/customer/address', {
          id: address.id,
          ...formData
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        toast.success('Adres başarıyla güncellendi');
      } else {
        // Yeni adres ekleme
        response = await axios.post('/api/customer/address', formData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        toast.success('Adres başarıyla eklendi');
      }
      
      if (onSuccess) {
        onSuccess(response.data.address);
      }
      
      setLoading(false);
    } catch (error: any) {
      console.error('Adres kaydedilirken hata:', error);
      
      const errorMessage = error.response?.data?.error || 'Adres kaydedilemedi';
      toast.error(errorMessage);
      
      if (error.response?.data?.details) {
        const fieldErrors = error.response.data.details;
        const formattedErrors: Record<string, string> = {};
        
        Object.entries(fieldErrors).forEach(([field, errorObj]: [string, any]) => {
          formattedErrors[field] = errorObj._errors?.join(', ') || 'Geçersiz değer';
        });
        
        setErrors(formattedErrors);
      }
      
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Adres Başlığı"
          id="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Örn: Ev, İş, Yazlık"
          required
          error={errors.title}
        />
        
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Ad"
            id="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            error={errors.firstName}
          />
          
          <FormField
            label="Soyad"
            id="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            error={errors.lastName}
          />
        </div>
        
        <div className="md:col-span-2">
          <FormField
            label="Adres Satırı 1"
            id="addressLine1"
            value={formData.addressLine1}
            onChange={handleChange}
            placeholder="Sokak, Mahalle, Bina No, Daire No"
            required
            error={errors.addressLine1}
          />
        </div>
        
        <div className="md:col-span-2">
          <FormField
            label="Adres Satırı 2"
            id="addressLine2"
            value={formData.addressLine2}
            onChange={handleChange}
            placeholder="Ek adres bilgisi"
            error={errors.addressLine2}
          />
        </div>
        
        <FormField
          label="Şehir"
          id="city"
          value={formData.city}
          onChange={handleChange}
          required
          error={errors.city}
        />
        
        <FormField
          label="İlçe/Semt"
          id="state"
          value={formData.state}
          onChange={handleChange}
          error={errors.state}
        />
        
        <FormField
          label="Posta Kodu"
          id="postalCode"
          value={formData.postalCode}
          onChange={handleChange}
          required
          error={errors.postalCode}
        />
        
        <FormField
          label="Ülke"
          id="country"
          value={formData.country}
          onChange={handleChange}
          error={errors.country}
        />
        
        <FormField
          label="Telefon"
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          placeholder="(555) 123-4567"
          error={errors.phone}
        />
        
        <div className="md:col-span-2">
          <FormField
            label="Notlar"
            id="notes"
            type="textarea"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Teslimat için özel notlar veya talimatlar"
            error={errors.notes}
          />
        </div>
        
        <div className="md:col-span-2 flex items-center mb-4">
          <input
            type="checkbox"
            id="isDefault"
            name="isDefault"
            checked={formData.isDefault}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
            Bu adresi varsayılan olarak ayarla
          </label>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            disabled={loading}
          >
            İptal
          </button>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
        >
          {loading
            ? address?.id
              ? 'Güncelleniyor...'
              : 'Ekleniyor...'
            : address?.id
              ? 'Güncelle'
              : 'Ekle'}
        </button>
      </div>
    </form>
  );
} 