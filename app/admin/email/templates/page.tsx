"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { FileText, Plus, Search, Mail, Tag, Trash2, Edit, Copy, Eye, CheckCircle2, AlertTriangle, Info, ShoppingCart, Send } from 'lucide-react';
import { useToast } from '@/app/components/ui/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  category: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

export default function EmailTemplatesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [isNewTemplateDialogOpen, setIsNewTemplateDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    category: 'notification',
    description: ''
  });

  // Tüm kategorilerin listesi
  const categories = [
    { value: 'all', label: 'Tüm Şablonlar', icon: <FileText className="mr-2 h-4 w-4" /> },
    { value: 'notification', label: 'Bildirimler', icon: <Info className="mr-2 h-4 w-4" /> },
    { value: 'order', label: 'Sipariş', icon: <ShoppingCart className="mr-2 h-4 w-4" /> },
    { value: 'confirmation', label: 'Onay İşlemleri', icon: <CheckCircle2 className="mr-2 h-4 w-4" /> },
    { value: 'alert', label: 'Uyarılar', icon: <AlertTriangle className="mr-2 h-4 w-4" /> },
    { value: 'welcome', label: 'Karşılama', icon: <Mail className="mr-2 h-4 w-4" /> }
  ];

  // Şablonları yükle
  useEffect(() => {
    fetchTemplates();
  }, []);

  // E-posta şablonlarını getir
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/email/templates');
      
      if (!response.ok) {
        throw new Error("E-posta şablonları yüklenirken bir hata oluştu");
      }
      
      const data = await response.json();
      setTemplates(data.templates);
    } catch (error) {
      console.error("E-posta şablonları yüklenirken hata:", error);
      toast({
        title: "Hata",
        description: "E-posta şablonları yüklenirken bir sorun oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Yeni şablon oluştur
  const createTemplate = async () => {
    try {
      // Validasyon kontrolleri
      if (!newTemplate.name.trim() || !newTemplate.subject.trim()) {
        toast({
          title: "Hata",
          description: "Şablon adı ve konu alanları zorunludur.",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch('/api/admin/email/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTemplate)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Şablon oluşturulurken bir hata oluştu");
      }

      const data = await response.json();
      
      toast({
        title: "Başarılı",
        description: "E-posta şablonu başarıyla oluşturuldu.",
        variant: "default"
      });
      
      // Şablon düzenleme sayfasına yönlendir
      router.push(`/admin/email/templates/${data.template.id}`);
    } catch (error) {
      console.error("Şablon oluşturulurken hata:", error);
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Şablon oluşturulurken bir sorun oluştu.",
        variant: "destructive"
      });
    }
  };

  // Şablon sil
  const deleteTemplate = async () => {
    if (!templateToDelete) return;
    
    try {
      const response = await fetch(`/api/admin/email/templates/${templateToDelete}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Şablon silinirken bir hata oluştu");
      }
      
      // Listeden kaldır
      setTemplates(templates.filter(template => template.id !== templateToDelete));
      
      toast({
        title: "Başarılı",
        description: "E-posta şablonu başarıyla silindi.",
        variant: "default"
      });
      
      setIsDeleteDialogOpen(false);
      setTemplateToDelete(null);
    } catch (error) {
      console.error("Şablon silinirken hata:", error);
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Şablon silinirken bir sorun oluştu.",
        variant: "destructive"
      });
    }
  };

  // Şablon klonla
  const cloneTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/admin/email/templates/${templateId}/clone`, {
        method: 'POST'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Şablon klonlanırken bir hata oluştu");
      }

      const data = await response.json();
      
      // Yeni şablonu listeye ekle
      fetchTemplates();
      
      toast({
        title: "Başarılı",
        description: "E-posta şablonu başarıyla klonlandı.",
        variant: "default"
      });
      
    } catch (error) {
      console.error("Şablon klonlanırken hata:", error);
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Şablon klonlanırken bir sorun oluştu.",
        variant: "destructive"
      });
    }
  };

  // Kategori ve arama filtrelemesi
  const filteredTemplates = templates.filter(template => {
    // Kategori filtresi
    const categoryMatch = activeCategory === 'all' || template.category === activeCategory;
    
    // Arama filtresi (ad, konu ve açıklamada ara)
    const searchLower = searchQuery.toLowerCase();
    const searchMatch = !searchQuery || 
      template.name.toLowerCase().includes(searchLower) ||
      template.subject.toLowerCase().includes(searchLower) ||
      (template.description && template.description.toLowerCase().includes(searchLower));
    
    return categoryMatch && searchMatch;
  });

  // Kategori adını getir
  const getCategoryLabel = (categoryValue: string): string => {
    const category = categories.find(cat => cat.value === categoryValue);
    return category ? category.label : categoryValue;
  };
  
  // Kategori rengini getir
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'notification':
        return 'bg-blue-100 text-blue-800';
      case 'order':
        return 'bg-green-100 text-green-800';
      case 'confirmation':
        return 'bg-purple-100 text-purple-800';
      case 'alert':
        return 'bg-orange-100 text-orange-800';
      case 'welcome':
        return 'bg-cyan-100 text-cyan-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Kategori ikonunu getir
  const getCategoryIcon = (category: string) => {
    const foundCategory = categories.find(cat => cat.value === category);
    return foundCategory ? foundCategory.icon : <Tag className="h-4 w-4" />;
  };

  // Kullanım istatistiği metnini getir
  const getUsageText = (count: number) => {
    if (count === 0) return 'Henüz kullanılmadı';
    if (count === 1) return '1 kez kullanıldı';
    return `${count} kez kullanıldı`;
  };

  return (
    <div className="container space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">E-posta Şablonları</h1>
          <p className="text-muted-foreground">
            Sistem e-posta şablonlarını yönetin ve özelleştirin
          </p>
        </div>
        <Dialog open={isNewTemplateDialogOpen} onOpenChange={setIsNewTemplateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Şablon
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni E-posta Şablonu</DialogTitle>
              <DialogDescription>
                Yeni bir e-posta şablonu oluşturun. Oluşturulduktan sonra içeriğini düzenleyebilirsiniz.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Şablon Adı
                </Label>
                <Input
                  id="name"
                  placeholder="Sipariş Onayı"
                  className="col-span-3"
                  value={newTemplate.name}
                  onChange={e => setNewTemplate({...newTemplate, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subject" className="text-right">
                  E-posta Konusu
                </Label>
                <Input
                  id="subject"
                  placeholder="Siparişiniz Onaylandı"
                  className="col-span-3"
                  value={newTemplate.subject}
                  onChange={e => setNewTemplate({...newTemplate, subject: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Kategori
                </Label>
                <Select 
                  value={newTemplate.category}
                  onValueChange={value => setNewTemplate({...newTemplate, category: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Kategori Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(cat => cat.value !== 'all').map(category => (
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
                <Label htmlFor="description" className="text-right">
                  Açıklama
                </Label>
                <Input
                  id="description"
                  placeholder="Bu şablon sipariş onayı için kullanılır"
                  className="col-span-3"
                  value={newTemplate.description}
                  onChange={e => setNewTemplate({...newTemplate, description: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewTemplateDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={createTemplate}>
                Oluştur
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sol Kategori Listesi */}
        <div className="w-full md:w-64 space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Şablonlarda ara..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="bg-card rounded-lg border shadow-sm">
            <div className="p-2">
              <h3 className="mb-2 px-2 text-sm font-semibold">Kategoriler</h3>
              <div className="space-y-1">
                {categories.map((category) => (
                  <Button
                    key={category.value}
                    variant={activeCategory === category.value ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveCategory(category.value)}
                  >
                    {category.icon}
                    {category.label}
                    {category.value !== 'all' && (
                      <Badge 
                        variant="secondary" 
                        className="ml-auto"
                      >
                        {templates.filter(t => t.category === category.value).length}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Sağ Şablon Listesi */}
        <div className="flex-1">
          <Card>
            <CardHeader className="px-6 py-4">
              <CardTitle>
                {categories.find(c => c.value === activeCategory)?.label || 'Tüm Şablonlar'}
                <Badge className="ml-2">{filteredTemplates.length}</Badge>
              </CardTitle>
              <CardDescription>
                {activeCategory === 'all' 
                  ? 'Tüm e-posta şablonlarını görüntüleyin ve yönetin' 
                  : `${getCategoryLabel(activeCategory)} kategorisindeki şablonlar`}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <p className="text-muted-foreground">Şablonlar yükleniyor...</p>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Şablon Bulunamadı</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery 
                      ? `"${searchQuery}" araması için sonuç bulunamadı.` 
                      : activeCategory !== 'all' 
                        ? `${getCategoryLabel(activeCategory)} kategorisinde şablon bulunmuyor.` 
                        : 'Henüz e-posta şablonu oluşturulmamış.'}
                  </p>
                  <Button onClick={() => setIsNewTemplateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Yeni Şablon Oluştur
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Şablon Adı</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Son Güncelleme</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTemplates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{template.name}</div>
                              <div className="text-sm text-muted-foreground">{template.subject}</div>
                              {template.description && (
                                <div className="text-xs text-muted-foreground mt-1">{template.description}</div>
                              )}
                              <div className="text-xs text-muted-foreground mt-1">
                                {getUsageText(template.usageCount)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getCategoryColor(template.category)}`}>
                              <span className="flex items-center gap-1">
                                {getCategoryIcon(template.category)}
                                {getCategoryLabel(template.category)}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(template.updatedAt).toLocaleDateString('tr-TR')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/admin/email/templates/${template.id}`)}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Düzenle</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => cloneTemplate(template.id)}
                              >
                                <Copy className="h-4 w-4" />
                                <span className="sr-only">Klonla</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/admin/email/templates/${template.id}/preview`)}
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">Önizle</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => {
                                  setTemplateToDelete(template.id);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Sil</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Silme Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Şablonu Sil</DialogTitle>
            <DialogDescription>
              Bu şablonu silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve şablonu kullanan e-posta bildirimleri etkilenebilir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={deleteTemplate}>
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 