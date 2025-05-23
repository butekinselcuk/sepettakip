"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Shield, Lock, Key, User, RefreshCw, Save } from 'lucide-react';
import { useToast } from '@/app/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminSecurity() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('access');

  // Güvenlik ayarları
  const [passwordPolicy, setPasswordPolicy] = useState({
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    expireDays: 90,
  });

  const [accessSettings, setAccessSettings] = useState({
    maxLoginAttempts: 5,
    lockoutDuration: 30, // dakika
    sessionTimeout: 60, // dakika
    enableTwoFactor: false,
  });

  // Ayarları yükle
  useEffect(() => {
    fetchSecuritySettings();
  }, []);

  // Güvenlik ayarlarını getir
  const fetchSecuritySettings = async () => {
    try {
      setLoading(true);
      
      // Normalde burada gerçek bir API çağrısı olur
      // Şimdilik simüle edelim
      setTimeout(() => {
        setLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error("Güvenlik ayarları yüklenirken hata:", error);
      toast({
        id: Date.now().toString(),
        title: "Hata",
        description: "Güvenlik ayarları yüklenirken bir sorun oluştu.",
        type: "error"
      } as any);
      setLoading(false);
    }
  };

  // Şifre politikası değişikliği
  const handlePasswordPolicyChange = (key: string, value: any) => {
    setPasswordPolicy(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Erişim ayarları değişikliği
  const handleAccessSettingsChange = (key: string, value: any) => {
    setAccessSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Ayarları kaydet
  const saveSettings = async () => {
    try {
      setLoading(true);
      
      // Normalde burada gerçek bir API çağrısı olur
      // Şimdilik simüle edelim
      setTimeout(() => {
        toast({
          id: Date.now().toString(),
          title: "Başarılı",
          description: "Güvenlik ayarları başarıyla kaydedildi.",
          type: "success"
        } as any);
        setLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error("Güvenlik ayarları kaydedilirken hata:", error);
      toast({
        id: Date.now().toString(),
        title: "Hata",
        description: "Güvenlik ayarları kaydedilirken bir sorun oluştu.",
        type: "error"
      } as any);
      setLoading(false);
    }
  };

  // Şifre politikası render
  const renderPasswordPolicy = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid gap-2">
            <Label htmlFor="minLength">Minimum Şifre Uzunluğu</Label>
            <Input
              id="minLength"
              type="number"
              min={6}
              max={30}
              value={passwordPolicy.minLength}
              onChange={(e) => handlePasswordPolicyChange('minLength', parseInt(e.target.value) || 8)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="expireDays">Şifre Geçerlilik Süresi (Gün)</Label>
            <Input
              id="expireDays"
              type="number"
              min={0}
              max={365}
              value={passwordPolicy.expireDays}
              onChange={(e) => handlePasswordPolicyChange('expireDays', parseInt(e.target.value) || 90)}
            />
            <p className="text-xs text-muted-foreground">0 = Süresiz</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Switch
              checked={passwordPolicy.requireUppercase}
              onChange={(e) => handlePasswordPolicyChange('requireUppercase', e.target.checked)}
            />
            <Label htmlFor="requireUppercase">Büyük harf zorunlu</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              checked={passwordPolicy.requireLowercase}
              onChange={(e) => handlePasswordPolicyChange('requireLowercase', e.target.checked)}
            />
            <Label htmlFor="requireLowercase">Küçük harf zorunlu</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              checked={passwordPolicy.requireNumbers}
              onChange={(e) => handlePasswordPolicyChange('requireNumbers', e.target.checked)}
            />
            <Label htmlFor="requireNumbers">Sayı zorunlu</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              checked={passwordPolicy.requireSpecialChars}
              onChange={(e) => handlePasswordPolicyChange('requireSpecialChars', e.target.checked)}
            />
            <Label htmlFor="requireSpecialChars">Özel karakter zorunlu</Label>
          </div>
        </div>
        
        <div className="pt-4">
          <Button 
            onClick={saveSettings} 
            disabled={loading}
            className="w-full md:w-auto"
          >
            {loading ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
          </Button>
        </div>
      </div>
    );
  };

  // Erişim kontrolü render
  const renderAccessControl = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid gap-2">
            <Label htmlFor="maxLoginAttempts">Maksimum Giriş Denemesi</Label>
            <Input
              id="maxLoginAttempts"
              type="number"
              min={1}
              max={10}
              value={accessSettings.maxLoginAttempts}
              onChange={(e) => handleAccessSettingsChange('maxLoginAttempts', parseInt(e.target.value) || 5)}
            />
            <p className="text-xs text-muted-foreground">Başarısız olduğunda hesap kilitlenir</p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="lockoutDuration">Hesap Kilitleme Süresi (Dakika)</Label>
            <Input
              id="lockoutDuration"
              type="number"
              min={5}
              max={1440}
              value={accessSettings.lockoutDuration}
              onChange={(e) => handleAccessSettingsChange('lockoutDuration', parseInt(e.target.value) || 30)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid gap-2">
            <Label htmlFor="sessionTimeout">Oturum Zaman Aşımı (Dakika)</Label>
            <Input
              id="sessionTimeout"
              type="number"
              min={5}
              max={1440}
              value={accessSettings.sessionTimeout}
              onChange={(e) => handleAccessSettingsChange('sessionTimeout', parseInt(e.target.value) || 60)}
            />
            <p className="text-xs text-muted-foreground">Kullanıcı hareketsizlik süresi</p>
          </div>
          
          <div className="grid gap-2">
            <Label>İki Faktörlü Kimlik Doğrulama</Label>
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                checked={accessSettings.enableTwoFactor}
                onChange={(e) => handleAccessSettingsChange('enableTwoFactor', e.target.checked)}
              />
              <Label htmlFor="enableTwoFactor">
                {accessSettings.enableTwoFactor ? 'Etkin' : 'Devre Dışı'}
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">Yönetici girişlerinde zorunlu</p>
          </div>
        </div>
        
        <Alert className="mt-4">
          <AlertTitle className="flex items-center">
            <Lock className="h-4 w-4 mr-2" />
            İki Faktörlü Doğrulama
          </AlertTitle>
          <AlertDescription>
            İki faktörlü doğrulamayı etkinleştirdiğinizde, yönetici hesaplarının girişi sırasında ek bir doğrulama adımı gerekli olacaktır.
          </AlertDescription>
        </Alert>
        
        <div className="pt-4">
          <Button 
            onClick={saveSettings} 
            disabled={loading}
            className="w-full md:w-auto"
          >
            {loading ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
          </Button>
        </div>
      </div>
    );
  };

  // Aktivite izleme render
  const renderActivityMonitoring = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-background p-4 rounded-lg border">
            <h3 className="text-lg font-medium mb-4">Son Oturum Açma Girişimleri</h3>
            <div className="relative overflow-x-auto rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3">Kullanıcı</th>
                    <th scope="col" className="px-6 py-3">Tarih</th>
                    <th scope="col" className="px-6 py-3">IP Adresi</th>
                    <th scope="col" className="px-6 py-3">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white border-b">
                    <td className="px-6 py-4">admin@example.com</td>
                    <td className="px-6 py-4">10.08.2023, 14:23</td>
                    <td className="px-6 py-4">192.168.1.105</td>
                    <td className="px-6 py-4">
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Başarılı</Badge>
                    </td>
                  </tr>
                  <tr className="bg-white border-b">
                    <td className="px-6 py-4">manager@example.com</td>
                    <td className="px-6 py-4">10.08.2023, 12:15</td>
                    <td className="px-6 py-4">192.168.1.130</td>
                    <td className="px-6 py-4">
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Başarısız</Badge>
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-6 py-4">user@example.com</td>
                    <td className="px-6 py-4">09.08.2023, 18:42</td>
                    <td className="px-6 py-4">192.168.1.150</td>
                    <td className="px-6 py-4">
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Başarılı</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="bg-background p-4 rounded-lg border">
            <h3 className="text-lg font-medium mb-4">Kilitli Hesaplar</h3>
            <div className="relative overflow-x-auto rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3">Kullanıcı</th>
                    <th scope="col" className="px-6 py-3">Kilitlenme Tarihi</th>
                    <th scope="col" className="px-6 py-3">Sebep</th>
                    <th scope="col" className="px-6 py-3">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="px-6 py-4">manager@example.com</td>
                    <td className="px-6 py-4">10.08.2023, 12:15</td>
                    <td className="px-6 py-4">Birden çok başarısız giriş</td>
                    <td className="px-6 py-4">
                      <Button variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Kilidi Aç
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container space-y-6 p-6 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Güvenlik Ayarları</h2>
          <p className="text-muted-foreground">
            Sistem güvenlik politikalarını ve erişim kontrollerini yönetin
          </p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="access" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Erişim Kontrolü</span>
          </TabsTrigger>
          <TabsTrigger value="password" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span>Şifre Politikası</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Aktivite İzleme</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="access" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Erişim Kontrol Ayarları</CardTitle>
              <CardDescription>
                Oturum güvenliği ve kimlik doğrulama ayarlarını yapılandırın
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderAccessControl()}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="password" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Şifre Politikası</CardTitle>
              <CardDescription>
                Kullanıcı şifreleri için güvenlik gereksinimlerini belirleyin
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderPasswordPolicy()}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aktivite İzleme</CardTitle>
              <CardDescription>
                Sistem kullanıcılarının giriş ve güvenlik olaylarını takip edin
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderActivityMonitoring()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 