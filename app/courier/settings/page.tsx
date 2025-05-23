'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Save, Bell, Lock, Shield } from "lucide-react";
import axios from 'axios';
import { useAuth } from '@/components/AuthProvider';

interface SettingsForm {
  receiveNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  newDeliveryAlert: boolean;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function CourierSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<SettingsForm>({
    receiveNotifications: true,
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    newDeliveryAlert: true,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const router = useRouter();
  
  // Kullanıcı ayarlarını getir
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          router.push('/auth/login');
          return;
        }
        
        const response = await axios.get('/api/courier/settings', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = response.data;
        setSettings(prev => ({
          ...prev,
          ...data.settings
        }));
        
      } catch (err) {
        console.error('Error fetching courier settings:', err);
        // 404 hatası durumunda varsayılan ayarları kullan
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          console.log('Using default settings');
        } else {
          setError('Ayarlar yüklenemedi. Lütfen daha sonra tekrar deneyin.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    // AuthProvider yüklendikten sonra ayarları getir
    if (!authLoading && user && user.role === 'COURIER') {
      fetchSettings();
    } else if (!authLoading && (!user || user.role !== 'COURIER')) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);
  
  // Form güncelleme işleyicileri
  const handleNotificationChange = (field: keyof SettingsForm) => {
    setSettings(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Bildirim ayarlarını güncelle
  const updateNotificationSettings = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }
      
      const response = await axios.put('/api/courier/settings/notifications', {
        receiveNotifications: settings.receiveNotifications,
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        smsNotifications: settings.smsNotifications,
        newDeliveryAlert: settings.newDeliveryAlert
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 200) {
        setSuccess('Bildirim ayarlarınız başarıyla güncellendi.');
      }
    } catch (err) {
      console.error('Error updating notification settings:', err);
      setError('Bildirim ayarları güncellenirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Şifre değiştir
  const updatePassword = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      
      // Şifre doğrulama
      if (settings.newPassword !== settings.confirmPassword) {
        setError('Yeni şifreler eşleşmiyor.');
        setIsSaving(false);
        return;
      }
      
      if (settings.newPassword.length < 6) {
        setError('Yeni şifre en az 6 karakter olmalıdır.');
        setIsSaving(false);
        return;
      }
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }
      
      const response = await axios.put('/api/auth/change-password', {
        currentPassword: settings.currentPassword,
        newPassword: settings.newPassword
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 200) {
        setSuccess('Şifreniz başarıyla değiştirildi.');
        setSettings(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }
    } catch (err) {
      console.error('Error updating password:', err);
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError('Mevcut şifreniz yanlış.');
      } else {
        setError('Şifre değiştirilirken bir hata oluştu.');
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="mt-4 text-gray-500">Ayarlar yükleniyor...</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Hesap Ayarları</h1>
      
      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Bildirimler
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="h-4 w-4 mr-2" />
            Güvenlik
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Bildirim Ayarları</CardTitle>
              <CardDescription>
                Hangi bildirimleri almak istediğinizi seçin.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Hata</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertTitle className="text-green-800">Başarılı</AlertTitle>
                  <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="receiveNotifications" className="text-base">Bildirimleri Aktifleştir</Label>
                    <p className="text-sm text-gray-500">Tüm bildirimleri açın veya kapatın</p>
                  </div>
                  <Switch
                    id="receiveNotifications"
                    checked={settings.receiveNotifications}
                    onChange={() => handleNotificationChange('receiveNotifications')}
                  />
                </div>
                
                <Separator />
                
                <div className={`space-y-4 ${!settings.receiveNotifications ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailNotifications" className="text-base">E-posta Bildirimleri</Label>
                      <p className="text-sm text-gray-500">Bildirimleri e-posta olarak alın</p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={settings.emailNotifications}
                      onChange={() => handleNotificationChange('emailNotifications')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="pushNotifications" className="text-base">Push Bildirimleri</Label>
                      <p className="text-sm text-gray-500">Bildirimleri anlık olarak alın</p>
                    </div>
                    <Switch
                      id="pushNotifications"
                      checked={settings.pushNotifications}
                      onChange={() => handleNotificationChange('pushNotifications')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="smsNotifications" className="text-base">SMS Bildirimleri</Label>
                      <p className="text-sm text-gray-500">Bildirimleri SMS olarak alın</p>
                    </div>
                    <Switch
                      id="smsNotifications"
                      checked={settings.smsNotifications}
                      onChange={() => handleNotificationChange('smsNotifications')}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="newDeliveryAlert" className="text-base">Yeni Teslimat Bildirimleri</Label>
                      <p className="text-sm text-gray-500">Yeni teslimat ataması yapıldığında bildirim al</p>
                    </div>
                    <Switch
                      id="newDeliveryAlert"
                      checked={settings.newDeliveryAlert}
                      onChange={() => handleNotificationChange('newDeliveryAlert')}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <Button onClick={updateNotificationSettings} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Kaydediliyor
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Kaydet
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Şifre Değiştir</CardTitle>
              <CardDescription>
                Hesabınızın güvenliği için şifrenizi düzenli olarak değiştirin.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Hata</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertTitle className="text-green-800">Başarılı</AlertTitle>
                  <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="currentPassword">Mevcut Şifre</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={settings.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Mevcut şifrenizi girin"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="newPassword">Yeni Şifre</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={settings.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Yeni şifrenizi girin"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={settings.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Yeni şifrenizi tekrar girin"
                  />
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <Button onClick={updatePassword} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Şifre Değiştiriliyor
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Şifreyi Değiştir
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 