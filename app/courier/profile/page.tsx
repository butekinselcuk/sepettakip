"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/app/components/ui/use-toast";
import { useAuth } from '@/components/AuthProvider';
import LoadingSpinner from '@/components/LoadingSpinner';
import axios from 'axios';

// Kurye profil sayfası
export default function CourierProfilePage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();
  
  // Kişisel bilgiler için state
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  
  // Araç bilgileri için state
  const [vehicleInfo, setVehicleInfo] = useState({
    vehicleType: ''
  });
  
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Profil bilgilerini yükle
  useEffect(() => {
    if (token && user?.role === 'COURIER') {
      fetchProfileData();
    } else if (!isLoading && (!token || user?.role !== 'COURIER')) {
      router.push('/auth/login');
    }
  }, [token, user, isLoading, router]);

  // Profil bilgilerini API'den getir
  const fetchProfileData = async () => {
    try {
      setProfileLoading(true);
      const response = await axios.get('/api/courier/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.profile) {
        const { name, email } = response.data.profile;
        const { phone, vehicleType } = response.data.profile.courier;
        
        setPersonalInfo({
          name: name || '',
          email: email || '',
          phone: phone || '',
        });
        
        setVehicleInfo({
          vehicleType: vehicleType || '',
        });
      }
    } catch (error) {
      console.error('Profil bilgileri alınırken hata oluştu:', error);
      toast({
        title: "Hata",
        description: "Profil bilgileri yüklenemedi. Lütfen daha sonra tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // Kişisel bilgileri güncelle
  const updatePersonalInfo = async () => {
    try {
      setIsSubmitting(true);
      
      const response = await axios.patch('/api/courier/profile', {
        name: personalInfo.name,
        phone: personalInfo.phone,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setIsEditingPersonal(false);
      toast({
        title: "Başarılı",
        description: "Kişisel bilgileriniz başarıyla güncellendi.",
      });
    } catch (error) {
      console.error('Kişisel bilgiler güncellenirken hata oluştu:', error);
      toast({
        title: "Hata",
        description: "Bilgileriniz güncellenemedi. Lütfen daha sonra tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Araç bilgilerini güncelle
  const updateVehicleInfo = async () => {
    try {
      setIsSubmitting(true);
      
      const response = await axios.patch('/api/courier/profile', {
        vehicleType: vehicleInfo.vehicleType,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setIsEditingVehicle(false);
      toast({
        title: "Başarılı",
        description: "Araç bilgileriniz başarıyla güncellendi.",
      });
    } catch (error) {
      console.error('Araç bilgileri güncellenirken hata oluştu:', error);
      toast({
        title: "Hata",
        description: "Bilgileriniz güncellenemedi. Lütfen daha sonra tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || profileLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-8">Kurye Profili</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sol sütun - Profil kartı */}
        <div className="col-span-1">
          <Card>
            <CardHeader className="flex flex-col items-center">
              <Avatar className="h-24 w-24 mb-2">
                <AvatarImage src={`https://avatar.vercel.sh/${personalInfo.name}`} />
                <AvatarFallback>{personalInfo.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <CardTitle>{personalInfo.name}</CardTitle>
              <CardDescription>{personalInfo.email}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm font-medium">Kurye</p>
              <p className="text-sm text-muted-foreground mt-1">Teslimat Görevlisi</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Sağ sütun - Bilgiler */}
        <div className="col-span-1 md:col-span-2">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="personal">Kişisel Bilgiler</TabsTrigger>
              <TabsTrigger value="vehicle">Araç Bilgileri</TabsTrigger>
            </TabsList>
            
            {/* Kişisel Bilgiler Tab */}
            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>Kişisel Bilgiler</CardTitle>
                  <CardDescription>
                    Profil bilgilerinizi buradan görüntüleyebilir ve düzenleyebilirsiniz.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">İsim</Label>
                    {isEditingPersonal ? (
                      <Input 
                        id="name" 
                        value={personalInfo.name}
                        onChange={(e) => setPersonalInfo(prev => ({ ...prev, name: e.target.value }))}
                      />
                    ) : (
                      <p className="text-sm font-medium">{personalInfo.name}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">E-posta</Label>
                    <p className="text-sm font-medium">{personalInfo.email}</p>
                    <p className="text-xs text-muted-foreground">E-posta adresiniz değiştirilemez.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    {isEditingPersonal ? (
                      <Input 
                        id="phone" 
                        value={personalInfo.phone}
                        onChange={(e) => setPersonalInfo(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    ) : (
                      <p className="text-sm font-medium">{personalInfo.phone || "Henüz telefon numarası eklenmemiş"}</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  {isEditingPersonal ? (
                    <>
                      <Button 
                        variant="outline" 
                        className="mr-2"
                        onClick={() => setIsEditingPersonal(false)}
                        disabled={isSubmitting}
                      >
                        İptal
                      </Button>
                      <Button 
                        onClick={updatePersonalInfo}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditingPersonal(true)}>Düzenle</Button>
                  )}
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Araç Bilgileri Tab */}
            <TabsContent value="vehicle">
              <Card>
                <CardHeader>
                  <CardTitle>Araç Bilgileri</CardTitle>
                  <CardDescription>
                    Teslimat için kullandığınız araç bilgilerinizi buradan güncelleyebilirsiniz.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleType">Araç Tipi</Label>
                    {isEditingVehicle ? (
                      <Select 
                        value={vehicleInfo.vehicleType} 
                        onValueChange={(value) => setVehicleInfo(prev => ({ ...prev, vehicleType: value }))}
                      >
                        <SelectTrigger id="vehicleType">
                          <SelectValue placeholder="Araç tipi seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MOTORCYCLE">Motosiklet</SelectItem>
                          <SelectItem value="BICYCLE">Bisiklet</SelectItem>
                          <SelectItem value="CAR">Otomobil</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm font-medium">
                        {vehicleInfo.vehicleType === 'MOTORCYCLE' ? 'Motosiklet' : 
                         vehicleInfo.vehicleType === 'BICYCLE' ? 'Bisiklet' : 
                         vehicleInfo.vehicleType === 'CAR' ? 'Otomobil' : 
                         'Belirtilmemiş'}
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  {isEditingVehicle ? (
                    <>
                      <Button 
                        variant="outline" 
                        className="mr-2"
                        onClick={() => setIsEditingVehicle(false)}
                        disabled={isSubmitting}
                      >
                        İptal
                      </Button>
                      <Button 
                        onClick={updateVehicleInfo}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditingVehicle(true)}>Düzenle</Button>
                  )}
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 