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
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertCircle, 
  Upload, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Clock, 
  Facebook, 
  Instagram, 
  Twitter, 
  Image, 
  CreditCard, 
  Building, 
  Tag,
  Truck
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import axios from 'axios';

interface BusinessProfile {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  tax_id: string | null;
  bank_iban: string | null;
  openingTime: string | null;
  closingTime: string | null;
  deliveryRadius: number | null;
  deliveryFee: number | null;
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  type: string | null;
  tags: string[] | null;
  features: string[] | null;
  user: {
    email: string;
    name: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
  rating: number | null;
}

// Avatar bileşenini yükleyelim
type AvatarProps = {
  className?: string;
  children: React.ReactNode;
};

// AvatarImage bileşeni için özel tanımlama
type AvatarImageProps = {
  src: string;
  alt: string;
};

// AvatarFallback bileşeni için özel tanımlama
type AvatarFallbackProps = {
  className?: string;
  children: React.ReactNode;
};

// Avatar bileşenleri
const Avatar = ({ className, children }: AvatarProps) => (
  <div className={`relative overflow-hidden rounded-full ${className}`}>
    {children}
  </div>
);

const AvatarImage = ({ src, alt }: AvatarImageProps) => (
  src ? <img src={src} alt={alt} className="w-full h-full object-cover" /> : null
);

const AvatarFallback = ({ className, children }: AvatarFallbackProps) => (
  <div className={`flex items-center justify-center w-full h-full bg-gray-200 text-gray-700 ${className}`}>
    {children}
  </div>
);

export default function BusinessProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  
  // Farklı form verileri
  const [generalInfo, setGeneralInfo] = useState({
    name: '',
    description: '',
    type: '',
    tags: [] as string[],
  });
  
  const [contactInfo, setContactInfo] = useState({
    phone: '',
    email: '',
    website: '',
    address: '',
  });
  
  const [locationInfo, setLocationInfo] = useState({
    latitude: 0,
    longitude: 0,
    deliveryRadius: 0,
    deliveryFee: 0,
  });
  
  const [businessHours, setBusinessHours] = useState({
    openingTime: '',
    closingTime: '',
  });
  
  const [financialInfo, setFinancialInfo] = useState({
    tax_id: '',
    bank_iban: '',
  });
  
  const [socialMedia, setSocialMedia] = useState({
    facebook: '',
    instagram: '',
    twitter: '',
  });
  
  const [activeTab, setActiveTab] = useState('general');
  const [tagInput, setTagInput] = useState('');
  
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

        const response = await axios.get('/api/business/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = response.data;
        setProfile(data);
        
        // Form verilerini güncelle
        setGeneralInfo({
          name: data.name || '',
          description: data.description || '',
          type: data.type || '',
          tags: data.tags || [],
        });
        
        setContactInfo({
          phone: data.phone || '',
          email: data.email || '',
          website: data.website || '',
          address: data.address || '',
        });
        
        setLocationInfo({
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
          deliveryRadius: data.deliveryRadius || 0,
          deliveryFee: data.deliveryFee || 0,
        });
        
        setBusinessHours({
          openingTime: data.openingTime || '',
          closingTime: data.closingTime || '',
        });
        
        setFinancialInfo({
          tax_id: data.tax_id || '',
          bank_iban: data.bank_iban || '',
        });
        
        setSocialMedia({
          facebook: data.facebook || '',
          instagram: data.instagram || '',
          twitter: data.twitter || '',
        });
      } catch (err) {
        console.error('Error fetching business profile:', err);
        setError('Profil bilgileri yüklenemedi. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinessProfile();
  }, [router]);

