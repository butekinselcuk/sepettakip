import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from '@/app/components/ui/use-toast';
import AddressForm from './AddressForm';

export interface Address {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
  notes?: string;
  isDefault: boolean;
  isActive: boolean;
  customerId: string;
  createdAt: string;
  updatedAt: string;
}

interface AddressListProps {
  className?: string;
}

export default function AddressList({ className = '' }: AddressListProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editAddress, setEditAddress] = useState<Address | null>(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Oturum açmanız gerekiyor');
        setLoading(false);
        return;
      }

      const response = await axios.get('/api/customer/address', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setAddresses(response.data.addresses || []);
      setLoading(false);
    } catch (error) {
      console.error('Adresler alınırken hata:', error);
      setError('Adresler alınamadı');
      setLoading(false);
    }
  };

  const handleAddSuccess = (newAddress: Address) => {
    setAddresses(prev => {
      // Eğer yeni adres varsayılan ise, diğerlerini varsayılan olmaktan çıkar
      if (newAddress.isDefault) {
        prev = prev.map(address => ({
          ...address,
          isDefault: false
        }));
      }
      return [...prev, newAddress];
    });
    setShowAddForm(false);
  };

  const handleEditSuccess = (updatedAddress: Address) => {
    setAddresses(prev => {
      // Eğer güncellenmiş adres varsayılan ise, diğerlerini varsayılan olmaktan çıkar
      if (updatedAddress.isDefault) {
        prev = prev.map(address => ({
          ...address,
          isDefault: address.id === updatedAddress.id ? true : false
        }));
      } else {
        prev = prev.map(address => 
          address.id === updatedAddress.id ? updatedAddress : address
        );
      }
      return prev;
    });
    setEditAddress(null);
  };

  const handleEdit = (address: Address) => {
    setEditAddress(address);
    setShowAddForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu adresi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Hata",
          description: "Oturum açmanız gerekiyor",
          variant: "destructive"
        });
        return;
      }

      await axios.delete(`/api/customer/address/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast({
        title: "Başarılı",
        description: "Adres başarıyla silindi"
      });
      setAddresses(prev => prev.filter(address => address.id !== id));
    } catch (error) {
      console.error('Adres silinirken hata:', error);
      toast({
        title: "Hata",
        description: "Adres silinemedi",
        variant: "destructive"
      });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Hata",
          description: "Oturum açmanız gerekiyor",
          variant: "destructive"
        });
        return;
      }

      const response = await axios.patch(`/api/customer/address/${id}/default`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const updatedAddress = response.data.address;
      
      setAddresses(prev => 
        prev.map(address => ({
          ...address,
          isDefault: address.id === id
        }))
      );

      toast({
        title: "Başarılı",
        description: "Varsayılan adres güncellendi"
      });
    } catch (error) {
      console.error('Varsayılan adres ayarlanırken hata:', error);
      toast({
        title: "Hata",
        description: "Varsayılan adres değiştirilemedi",
        variant: "destructive"
      });
    }
  };

  const formatAddress = (address: Address) => {
    const parts = [
      address.addressLine1,
      address.addressLine2,
      `${address.city}${address.state ? `, ${address.state}` : ''}`,
      `${address.postalCode}`,
      address.country
    ].filter(Boolean);

    return parts.join(', ');
  };

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Kayıtlı Adreslerim</h2>
          {!showAddForm && !editAddress && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Yeni Adres Ekle
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {showAddForm && (
          <div className="mb-8 border rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Yeni Adres Ekle</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <AddressForm onSuccess={handleAddSuccess} onCancel={() => setShowAddForm(false)} />
          </div>
        )}

        {editAddress && (
          <div className="mb-8 border rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Adresi Düzenle</h3>
              <button
                onClick={() => setEditAddress(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <AddressForm address={editAddress} onSuccess={handleEditSuccess} onCancel={() => setEditAddress(null)} />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="mt-2 text-gray-500">Henüz kayıtlı adresiniz bulunmuyor.</p>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Adres Ekle
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`border rounded-lg p-4 ${
                  address.isDefault ? 'bg-blue-50 border-blue-200' : 'bg-white'
                }`}
              >
                <div className="flex justify-between">
                  <div>
                    <div className="flex items-center mb-2">
                      <h3 className="font-medium text-gray-900">{address.title}</h3>
                      {address.isDefault && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Varsayılan
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 mb-1">
                      {address.firstName} {address.lastName}
                    </p>
                    <p className="text-gray-600 text-sm mb-2">{formatAddress(address)}</p>
                    {address.phone && <p className="text-gray-600 text-sm">Tel: {address.phone}</p>}
                    {address.notes && (
                      <p className="text-gray-500 text-sm mt-2 italic">Not: {address.notes}</p>
                    )}
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => handleEdit(address)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        className="text-gray-600 hover:text-gray-800"
                        title="Varsayılan olarak ayarla"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.414L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 