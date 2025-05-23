"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ChevronLeft, 
  Save, 
  Send, 
  Eye, 
  Code, 
  Info, 
  Mail, 
  Tag, 
  CheckCircle2, 
  AlertTriangle, 
  ShoppingCart,
  Plus,
  X
} from 'lucide-react';
import { useToast } from '@/app/components/ui/use-toast';
import AdminLayout from '@/components/layouts/AdminLayout';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  description: string | null;
  isActive: boolean;
  variables: TemplateVariable[];
  createdAt: string;
  updatedAt: string;
}

interface TemplateVariable {
  name: string;
  description: string;
  defaultValue: string;
}

// Test e-posta için kullanılacak form
interface TestEmailData {
  to: string;
  variables: Record<string, string>;
}

export default function EmailTemplateEditor() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [htmlMode, setHtmlMode] = useState(false);
  
  const [testEmail, setTestEmail] = useState<TestEmailData>({
    to: '',
    variables: {}
  });
  
  const [newVariable, setNewVariable] = useState<TemplateVariable>({
    name: '',
    description: '',
    defaultValue: ''
  });
  
  const [showNewVariableDialog, setShowNewVariableDialog] = useState(false);
  
  // Kategori seçenekleri
  const categories = [
    { value: 'notification', label: 'Bildirimler', icon: <Info className="mr-2 h-4 w-4" /> },
    { value: 'order', label: 'Sipariş', icon: <ShoppingCart className="mr-2 h-4 w-4" /> },
    { value: 'confirmation', label: 'Onay İşlemleri', icon: <CheckCircle2 className="mr-2 h-4 w-4" /> },
    { value: 'alert', label: 'Uyarılar', icon: <AlertTriangle className="mr-2 h-4 w-4" /> },
    { value: 'welcome', label: 'Karşılama', icon: <Mail className="mr-2 h-4 w-4" /> }
  ];
  
  // Şablonu yükle
  useEffect(() => {
    if (templateId) {
      fetchTemplate();
    }
  }, [templateId, fetchTemplate]);
  
  // Şablon bilgilerini getir
  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/email/templates/${templateId}`);
      
      if (!response.ok) {
        throw new Error("Şablon yüklenirken bir hata oluştu");
      }
      
      const data = await response.json();
      setTemplate(data.template);
      
      // Test e-postası için varsayılan değerleri ayarla
      if (data.template.variables) {
        const initialVariables: Record<string, string> = {};
        data.template.variables.forEach((variable: TemplateVariable) => {
          initialVariables[variable.name] = variable.defaultValue;
        });
        
        setTestEmail(prev => ({
          ...prev,
          variables: initialVariables
        }));
      }
    } catch (error) {
      console.error("Şablon yüklenirken hata:", error);
      toast({
        title: "Hata",
        description: "Şablon yüklenirken bir sorun oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Şablonu kaydet
  const saveTemplate = async () => {
    if (!template) return;
    
    try {
      setSaving(true);
      
      const response = await fetch(`/api/admin/email/templates/${templateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(template)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Şablon kaydedilirken bir hata oluştu");
      }
      
      const data = await response.json();
      setTemplate(data.template);
      
      toast({
        title: "Başarılı",
        description: "E-posta şablonu başarıyla kaydedildi.",
        variant: "default"
      });
    } catch (error) {
      console.error("Şablon kaydedilirken hata:", error);
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Şablon kaydedilirken bir sorun oluştu.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Test e-postası gönder
  const sendTestEmail = async () => {
    if (!template || !testEmail.to) {
      toast({
        title: "Hata",
        description: "Lütfen bir alıcı e-posta adresi girin.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSending(true);
      
      const response = await fetch(`/api/admin/email/templates/${templateId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: testEmail.to,
          variables: testEmail.variables
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Test e-postası gönderilirken bir hata oluştu");
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
        description: error instanceof Error ? error.message : "Test e-postası gönderilirken bir sorun oluştu.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };
  
  // Yeni değişken ekle
  const addVariable = () => {
    if (!newVariable.name || !template) return;
    
    const variableName = newVariable.name.startsWith('{{') ? 
      newVariable.name : 
      `{{${newVariable.name}}}`;
    
    const updatedVariables = [
      ...template.variables,
      {
        ...newVariable,
        name: variableName
      }
    ];
    
    setTemplate({
      ...template,
      variables: updatedVariables
    });
    
    // Test için varsayılan değer ekle
    setTestEmail(prev => ({
      ...prev,
      variables: {
        ...prev.variables,
        [variableName]: newVariable.defaultValue
      }
    }));
    
    // Diyalogu kapat ve formu temizle
    setShowNewVariableDialog(false);
    setNewVariable({
      name: '',
      description: '',
      defaultValue: ''
    });
  };
  
  // Değişkeni kaldır
  const removeVariable = (variableName: string) => {
    if (!template) return;
    
    const updatedVariables = template.variables.filter(v => v.name !== variableName);
    
    setTemplate({
      ...template,
      variables: updatedVariables
    });
    
    // Test değişkenlerinden kaldır
    const updatedTestVariables = { ...testEmail.variables };
    delete updatedTestVariables[variableName];
    
    setTestEmail({
      ...testEmail,
      variables: updatedTestVariables
    });
  };
  
  // Değişken adı değişti
  const handleNewVariableChange = (field: keyof TemplateVariable, value: string) => {
    setNewVariable(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Test e-posta değişiklikleri
  const handleTestEmailChange = (field: string, value: string) => {
    if (field === 'to') {
      setTestEmail(prev => ({
        ...prev,
        to: value
      }));
    } else {
      setTestEmail(prev => ({
        ...prev,
        variables: {
          ...prev.variables,
          [field]: value
        }
      }));
    }
  };
  
  // Şablon alanı değişti
  const handleTemplateChange = (field: keyof EmailTemplate, value: any) => {
    if (!template) return;
    
    setTemplate({
      ...template,
      [field]: value
    });
  };
  
  // Metin içerisine değişken ekle
  const insertVariableToBody = (variableName: string) => {
    if (!template) return;
    
    const textarea = document.getElementById('email-body') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = template.body;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    
    handleTemplateChange('body', `${before}${variableName}${after}`);
    
    // Odağı tekrar textarea'ya getir ve cursor pozisyonunu güncelle
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + variableName.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };
  
  // Değişkenler paneli
  const renderVariablesPanel = () => {
    if (!template) return null;
    
    return (
      <div className="border rounded-md p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">Şablon Değişkenleri</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowNewVariableDialog(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Yeni Değişken
          </Button>
        </div>
        
        {template.variables.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Henüz hiç değişken tanımlanmamış.
          </div>
        ) : (
          <div className="space-y-2">
            {template.variables.map((variable) => (
              <div 
                key={variable.name} 
                className="flex justify-between items-center p-2 border rounded-md hover:bg-muted/50"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {variable.name}
                    </Badge>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2"
                      onClick={() => insertVariableToBody(variable.name)}
                    >
                      Ekle
                    </Button>
                  </div>
                  
                  {variable.description && (
                    <p className="text-xs text-muted-foreground">
                      {variable.description}
                    </p>
                  )}
                </div>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-destructive h-6 w-6"
                  onClick={() => removeVariable(variable.name)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  // HTML önizleme
  const renderPreview = () => {
    if (!template) return null;
    
    const compiledHtml = template.body;
    
    return (
      <div className="border rounded-md p-4 h-[500px] overflow-auto">
        <div className="bg-white p-6 rounded-md shadow-sm">
          <div className="mb-4 pb-4 border-b">
            <div className="font-semibold text-lg">{template.subject}</div>
          </div>
          
          {/* HTML içeriği göster */}
          <div dangerouslySetInnerHTML={{ __html: compiledHtml }} />
        </div>
      </div>
    );
  };
  
  // Test e-posta formu
  const renderTestEmailForm = () => {
    if (!template) return null;
    
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="test-email" className="text-right">
              Alıcı E-posta
            </Label>
            <Input
              id="test-email"
              placeholder="ornek@mail.com"
              className="col-span-3"
              value={testEmail.to}
              onChange={(e) => handleTestEmailChange('to', e.target.value)}
            />
          </div>
        </div>
        
        {template.variables.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Değişken Değerleri</h3>
            {template.variables.map((variable) => (
              <div key={variable.name} className="grid grid-cols-4 items-center gap-4">
                <div className="text-right">
                  <Label htmlFor={`var-${variable.name}`} className="text-xs text-muted-foreground">
                    {variable.name}
                  </Label>
                </div>
                <Input
                  id={`var-${variable.name}`}
                  placeholder={variable.description}
                  className="col-span-3"
                  value={testEmail.variables[variable.name] || ''}
                  onChange={(e) => handleTestEmailChange(variable.name, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}
        
        <div className="text-center pt-4">
          <Button onClick={sendTestEmail} disabled={sending}>
            {sending ? 'Gönderiliyor...' : 'Test E-postası Gönder'}
            <Send className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };
  
  // Kategori adını getir
  const getCategoryLabel = (categoryValue: string): string => {
    const category = categories.find(cat => cat.value === categoryValue);
    return category ? category.label : categoryValue;
  };
  
  // Kategori ikon bileşeni
  const getCategoryIcon = (category: string) => {
    const foundCategory = categories.find(cat => cat.value === category);
    return foundCategory ? foundCategory.icon : <Tag className="h-4 w-4" />;
  };
  
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-muted-foreground">Şablon yükleniyor...</p>
        </div>
      </AdminLayout>
    );
  }
  
  if (!template) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-[400px] flex-col gap-4">
          <p className="text-xl">Şablon bulunamadı</p>
          <Button onClick={() => router.push('/admin/email/templates')}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Şablonlara Dön
          </Button>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <button 
            onClick={() => router.push('/admin/email/templates')}
            className="mb-2 flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Şablonlara dön
          </button>
          <h1 className="text-2xl font-semibold tracking-tight">{template.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className="uppercase">
              <span className="flex items-center gap-1">
                {getCategoryIcon(template.category)}
                {getCategoryLabel(template.category)}
              </span>
            </Badge>
            <p className="text-muted-foreground text-sm">
              Son güncelleme: {new Date(template.updatedAt).toLocaleDateString('tr-TR')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center mr-4">
                  <Label htmlFor="active-status" className="mr-2 text-sm">Aktif</Label>
                  <Switch
                    id="active-status"
                    checked={template.isActive}
                    onCheckedChange={(isActive) => handleTemplateChange('isActive', isActive)}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Bu şablonun sistem tarafından kullanılıp kullanılmayacağını belirler</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button 
            variant="secondary" 
            onClick={() => setActiveTab('test')}
            disabled={activeTab === 'test'}
          >
            <Send className="mr-2 h-4 w-4" />
            Test Et
          </Button>
          
          <Button onClick={saveTemplate} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="editor">
            <Code className="mr-2 h-4 w-4" />
            Şablon Düzenleyici
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="mr-2 h-4 w-4" />
            Önizleme
          </TabsTrigger>
          <TabsTrigger value="test">
            <Send className="mr-2 h-4 w-4" />
            Test E-posta
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="editor" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="template-name" className="text-right">
                    Şablon Adı
                  </Label>
                  <Input
                    id="template-name"
                    className="col-span-3"
                    value={template.name}
                    onChange={(e) => handleTemplateChange('name', e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="template-subject" className="text-right">
                    E-posta Konusu
                  </Label>
                  <Input
                    id="template-subject"
                    className="col-span-3"
                    value={template.subject}
                    onChange={(e) => handleTemplateChange('subject', e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="template-category" className="text-right">
                    Kategori
                  </Label>
                  <Select 
                    value={template.category}
                    onValueChange={(value) => handleTemplateChange('category', value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Kategori Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex items-center">
                            {category.icon}
                            {category.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="template-description" className="text-right">
                    Açıklama
                  </Label>
                  <Input
                    id="template-description"
                    className="col-span-3"
                    value={template.description || ''}
                    onChange={(e) => handleTemplateChange('description', e.target.value)}
                    placeholder="Bu şablonun kullanım amacı"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="email-body">E-posta İçeriği</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground mr-2">HTML Modu</span>
                    <Switch
                      checked={htmlMode}
                      onCheckedChange={setHtmlMode}
                    />
                  </div>
                </div>
                
                <Textarea
                  id="email-body"
                  className="font-mono min-h-[300px] whitespace-pre"
                  value={template.body}
                  onChange={(e) => handleTemplateChange('body', e.target.value)}
                  placeholder={htmlMode ? "<p>E-posta içeriğini buraya yazın...</p>" : "E-posta içeriğini buraya yazın..."}
                />
                
                <p className="text-xs text-muted-foreground">
                  {htmlMode 
                    ? "HTML modu açık - HTML etiketleri kullanabilirsiniz"
                    : "Düz metin modu - Sadece metin ve değişkenler kullanabilirsiniz"}
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              {renderVariablesPanel()}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="preview" className="space-y-6">
          {renderPreview()}
        </TabsContent>
        
        <TabsContent value="test" className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Test E-postası Gönder</CardTitle>
              <CardDescription>
                Şablonu test etmek için bir e-posta adresi girin ve değişken değerlerini doldurun.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderTestEmailForm()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Yeni Değişken Ekle Dialog */}
      <Dialog open={showNewVariableDialog} onOpenChange={setShowNewVariableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Değişken Ekle</DialogTitle>
            <DialogDescription>
              E-posta şablonunuzda kullanmak için yeni bir değişken tanımlayın.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="var-name" className="text-right">
                Değişken Adı
              </Label>
              <div className="col-span-3">
                <Input
                  id="var-name"
                  placeholder="customerName"
                  value={newVariable.name}
                  onChange={(e) => handleNewVariableChange('name', e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Örn: customerName, orderNumber ({{}} parantezleri otomatik eklenecektir)
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="var-desc" className="text-right">
                Açıklama
              </Label>
              <Input
                id="var-desc"
                placeholder="Müşteri adı"
                className="col-span-3"
                value={newVariable.description}
                onChange={(e) => handleNewVariableChange('description', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="var-default" className="text-right">
                Varsayılan Değer
              </Label>
              <Input
                id="var-default"
                placeholder="Test Müşteri"
                className="col-span-3"
                value={newVariable.defaultValue}
                onChange={(e) => handleNewVariableChange('defaultValue', e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewVariableDialog(false)}>
              İptal
            </Button>
            <Button onClick={addVariable} disabled={!newVariable.name}>
              Değişken Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
} 