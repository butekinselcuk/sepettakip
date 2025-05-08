'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BusinessLayout from '@/app/components/layouts/BusinessLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Upload, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface BusinessProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  description: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export default function BusinessProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    description: '',
  });
  const router = useRouter();

  // Fetch business profile data
  useEffect(() => {
    const fetchBusinessProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth/login');
          return;
        }

        const response = await fetch('/api/business/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Profile data could not be loaded');
        }

        const data = await response.json();
        setProfile(data);
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          address: data.address || '',
          description: data.description || '',
        });
      } catch (err) {
        console.error('Error fetching business profile:', err);
        setError('Failed to load profile data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinessProfile();
  }, [router]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }
      
      const response = await fetch('/api/business/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setSuccess('Profile updated successfully');
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error updating business profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // In a real implementation, you would upload the file to a storage service
    // For now, we'll simulate it with a timeout and a fake URL
    try {
      setIsSaving(true);
      setError(null);
      
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const fakeImageUrl = `https://example.com/images/${Date.now()}_${files[0].name}`;
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }
      
      const response = await fetch('/api/business/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ imageUrl: fakeImageUrl })
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setSuccess('Image uploaded successfully');
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BusinessLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">İşletme Profili</h1>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Hata</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>Başarılı</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Information */}
            <div className="md:col-span-2">
              <form onSubmit={handleSubmit}>
                <Card>
                  <CardHeader>
                    <CardTitle>İşletme Bilgileri</CardTitle>
                    <CardDescription>
                      İşletmenizin temel bilgilerini buradan güncelleyebilirsiniz.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">İşletme Adı</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="İşletme adınızı girin"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">E-posta</Label>
                      <Input
                        id="email"
                        value={profile?.email || ''}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-sm text-gray-500">E-posta adresi değiştirilemez.</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Telefon numaranızı girin"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address">Adres</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="İşletme adresinizi girin"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Açıklama</Label>
                      <Textarea
                        id="description"
                        name="description"
                        rows={4}
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="İşletmenizin kısa bir açıklamasını girin"
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="w-full"
                    >
                      {isSaving ? 'Kaydediliyor...' : 'Profili Güncelle'}
                    </Button>
                  </CardContent>
                </Card>
              </form>
            </div>
            
            {/* Image Upload */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>İşletme Görseli</CardTitle>
                  <CardDescription>
                    İşletmenize ait bir görsel yükleyebilirsiniz.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500 mb-2">PNG, JPG veya GIF formatında bir görsel seçin</p>
                    <Label
                      htmlFor="image-upload"
                      className="cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Görsel Seç
                    </Label>
                    <input
                      id="image-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isSaving}
                    />
                  </div>
                  
                  {profile?.description && profile.description.includes('[Image:') && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-500 mb-1">Yüklenen Görsel:</p>
                      <div className="bg-gray-100 p-2 rounded text-xs overflow-hidden text-ellipsis">
                        {profile.description.match(/\[Image: (.*?)\]/)?.[1] || 'Görsel URL\'i alınamadı'}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Account Information */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Hesap Bilgileri</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Oluşturulma Tarihi:</span>
                      <span>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('tr-TR') : '-'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Son Güncelleme:</span>
                      <span>{profile?.updatedAt ? new Date(profile.updatedAt).toLocaleDateString('tr-TR') : '-'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Puan:</span>
                      <span>{profile?.rating ? `${profile.rating.toFixed(1)} / 5.0` : '-'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </BusinessLayout>
  );
} 