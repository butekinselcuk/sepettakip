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
import { Mail, LockKeyhole, Send, Save, Cog, FileText, RefreshCw } from 'lucide-react';
import { useToast } from '@/app/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { encrypt, decrypt } from '@/app/lib/encryption';

interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  replyTo: string;
}

export default function AdminEmailSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [activeTab, setActiveTab] = useState('smtp');
  
  // SMTP ayarları
  const [smtpSettings, setSmtpSettings] = useState<SmtpSettings>({
    host: '',
    port: 587,
    secure: false,
    auth: {
      user: '',
      pass: '',
    },
    from: '',
    replyTo: '',
  });
  
  // Test e-posta ayarları
  const [testEmail, setTestEmail] = useState({
    to: '',
    subject: 'SMTP Ayarları Test E-postası',
    text: 'Bu e-posta, SepetTakip platformu SMTP ayarlarının doğru çalıştığını test etmek için gönderilmiştir.',
  });
  
  // E-posta şablonları
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  
  // Ayarları yükle
  useEffect(() => {
    fetchSettings();
  }, []);
  
  // SMTP ayarlarını getir
  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      // localStorage'dan token'ı al
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        toast({
          title: "Hata",
          description: "Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      const response = await fetch('/api/admin/email/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Hata",
            description: "Oturum süresi dolmuş olabilir. Lütfen tekrar giriş yapın.",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
        throw new Error("E-posta ayarları yüklenirken bir hata oluştu");
      }
      
      const data = await response.json();
      
      // Ayarları state'e kaydet
      if (data.settings) {
        setSmtpSettings(data.settings);
      }
      
      // E-posta şablonlarını getir
      if (data.templates) {
        setTemplates(data.templates);
      }
      
    } catch (error) {
      console.error("E-posta ayarları yüklenirken hata:", error);
      toast({
        title: "Hata",
        description: "E-posta ayarları yüklenirken bir sorun oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // SMTP ayarlarını güncelle
  const handleSmtpChange = (field: string, value: string | number | boolean) => {
    if (field.includes('.')) {
      // Nested fields (auth.user, auth.pass)
      const [parent, child] = field.split('.');
      setSmtpSettings({
        ...smtpSettings,
        [parent]: {
          ...smtpSettings[parent as keyof SmtpSettings] as Record<string, unknown>,
          [child]: value
        }
      });
    } else {
      // Top level fields
      setSmtpSettings({
        ...smtpSettings,
        [field]: value
      });
    }
  };
  
  // Test e-posta ayarlarını değiştir
  const handleTestEmailChange = (field: string, value: string) => {
    setTestEmail({
      ...testEmail,
      [field]: value
    });
  };
  
  // Test e-postası gönder
  const sendTestEmail = async () => {
    try {
      setTesting(true);
      
      if (!testEmail.to) {
        toast({
          title: "Hata",
          description: "Lütfen geçerli bir alıcı e-posta adresi giriniz.",
          variant: "destructive"
        });
        return;
      }
      
      const response = await fetch('/api/admin/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          to: testEmail.to,
          subject: testEmail.subject,
          text: testEmail.text
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "E-posta gönderilemedi");
      }
      
      toast({
        title: "Başarılı",
        description: "Test e-postası başarıyla gönderildi.",
        variant: "default"
      });
      
    } catch (error) {
      console.error("Test e-postası gönderilirken hata:", error);
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "E-posta gönderilirken bir sorun oluştu.",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };
  
  // Ayarları kaydet
  const saveSmtpSettings = async () => {
    try {
      setSaving(true);
      
      // Temel doğrulama kontrolü
      if (!smtpSettings.host || !smtpSettings.port || !smtpSettings.from) {
        toast({
          title: "Hata",
          description: "Lütfen gerekli alanları doldurunuz (Sunucu, Port, Gönderen).",
          variant: "destructive"
        });
        return;
      }
      
      const response = await fetch('/api/admin/email/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          settings: smtpSettings
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "SMTP ayarları kaydedilemedi");
      }
      
      toast({
        title: "Başarılı",
        description: "SMTP ayarları başarıyla kaydedildi.",
        variant: "default"
      });
      
    } catch (error) {
      console.error("SMTP ayarları kaydedilirken hata:", error);
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "SMTP ayarları kaydedilirken bir sorun oluştu.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  // SMTP ayarları render
  const renderSmtpSettings = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid gap-2">
            <Label htmlFor="host">SMTP Sunucusu</Label>
            <Input
              id="host"
              placeholder="smtp.example.com"
              value={smtpSettings.host}
              onChange={(e) => handleSmtpChange('host', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">E-posta sunucusunun adresi</p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="port">Port</Label>
            <Input
              id="port"
              type="number"
              placeholder="587"
              value={smtpSettings.port}
              onChange={(e) => handleSmtpChange('port', parseInt(e.target.value) || 587)}
            />
            <p className="text-xs text-muted-foreground">Genellikle 587 (TLS) veya 465 (SSL)</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="secure"
            checked={smtpSettings.secure}
            onChange={() => handleSmtpChange('secure', !smtpSettings.secure)}
          />
          <Label htmlFor="secure">Güvenli Bağlantı (SSL/TLS)</Label>
        </div>
        
        <Separator className="my-4" />
        
        <h3 className="text-lg font-medium">Kimlik Doğrulama</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid gap-2">
            <Label htmlFor="auth.user">Kullanıcı Adı</Label>
            <Input
              id="auth.user"
              placeholder="email@example.com"
              value={smtpSettings.auth.user}
              onChange={(e) => handleSmtpChange('auth.user', e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="auth.pass">Şifre</Label>
            <Input
              id="auth.pass"
              type="password"
              placeholder="••••••••"
              value={smtpSettings.auth.pass}
              onChange={(e) => handleSmtpChange('auth.pass', e.target.value)}
            />
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <h3 className="text-lg font-medium">Gönderim Ayarları</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid gap-2">
            <Label htmlFor="from">Gönderen E-posta</Label>
            <Input
              id="from"
              placeholder="noreply@example.com"
              value={smtpSettings.from}
              onChange={(e) => handleSmtpChange('from', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Sistem e-postalarının kimden gönderileceği</p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="replyTo">Yanıt Adresi (opsiyonel)</Label>
            <Input
              id="replyTo"
              placeholder="support@example.com"
              value={smtpSettings.replyTo}
              onChange={(e) => handleSmtpChange('replyTo', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Cevaplanan e-postaların gideceği adres</p>
          </div>
        </div>
        
        <div className="flex justify-end space-x-4 pt-4">
          <Button 
            variant="outline" 
            onClick={fetchSettings}
            disabled={loading || saving}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Yenile
          </Button>
          <Button 
            onClick={saveSmtpSettings} 
            disabled={saving || loading}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Kaydediliyor..." : "Ayarları Kaydet"}
          </Button>
        </div>
      </div>
    );
  };
  
  // Test e-posta render
  const renderTestEmail = () => {
    return (
      <div className="space-y-6">
        <Alert>
          <Mail className="h-4 w-4" />
          <AlertTitle>Test E-postası Gönderimi</AlertTitle>
          <AlertDescription>
            Bu form, SMTP ayarlarınızın doğru çalıştığını test etmek için kullanılır. Geçerli bir e-posta adresi giriniz.
          </AlertDescription>
        </Alert>
        
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="to">Alıcı E-posta</Label>
            <Input
              id="to"
              placeholder="test@example.com"
              value={testEmail.to}
              onChange={(e) => handleTestEmailChange('to', e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="subject">Konu</Label>
            <Input
              id="subject"
              value={testEmail.subject}
              onChange={(e) => handleTestEmailChange('subject', e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="text">İçerik</Label>
            <Textarea
              id="text"
              rows={5}
              value={testEmail.text}
              onChange={(e) => handleTestEmailChange('text', e.target.value)}
            />
          </div>
        </div>
        
        <Button 
          onClick={sendTestEmail}
          disabled={testing || !testEmail.to}
          className="w-full"
        >
          <Send className="mr-2 h-4 w-4" />
          {testing ? "Gönderiliyor..." : "Test E-postası Gönder"}
        </Button>
      </div>
    );
  };
  
  // E-posta şablonları render (Ön hazırlık)
  const renderTemplates = () => {
    return (
      <div className="space-y-6">
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertTitle>E-posta Şablonları</AlertTitle>
          <AlertDescription>
            Bu modül şu anda geliştirme aşamasındadır. Yakında farklı bildirim türleri için e-posta şablonları oluşturup düzenleyebileceksiniz.
          </AlertDescription>
        </Alert>
        
        <div className="bg-muted p-6 rounded-md text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">E-posta Şablonları Yakında</h3>
          <p className="text-muted-foreground mt-2">
            Bu özellik yakında kullanıma sunulacaktır. Şablon editörü, değişken desteği ve önizleme özelliklerini içerecektir.
          </p>
          <Badge variant="outline" className="mt-4">Geliştirme Aşamasında</Badge>
        </div>
        
        {/* Yakında eklenecek şablon listesi ve editörü */}
      </div>
    );
  };
  
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>E-posta Ayarları</CardTitle>
          <CardDescription>
            SMTP sunucu yapılandırması ve e-posta gönderim ayarlarını yönetin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="smtp" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="smtp" className="flex items-center">
                <Cog className="mr-2 h-4 w-4" />
                <span>SMTP Ayarları</span>
              </TabsTrigger>
              <TabsTrigger value="test" className="flex items-center">
                <Send className="mr-2 h-4 w-4" />
                <span>Test E-postası</span>
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                <span>Şablonlar</span>
              </TabsTrigger>
            </TabsList>
            
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Ayarlar yükleniyor...</p>
              </div>
            ) : (
              <>
                <TabsContent value="smtp">
                  {renderSmtpSettings()}
                </TabsContent>
                <TabsContent value="test">
                  {renderTestEmail()}
                </TabsContent>
                <TabsContent value="templates">
                  {renderTemplates()}
                </TabsContent>
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 