"use client";

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

interface BusinessMedia {
  logo?: string;
  coverPhoto?: string;
}

export default function MediaUploadForm() {
  const [media, setMedia] = useState<BusinessMedia>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [uploading, setUploading] = useState<{ logo: boolean; cover: boolean }>({
    logo: false,
    cover: false,
  });

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // İşletme medya bilgilerini yükle
  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Oturum bilgisi bulunamadı');
          return;
        }

        const response = await axios.get('/api/business/settings/media', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.business) {
          setMedia({
            logo: response.data.business.logo,
            coverPhoto: response.data.business.coverPhoto,
          });
        }
      } catch (error) {
        console.error('Medya bilgileri alınırken hata:', error);
        toast.error('Medya bilgileri yüklenemedi');
      } finally {
        setLoadingData(false);
      }
    };

    fetchMedia();
  }, []);

  // Dosya yükleme işlemi
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'coverPhoto'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya boyutu 5MB\'dan küçük olmalıdır');
      return;
    }

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      toast.error('Sadece görsel dosyaları yükleyebilirsiniz');
      return;
    }

    const isLogo = type === 'logo';
    setUploading({ ...uploading, [isLogo ? 'logo' : 'cover']: true });

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Oturum bilgisi bulunamadı');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await axios.post('/api/business/settings/media', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.url) {
        setMedia((prev) => ({
          ...prev,
          [type]: response.data.url,
        }));
        toast.success(
          isLogo ? 'Logo başarıyla yüklendi' : 'Kapak fotoğrafı başarıyla yüklendi'
        );
      }
    } catch (error: any) {
      console.error('Dosya yüklenirken hata:', error);
      const errorMessage =
        error.response?.data?.error || 'Dosya yüklenirken bir hata oluştu';
      toast.error(errorMessage);
    } finally {
      setUploading({ ...uploading, [isLogo ? 'logo' : 'cover']: false });
      // Input değerini sıfırla
      if (isLogo && logoInputRef.current) {
        logoInputRef.current.value = '';
      } else if (!isLogo && coverInputRef.current) {
        coverInputRef.current.value = '';
      }
    }
  };

  // Dosya silme işlemi
  const handleDeleteFile = async (type: 'logo' | 'coverPhoto') => {
    const isLogo = type === 'logo';
    const confirmText = isLogo
      ? 'İşletme logosunu silmek istediğinize emin misiniz?'
      : 'Kapak fotoğrafını silmek istediğinize emin misiniz?';

    if (!window.confirm(confirmText)) return;

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Oturum bilgisi bulunamadı');
        return;
      }

      await axios.delete(`/api/business/settings/media?type=${type}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMedia((prev) => ({
        ...prev,
        [type]: undefined,
      }));

      toast.success(
        isLogo ? 'Logo başarıyla silindi' : 'Kapak fotoğrafı başarıyla silindi'
      );
    } catch (error: any) {
      console.error('Dosya silinirken hata:', error);
      const errorMessage =
        error.response?.data?.error || 'Dosya silinirken bir hata oluştu';
      toast.error(errorMessage);
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
    <div className="space-y-8">
      <h2 className="text-lg font-medium text-gray-900">Görsel Yönetimi</h2>
      <p className="text-sm text-gray-500">
        İşletmenizin logo ve kapak fotoğrafını yönetin. Önerilen boyutlar: Logo (1:1), Kapak
        Fotoğrafı (16:9).
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Logo Upload Section */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="font-medium text-gray-900 mb-2">Logo</h3>
          <p className="text-sm text-gray-500 mb-4">
            Önerilen: Kare formatta (1:1), PNG veya JPEG, şeffaf arka plan tercih edilir.
          </p>

          <div className="mb-4 flex items-center justify-center bg-white border rounded-md overflow-hidden relative h-40 w-40 mx-auto">
            {media.logo ? (
              <Image
                src={media.logo}
                alt="İşletme logosu"
                width={160}
                height={160}
                className="object-contain"
              />
            ) : (
              <div className="text-center p-4">
                <svg
                  className="mx-auto h-12 w-12 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-500">Logo yüklenmemiş</p>
              </div>
            )}
          </div>

          <div className="flex flex-col space-y-2">
            <input
              type="file"
              id="logo-upload"
              ref={logoInputRef}
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'logo')}
              className="sr-only"
            />
            <label
              htmlFor="logo-upload"
              className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer text-center ${
                uploading.logo ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {uploading.logo ? 'Yükleniyor...' : 'Logo Yükle'}
            </label>
            {media.logo && (
              <button
                type="button"
                onClick={() => handleDeleteFile('logo')}
                disabled={loading}
                className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logoyu Sil
              </button>
            )}
          </div>
        </div>

        {/* Cover Photo Upload Section */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="font-medium text-gray-900 mb-2">Kapak Fotoğrafı</h3>
          <p className="text-sm text-gray-500 mb-4">
            Önerilen: Geniş formatta (16:9), yüksek kaliteli görsel, minimum 1200x675 piksel.
          </p>

          <div className="mb-4 flex items-center justify-center bg-white border rounded-md overflow-hidden relative h-40 w-full mx-auto">
            {media.coverPhoto ? (
              <Image
                src={media.coverPhoto}
                alt="Kapak fotoğrafı"
                fill
                className="object-cover"
              />
            ) : (
              <div className="text-center p-4">
                <svg
                  className="mx-auto h-12 w-12 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-500">Kapak fotoğrafı yüklenmemiş</p>
              </div>
            )}
          </div>

          <div className="flex flex-col space-y-2">
            <input
              type="file"
              id="cover-upload"
              ref={coverInputRef}
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'coverPhoto')}
              className="sr-only"
            />
            <label
              htmlFor="cover-upload"
              className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer text-center ${
                uploading.cover ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {uploading.cover ? 'Yükleniyor...' : 'Kapak Fotoğrafı Yükle'}
            </label>
            {media.coverPhoto && (
              <button
                type="button"
                onClick={() => handleDeleteFile('coverPhoto')}
                disabled={loading}
                className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Kapak Fotoğrafını Sil
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="border-t pt-6 mt-8">
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Yüklenen görseller otomatik olarak ölçeklendirilir ve optimize edilir.
                Maksimum dosya boyutu: 5MB.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 