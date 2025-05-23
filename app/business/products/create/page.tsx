"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/app/components/ui/use-toast';
import { Loader2, ChevronLeft, Image as ImageIcon, Upload } from 'lucide-react';

// Ürün kategorisi tipi
interface ProductCategory {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parentId: string | null;
}

export default function CreateProductPage() {
  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '1',
    sku: '',
    imageUrl: '',
    categoryId: '',
    isActive: true,
  });
  
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const router = useRouter();
  const { toast } = useToast();
  
  // Kategorileri yükle
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          router.push('/auth/login');
          return;
        }
        
        const response = await axios.get('/api/business/categories', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.status === 200) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error('Kategoriler yüklenirken hata:', error);
        toast({
          title: 'Hata',
          description: 'Kategoriler yüklenirken bir hata oluştu.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, [router, toast]);
  
  // Form alanları değiştiğinde
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { name: string; value: string | boolean }
  ) => {
    const { name, value } = 'target' in e ? e.target : e;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };
  
  // Resim yükleme
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Önizleme için URL oluştur
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };
  
  // Formu gönder
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }
      
      // Form verilerini doğrula
      if (!formValues.name || !formValues.price) {
        toast({
          title: 'Hata',
          description: 'Lütfen ürün adı ve fiyatını doldurun.',
          variant: 'destructive',
        });
        return;
      }
      
      // Formdata oluştur (resim yüklemek için)
      let imageUrl = formValues.imageUrl;
      
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        
        // Resmi yükle
        const uploadResponse = await axios.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });
        
        if (uploadResponse.status === 200) {
          imageUrl = uploadResponse.data.url;
        }
      }
      
      // Ürün oluştur
      const productData = {
        ...formValues,
        price: parseFloat(formValues.price),
        quantity: parseInt(formValues.quantity),
        imageUrl,
      };
      
      const response = await axios.post('/api/business/products', productData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.status === 201) {
        toast({
          title: 'Başarılı',
          description: 'Ürün başarıyla oluşturuldu.',
        });
        
        // Ürünler sayfasına yönlendir
        router.push('/business/products');
      }
    } catch (error) {
      console.error('Ürün oluşturulurken hata:', error);
      toast({
        title: 'Hata',
        description: 'Ürün oluşturulurken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mr-2"
          onClick={() => router.push('/business/products')}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Geri
        </Button>
        <h1 className="text-2xl font-bold">Yeni Ürün Ekle</h1>
      </div>
      
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Ürün Bilgileri</CardTitle>
            <CardDescription>
              Ürün detaylarını doldurun. Zorunlu alanlar * ile işaretlenmiştir.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ürün Adı */}
              <div className="space-y-2">
                <Label htmlFor="name">Ürün Adı *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formValues.name}
                  onChange={handleChange}
                  placeholder="Ürün adını girin"
                  required
                />
              </div>
              
              {/* Kategori */}
              <div className="space-y-2">
                <Label htmlFor="categoryId">Kategori</Label>
                <Select
                  value={formValues.categoryId}
                  onValueChange={(value) => handleChange({ name: 'categoryId', value })}
                >
                  <SelectTrigger id="categoryId">
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {loading ? (
                      <SelectItem value="" disabled>
                        Yükleniyor...
                      </SelectItem>
                    ) : categories.length === 0 ? (
                      <SelectItem value="" disabled>
                        Kategori bulunamadı
                      </SelectItem>
                    ) : (
                      categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Fiyat */}
              <div className="space-y-2">
                <Label htmlFor="price">Fiyat (₺) *</Label>
                <Input
                  id="price"
                  name="price"
                  value={formValues.price}
                  onChange={handleChange}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  required
                />
              </div>
              
              {/* Stok */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Stok Miktarı</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  value={formValues.quantity}
                  onChange={handleChange}
                  type="number"
                  min="0"
                  placeholder="1"
                />
              </div>
              
              {/* SKU */}
              <div className="space-y-2">
                <Label htmlFor="sku">Stok Kodu (SKU)</Label>
                <Input
                  id="sku"
                  name="sku"
                  value={formValues.sku}
                  onChange={handleChange}
                  placeholder="SKU-12345"
                />
              </div>
              
              {/* Durum */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">Durum</Label>
                  <Switch
                    id="isActive"
                    checked={formValues.isActive}
                    onChange={(e) => 
                      handleChange({ name: 'isActive', value: e.target.checked })
                    }
                  />
                </div>
                <p className="text-sm text-gray-500">
                  {formValues.isActive ? 'Ürün aktif olarak listelenecek' : 'Ürün pasif durumda olacak'}
                </p>
              </div>
            </div>
            
            {/* Açıklama */}
            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                name="description"
                value={formValues.description}
                onChange={handleChange}
                placeholder="Ürün açıklaması girin"
                rows={4}
              />
            </div>
            
            {/* Görsel Yükleme */}
            <div className="space-y-2">
              <Label>Ürün Görseli</Label>
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:bg-gray-50">
                <input
                  type="file"
                  id="imageUpload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                
                {imagePreview ? (
                  <div className="relative mb-4">
                    <img
                      src={imagePreview}
                      alt="Ürün önizleme"
                      className="max-h-40 rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                      }}
                    >
                      X
                    </Button>
                  </div>
                ) : (
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                )}
                
                <Label htmlFor="imageUpload" className="cursor-pointer">
                  <div className="mt-2 flex items-center justify-center">
                    <Upload className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="text-sm text-blue-500 font-medium">Resim Yükle</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF (maks. 5MB)</p>
                </Label>
              </div>
              
              {/* Manuel URL giriş alanı (opsiyonel) */}
              <div className="mt-4">
                <Label htmlFor="imageUrl">veya Görsel URL'si</Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  value={formValues.imageUrl}
                  onChange={handleChange}
                  placeholder="https://ornek.com/resim.jpg"
                />
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/business/products')}
              disabled={submitting}
            >
              İptal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                'Ürünü Kaydet'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 