  // Form verileri güncelleme
  const handleGeneralInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setGeneralInfo(prev => ({ ...prev, [name]: value }));
  };
  
  const handleContactInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactInfo(prev => ({ ...prev, [name]: value }));
  };
  
  const handleLocationInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocationInfo(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };
  
  const handleBusinessHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBusinessHours(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFinancialInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFinancialInfo(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSocialMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSocialMedia(prev => ({ ...prev, [name]: value }));
  };
  
  // Etiket işlemleri
  const addTag = () => {
    if (tagInput.trim() && !generalInfo.tags.includes(tagInput.trim())) {
      setGeneralInfo(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    setGeneralInfo(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  // Form gönderme işlemleri
  const updateGeneralInfo = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }
      
      await axios.put('/api/business/profile', generalInfo, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setSuccess('Genel bilgiler başarıyla güncellendi');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating general info:', err);
      setError('Bilgiler güncellenirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const updateContactInfo = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }
      
      await axios.patch('/api/business/profile?type=contact', contactInfo, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setSuccess('İletişim bilgileri başarıyla güncellendi');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating contact info:', err);
      setError('Bilgiler güncellenirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const updateLocationInfo = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }
      
      await axios.patch('/api/business/profile?type=location', locationInfo, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setSuccess('Konum bilgileri başarıyla güncellendi');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating location info:', err);
      setError('Bilgiler güncellenirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const updateBusinessHours = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }
      
      await axios.patch('/api/business/profile?type=business-hours', businessHours, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setSuccess('Çalışma saatleri başarıyla güncellendi');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating business hours:', err);
      setError('Bilgiler güncellenirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const updateFinancialInfo = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }
      
      await axios.put('/api/business/profile', financialInfo, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setSuccess('Finansal bilgiler başarıyla güncellendi');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating financial info:', err);
      setError('Bilgiler güncellenirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const updateSocialMedia = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }
      
      await axios.patch('/api/business/profile?type=social-media', socialMedia, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setSuccess('Sosyal medya bilgileri başarıyla güncellendi');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating social media links:', err);
      setError('Bilgiler güncellenirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Resim yükleme fonksiyonu
  const uploadImage = async (file: File, type: 'logo' | 'cover') => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      
      // Gerçek uygulamada dosya yükleme servisi kullanılır
      // Burada sadece simüle ediyoruz
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const imageUrl = `https://example.com/images/${Date.now()}_${file.name}`;
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }
      
      const data = type === 'logo' 
        ? { logoUrl: imageUrl } 
        : { coverUrl: imageUrl };
      
      await axios.patch('/api/business/profile?type=images', data, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (type === 'logo') {
        setProfile(prev => prev ? {...prev, logoUrl: imageUrl} : null);
      } else {
        setProfile(prev => prev ? {...prev, coverUrl: imageUrl} : null);
      }
      
      setSuccess(`${type === 'logo' ? 'Logo' : 'Kapak görseli'} başarıyla yüklendi`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Görsel yüklenirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    uploadImage(files[0], type);
  };

  if (isLoading) {
    return (
      <BusinessLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </BusinessLayout>
    );
  }

  return (
    <BusinessLayout>
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">İşletme Profili</h1>
            <p className="text-gray-500">İşletmenizin bilgilerini yönetin ve güncelleyin</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={profile?.status === 'ACTIVE' ? 'default' : 'destructive'}>
              {profile?.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
            </Badge>
            <Button
              variant="outline"
              onClick={() => router.push('/business/dashboard')}
            >
              Dashboard'a Dön
            </Button>
          </div>
        </div>
        
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profil Kartı */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex justify-center">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile?.logoUrl || ''} alt={profile?.name || 'İşletme'} />
                    <AvatarFallback className="text-lg font-bold">
                      {profile?.name?.substring(0, 2).toUpperCase() || 'İŞ'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-center mt-4">{profile?.name}</CardTitle>
                <CardDescription className="text-center">
                  {profile?.type || 'İşletme'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">{profile?.user?.email}</span>
                  </div>
                  {profile?.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">{profile?.phone}</span>
                    </div>
                  )}
                  {profile?.address && (
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-1" />
                      <span className="text-sm">{profile?.address}</span>
                    </div>
                  )}
                  {(profile?.openingTime && profile?.closingTime) && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">{profile?.openingTime} - {profile?.closingTime}</span>
                    </div>
                  )}
                </div>
                
                {profile?.tags && profile.tags.length > 0 && (
                  <div className="mt-6">
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              <Separator />
              <CardFooter className="flex justify-between py-4">
                <div className="text-sm text-gray-500">Üyelik: <span className="font-medium">{new Date(profile?.createdAt || '').toLocaleDateString('tr-TR')}</span></div>
                {profile?.rating && (
                  <div className="text-sm text-gray-500">Puan: <span className="font-medium">{profile.rating.toFixed(1)}/5</span></div>
                )}
              </CardFooter>
            </Card>
            
            {/* Görsel Yükleme Kartı */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Görseller</CardTitle>
                <CardDescription>
                  Logo ve kapak fotoğrafınızı güncelleyin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="logo">Logo</Label>
                  <div className="flex items-center mt-2">
                    <div className="relative">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={profile?.logoUrl || ''} alt="Logo" />
                        <AvatarFallback>Logo</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="ml-4">
                      <Label htmlFor="logoUpload" className="cursor-pointer">
                        <div className="flex items-center">
                          <Upload className="h-4 w-4 mr-2" />
                          <span>Yükle</span>
                        </div>
                      </Label>
                      <Input
                        id="logoUpload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'logo')}
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="cover">Kapak Fotoğrafı</Label>
                  <div className="mt-2 relative">
                    <div className="aspect-video rounded-md bg-gray-100 overflow-hidden">
                      {profile?.coverUrl ? (
                        <img
                          src={profile.coverUrl}
                          alt="Kapak"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <Label htmlFor="coverUpload" className="cursor-pointer">
                        <div className="flex items-center">
                          <Upload className="h-4 w-4 mr-2" />
                          <span>Kapak Fotoğrafı Yükle</span>
                        </div>
                      </Label>
                      <Input
                        id="coverUpload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'cover')}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Ayarlar Sekmeleri */}
          <div className="md:col-span-2">
            <Card>
              <CardContent className="p-0">
                <Tabs className="w-full" defaultValue={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="general">Genel</TabsTrigger>
                    <TabsTrigger value="contact">İletişim</TabsTrigger>
                    <TabsTrigger value="details">Detaylar</TabsTrigger>
                  </TabsList>
                  
                  {/* Genel Bilgiler */}
                  <TabsContent value="general" className="p-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">İşletme Adı</Label>
                        <Input
                          id="name"
                          name="name"
                          value={generalInfo.name}
                          onChange={handleGeneralInfoChange}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="description">Açıklama</Label>
                        <Textarea
                          id="description"
                          name="description"
                          value={generalInfo.description || ''}
                          onChange={handleGeneralInfoChange}
                          className="mt-1"
                          rows={4}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="type">İşletme Türü</Label>
                        <Input
                          id="type"
                          name="type"
                          value={generalInfo.type || ''}
                          onChange={handleGeneralInfoChange}
                          className="mt-1"
                          placeholder="Restoran, Market, Eczane vb."
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="tags">Etiketler</Label>
                        <div className="flex mt-1">
                          <Input
                            id="tags"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            placeholder="Etiket ekle"
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          />
                          <Button 
                            type="button" 
                            onClick={addTag} 
                            className="ml-2"
                          >
                            Ekle
                          </Button>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                          {generalInfo.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {tag}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 rounded-full"
                                onClick={() => removeTag(tag)}
                              >
                                &times;
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <Button 
                        onClick={updateGeneralInfo} 
                        disabled={isSaving}
                        className="mt-2"
                      >
                        {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                      </Button>
                    </div>
                  </TabsContent>
                  
                  {/* İletişim Bilgileri */}
                  <TabsContent value="contact" className="p-6">
                    <div className="space-y-6">
                      {/* İletişim Formu */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center">
                          <Phone className="h-5 w-5 mr-2" />
                          İletişim Bilgileri
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="contact-phone">Telefon</Label>
                            <Input
                              id="contact-phone"
                              name="phone"
                              value={contactInfo.phone || ''}
                              onChange={handleContactInfoChange}
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="contact-email">E-posta</Label>
                            <Input
                              id="contact-email"
                              name="email"
                              value={contactInfo.email || ''}
                              onChange={handleContactInfoChange}
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="contact-website">Web Sitesi</Label>
                            <Input
                              id="contact-website"
                              name="website"
                              value={contactInfo.website || ''}
                              onChange={handleContactInfoChange}
                              className="mt-1"
                              placeholder="https://example.com"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="contact-address">Adres</Label>
                          <Textarea
                            id="contact-address"
                            name="address"
                            value={contactInfo.address || ''}
                            onChange={handleContactInfoChange}
                            className="mt-1"
                          />
                        </div>
                        
                        <Button 
                          onClick={updateContactInfo} 
                          disabled={isSaving}
                        >
                          {isSaving ? 'Kaydediliyor...' : 'İletişim Bilgilerini Kaydet'}
                        </Button>
                      </div>
                      
                      <Separator />
                      
                      {/* Sosyal Medya */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center">
                          <Globe className="h-5 w-5 mr-2" />
                          Sosyal Medya
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="facebook" className="flex items-center">
                              <Facebook className="h-4 w-4 mr-2" />
                              Facebook
                            </Label>
                            <Input
                              id="facebook"
                              name="facebook"
                              value={socialMedia.facebook || ''}
                              onChange={handleSocialMediaChange}
                              className="mt-1"
                              placeholder="https://facebook.com/yourpage"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="instagram" className="flex items-center">
                              <Instagram className="h-4 w-4 mr-2" />
                              Instagram
                            </Label>
                            <Input
                              id="instagram"
                              name="instagram"
                              value={socialMedia.instagram || ''}
                              onChange={handleSocialMediaChange}
                              className="mt-1"
                              placeholder="https://instagram.com/youraccount"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="twitter" className="flex items-center">
                              <Twitter className="h-4 w-4 mr-2" />
                              Twitter
                            </Label>
                            <Input
                              id="twitter"
                              name="twitter"
                              value={socialMedia.twitter || ''}
                              onChange={handleSocialMediaChange}
                              className="mt-1"
                              placeholder="https://twitter.com/youraccount"
                            />
                          </div>
                        </div>
                        
                        <Button 
                          onClick={updateSocialMedia} 
                          disabled={isSaving}
                        >
                          {isSaving ? 'Kaydediliyor...' : 'Sosyal Medya Bilgilerini Kaydet'}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Detaylar */}
                  <TabsContent value="details" className="p-6">
                    <div className="space-y-6">
                      {/* Konum Bilgileri */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center">
                          <MapPin className="h-5 w-5 mr-2" />
                          Konum ve Teslimat
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="latitude">Enlem</Label>
                            <Input
                              id="latitude"
                              name="latitude"
                              type="number"
                              step="0.000001"
                              value={locationInfo.latitude || ''}
                              onChange={handleLocationInfoChange}
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="longitude">Boylam</Label>
                            <Input
                              id="longitude"
                              name="longitude"
                              type="number"
                              step="0.000001"
                              value={locationInfo.longitude || ''}
                              onChange={handleLocationInfoChange}
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="deliveryRadius">Teslimat Yarıçapı (km)</Label>
                            <Input
                              id="deliveryRadius"
                              name="deliveryRadius"
                              type="number"
                              step="0.1"
                              value={locationInfo.deliveryRadius || ''}
                              onChange={handleLocationInfoChange}
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="deliveryFee">Teslimat Ücreti (₺)</Label>
                            <Input
                              id="deliveryFee"
                              name="deliveryFee"
                              type="number"
                              step="0.01"
                              value={locationInfo.deliveryFee || ''}
                              onChange={handleLocationInfoChange}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        
                        <Button 
                          onClick={updateLocationInfo} 
                          disabled={isSaving}
                        >
                          {isSaving ? 'Kaydediliyor...' : 'Konum Bilgilerini Kaydet'}
                        </Button>
                      </div>
                      
                      <Separator />
                      
                      {/* Çalışma Saatleri */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center">
                          <Clock className="h-5 w-5 mr-2" />
                          Çalışma Saatleri
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="openingTime">Açılış Saati</Label>
                            <Input
                              id="openingTime"
                              name="openingTime"
                              type="time"
                              value={businessHours.openingTime || ''}
                              onChange={handleBusinessHoursChange}
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="closingTime">Kapanış Saati</Label>
                            <Input
                              id="closingTime"
                              name="closingTime"
                              type="time"
                              value={businessHours.closingTime || ''}
                              onChange={handleBusinessHoursChange}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        
                        <Button 
                          onClick={updateBusinessHours} 
                          disabled={isSaving}
                        >
                          {isSaving ? 'Kaydediliyor...' : 'Çalışma Saatlerini Kaydet'}
                        </Button>
                      </div>
                      
                      <Separator />
                      
                      {/* Finansal Bilgiler */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center">
                          <CreditCard className="h-5 w-5 mr-2" />
                          Finansal Bilgiler
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="tax_id">Vergi Numarası</Label>
                            <Input
                              id="tax_id"
                              name="tax_id"
                              value={financialInfo.tax_id || ''}
                              onChange={handleFinancialInfoChange}
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="bank_iban">IBAN</Label>
                            <Input
                              id="bank_iban"
                              name="bank_iban"
                              value={financialInfo.bank_iban || ''}
                              onChange={handleFinancialInfoChange}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        
                        <Button 
                          onClick={updateFinancialInfo} 
                          disabled={isSaving}
                        >
                          {isSaving ? 'Kaydediliyor...' : 'Finansal Bilgileri Kaydet'}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </BusinessLayout>
  );
} 