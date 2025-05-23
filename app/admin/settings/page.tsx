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
import { AlertCircle, Code, Cog, Globe, Info, Moon, Paintbrush, Shield, Sun, WrenchIcon as Tool } from 'lucide-react';
import { useToast } from '@/app/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  category: string;
  description: string | null;
  dataType: string;
  isEncrypted: boolean;
  lastUpdated: string;
  updatedBy: string | null;
}

export default function AdminSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Sistem ayarları
  const [settings, setSettings] = useState<Record<string, SystemSetting>>({});
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({});

  // Ayarları yükle
  useEffect(() => {
    fetchSettings();
  }, []);

  // Sistem ayarlarını getir
  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      // localStorage'dan token'ı al
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        toast({
          title: "Hata",
          description: "Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.",
          type: "error"
        } as any);
        setLoading(false);
        return;
      }
      
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Hata",
            description: "Oturum süresi dolmuş olabilir. Lütfen tekrar giriş yapın.",
            type: "error"
          } as any);
          setLoading(false);
          return;
        }
        if (response.status === 404 || response.status === 500) {
          toast({
            title: "Hata",
            description: "Sistem ayarları şu anda yüklenemiyor. API sunucusu yanıt vermiyor.",
            type: "error"
          } as any);
          // Varsayılan boş ayarları göster, kullanıcının hala arayüzü görebilmesi için
          setSettings({});
          setLoading(false);
          return;
        }
        throw new Error("Ayarlar yüklenirken bir hata oluştu");
      }
      
      const data = await response.json();
      
      if (!data || !data.settings || !Array.isArray(data.settings) || data.settings.length === 0) {
        toast({
          title: "Bilgi",
          description: "Henüz ayar kaydı bulunmuyor. Yeni ayarlar oluşturabilirsiniz.",
          type: "default"
        } as any);
        setSettings({});
        setLoading(false);
        return;
      }
      
      // Ayarları işle ve state'e kaydet
      const settingsMap: Record<string, SystemSetting> = {};
      data.settings.forEach((setting: SystemSetting) => {
        settingsMap[setting.key] = setting;
      });
      
      setSettings(settingsMap);
      
      // Bakım modunu kontrol et
      if (settingsMap['maintenance.enabled']) {
        setMaintenanceMode(settingsMap['maintenance.enabled'].value === 'true');
      }
      
    } catch (error) {
      console.error("Ayarlar yüklenirken hata:", error);
      toast({
        title: "Hata",
        description: "Sistem ayarları yüklenirken bir sorun oluştu.",
        type: "error"
      } as any);
      // Varsayılan boş ayarları göster
      setSettings({});
    } finally {
      setLoading(false);
    }
  };

  // Ayar değerini değiştir
  const handleSettingChange = (key: string, value: string) => {
    setPendingChanges({
      ...pendingChanges,
      [key]: value
    });
  };

  // Bakım modunu değiştir
  const toggleMaintenanceMode = async () => {
    try {
      setSaving(true);
      
      // localStorage'dan token'ı al
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        toast({
          title: "Hata",
          description: "Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.",
          type: "error"
        } as any);
        setSaving(false);
        return;
      }
      
      const newMaintenanceMode = !maintenanceMode;
      
      const response = await fetch('/api/admin/settings/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          enabled: newMaintenanceMode
        })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Hata",
            description: "Oturum süresi dolmuş olabilir. Lütfen tekrar giriş yapın.",
            type: "error"
          } as any);
          return;
        }
        throw new Error("Bakım modu değiştirilirken bir hata oluştu");
      }
      
      setMaintenanceMode(newMaintenanceMode);
      
      toast({
        title: "Başarılı",
        description: `Bakım modu ${newMaintenanceMode ? 'etkinleştirildi' : 'devre dışı bırakıldı'}.`,
        type: "success"
      } as any);
      
    } catch (error) {
      console.error("Bakım modu değiştirilirken hata:", error);
      toast({
        title: "Hata",
        description: "Bakım modu değiştirilirken bir sorun oluştu.",
        type: "error"
      } as any);
    } finally {
      setSaving(false);
    }
  };

  // Ayarları kaydet
  const saveSettings = async (category: string) => {
    try {
      setSaving(true);
      
      // localStorage'dan token'ı al
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        toast({
          title: "Hata",
          description: "Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.",
          type: "error"
        } as any);
        setSaving(false);
        return;
      }
      
      // Yalnızca değişen ayarları filtrele
      const changedSettings = Object.keys(pendingChanges)
        .filter(key => settings[key]?.category === category)
        .map(key => ({
          key,
          value: pendingChanges[key]
        }));
      
      if (changedSettings.length === 0) {
        toast({
          title: "Bilgi",
          description: "Değişiklik yapılmadı.",
          type: "default"
        } as any);
        return;
      }
      
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          settings: changedSettings
        })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Hata",
            description: "Oturum süresi dolmuş olabilir. Lütfen tekrar giriş yapın.",
            type: "error"
          } as any);
          return;
        }
        throw new Error("Ayarlar kaydedilirken bir hata oluştu");
      }
      
      // Başarılı kayıt sonrası, güncel ayarları tekrar yükle
      await fetchSettings();
      
      // Değişiklikleri temizle
      const newPendingChanges = { ...pendingChanges };
      changedSettings.forEach(setting => {
        delete newPendingChanges[setting.key];
      });
      setPendingChanges(newPendingChanges);
      
      toast({
        title: "Başarılı",
        description: "Ayarlar başarıyla kaydedildi.",
        type: "success"
      } as any);
      
    } catch (error) {
      console.error("Ayarlar kaydedilirken hata:", error);
      toast({
        title: "Hata",
        description: "Ayarlar kaydedilirken bir sorun oluştu.",
        type: "error"
      } as any);
    } finally {
      setSaving(false);
    }
  };

  // Genel ayarlar render
  const renderGeneralSettings = () => {
    const generalSettings = Object.values(settings).filter(
      setting => setting.category === 'general'
    );

    return (
      <div className="space-y-6">
        {generalSettings.length === 0 ? (
          <p className="text-muted-foreground">Henüz genel ayar bulunmuyor.</p>
        ) : (
          generalSettings.map(setting => (
            <div key={setting.key} className="grid gap-2">
              <Label htmlFor={setting.key}>
                {setting.description || setting.key}
              </Label>
              {setting.dataType === 'boolean' ? (
                <div className="flex items-center space-x-2">
                  <Switch
                    id={setting.key}
                    checked={pendingChanges[setting.key] !== undefined 
                      ? pendingChanges[setting.key] === 'true'
                      : setting.value === 'true'}
                    onChange={() => 
                      handleSettingChange(setting.key, 
                      pendingChanges[setting.key] !== undefined 
                        ? pendingChanges[setting.key] === 'true' ? 'false' : 'true'
                        : setting.value === 'true' ? 'false' : 'true')}
                  />
                  <Label htmlFor={setting.key}>
                    {pendingChanges[setting.key] !== undefined 
                      ? pendingChanges[setting.key] === 'true' ? 'Etkin' : 'Devre Dışı'
                      : setting.value === 'true' ? 'Etkin' : 'Devre Dışı'}
                  </Label>
                </div>
              ) : setting.dataType === 'select' && setting.key === 'site.theme' ? (
                <Select
                  value={pendingChanges[setting.key] || setting.value}
                  onValueChange={(value) => handleSettingChange(setting.key, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tema seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center">
                        <Sun className="mr-2 h-4 w-4" />
                        <span>Açık</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center">
                        <Moon className="mr-2 h-4 w-4" />
                        <span>Koyu</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center">
                        <Cog className="mr-2 h-4 w-4" />
                        <span>Sistem</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={setting.key}
                  value={pendingChanges[setting.key] !== undefined 
                    ? pendingChanges[setting.key]
                    : setting.value}
                  onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                />
              )}
              {setting.key in pendingChanges && (
                <p className="text-xs text-orange-500">Değişiklik kaydedilmedi</p>
              )}
            </div>
          ))
        )}
        
        <Button 
          onClick={() => saveSettings('general')} 
          disabled={saving || !Object.keys(pendingChanges).some(key => 
            settings[key]?.category === 'general'
          )}
        >
          {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
        </Button>
      </div>
    );
  };

  // Geliştirici ayarları render
  const renderDeveloperSettings = () => {
    const developerSettings = Object.values(settings).filter(
      setting => setting.category === 'developer'
    );

    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Dikkat</AlertTitle>
          <AlertDescription>
            Bu ayarlar, uygulamanın performansını ve davranışını etkileyebilir. Yalnızca ne yaptığınızı biliyorsanız değiştirin.
          </AlertDescription>
        </Alert>
        
        {developerSettings.length === 0 ? (
          <p className="text-muted-foreground">Henüz geliştirici ayarı bulunmuyor.</p>
        ) : (
          developerSettings.map(setting => (
            <div key={setting.key} className="grid gap-2">
              <Label htmlFor={setting.key}>
                {setting.description || setting.key}
                {setting.key === 'developer.debug_mode' && (
                  <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800">
                    Dikkat
                  </Badge>
                )}
              </Label>
              {setting.dataType === 'boolean' ? (
                <div className="flex items-center space-x-2">
                  <Switch
                    id={setting.key}
                    checked={pendingChanges[setting.key] !== undefined 
                      ? pendingChanges[setting.key] === 'true'
                      : setting.value === 'true'}
                    onChange={() => 
                      handleSettingChange(setting.key, 
                      pendingChanges[setting.key] !== undefined 
                        ? pendingChanges[setting.key] === 'true' ? 'false' : 'true'
                        : setting.value === 'true' ? 'false' : 'true')}
                  />
                  <Label htmlFor={setting.key}>
                    {pendingChanges[setting.key] !== undefined 
                      ? pendingChanges[setting.key] === 'true' ? 'Etkin' : 'Devre Dışı'
                      : setting.value === 'true' ? 'Etkin' : 'Devre Dışı'}
                  </Label>
                </div>
              ) : setting.dataType === 'select' && setting.key === 'developer.log_level' ? (
                <Select
                  value={pendingChanges[setting.key] || setting.value}
                  onValueChange={(value) => handleSettingChange(setting.key, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Log seviyesi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="error">Sadece Hatalar</SelectItem>
                    <SelectItem value="warn">Uyarılar ve Hatalar</SelectItem>
                    <SelectItem value="info">Bilgi ve Üzeri</SelectItem>
                    <SelectItem value="debug">Debug (Ayrıntılı)</SelectItem>
                    <SelectItem value="trace">Trace (Çok Ayrıntılı)</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={setting.key}
                  value={pendingChanges[setting.key] !== undefined 
                    ? pendingChanges[setting.key]
                    : setting.value}
                  onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                />
              )}
              {setting.key in pendingChanges && (
                <p className="text-xs text-orange-500">Değişiklik kaydedilmedi</p>
              )}
            </div>
          ))
        )}
        
        <Button 
          onClick={() => saveSettings('developer')} 
          disabled={saving || !Object.keys(pendingChanges).some(key => 
            settings[key]?.category === 'developer'
          )}
        >
          {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
        </Button>
      </div>
    );
  };

  // Erişim kısıtlamaları render
  const renderAccessSettings = () => {
    const accessSettings = Object.values(settings).filter(
      setting => setting.category === 'access'
    );

    return (
      <div className="space-y-6">
        <div className="rounded-md border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Bakım Modu</h3>
              <p className="text-sm text-muted-foreground">
                Bakım modu etkinleştirildiğinde, sadece yöneticiler uygulamaya erişebilir.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="maintenance-mode"
                checked={maintenanceMode}
                onChange={toggleMaintenanceMode}
                disabled={saving}
              />
              <Label htmlFor="maintenance-mode">
                {maintenanceMode ? 'Etkin' : 'Devre Dışı'}
              </Label>
            </div>
          </div>
        </div>
        
        {accessSettings.length === 0 ? (
          <p className="text-muted-foreground">Henüz erişim ayarı bulunmuyor.</p>
        ) : (
          accessSettings.map(setting => (
            <div key={setting.key} className="grid gap-2">
              <Label htmlFor={setting.key}>
                {setting.description || setting.key}
              </Label>
              {setting.dataType === 'boolean' ? (
                <div className="flex items-center space-x-2">
                  <Switch
                    id={setting.key}
                    checked={pendingChanges[setting.key] !== undefined 
                      ? pendingChanges[setting.key] === 'true'
                      : setting.value === 'true'}
                    onChange={() => 
                      handleSettingChange(setting.key, 
                      pendingChanges[setting.key] !== undefined 
                        ? pendingChanges[setting.key] === 'true' ? 'false' : 'true'
                        : setting.value === 'true' ? 'false' : 'true')}
                  />
                  <Label htmlFor={setting.key}>
                    {pendingChanges[setting.key] !== undefined 
                      ? pendingChanges[setting.key] === 'true' ? 'Etkin' : 'Devre Dışı'
                      : setting.value === 'true' ? 'Etkin' : 'Devre Dışı'}
                  </Label>
                </div>
              ) : (
                <Input
                  id={setting.key}
                  value={pendingChanges[setting.key] !== undefined 
                    ? pendingChanges[setting.key]
                    : setting.value}
                  onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                />
              )}
              {setting.key in pendingChanges && (
                <p className="text-xs text-orange-500">Değişiklik kaydedilmedi</p>
              )}
            </div>
          ))
        )}
        
        <Button 
          onClick={() => saveSettings('access')} 
          disabled={saving || !Object.keys(pendingChanges).some(key => 
            settings[key]?.category === 'access'
          )}
        >
          {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
        </Button>
      </div>
    );
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Sistem Ayarları</CardTitle>
          <CardDescription>
            Platform yapılandırması ve sistem ayarlarını yönetin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="general" className="flex items-center">
                <Globe className="mr-2 h-4 w-4" />
                <span>Genel</span>
              </TabsTrigger>
              <TabsTrigger value="developer" className="flex items-center">
                <Code className="mr-2 h-4 w-4" />
                <span>Geliştirici</span>
              </TabsTrigger>
              <TabsTrigger value="access" className="flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                <span>Erişim</span>
              </TabsTrigger>
            </TabsList>
            
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Ayarlar yükleniyor...</p>
              </div>
            ) : (
              <>
                <TabsContent value="general">
                  {renderGeneralSettings()}
                </TabsContent>
                <TabsContent value="developer">
                  {renderDeveloperSettings()}
                </TabsContent>
                <TabsContent value="access">
                  {renderAccessSettings()}
                </TabsContent>
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 