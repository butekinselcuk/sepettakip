"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, ArrowLeft, User } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    orders: number;
  };
}

export default function UserEdit({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    status: "",
    password: "",
  });

  // Get the ID directly without React.use for now
  // Next.js still supports direct access to params but will require React.use in future versions
  const userId = params.id;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/users/${userId}`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            router.push("/auth/login");
            return;
          }
          
          if (response.status === 404) {
            setError("Kullanıcı bulunamadı");
            setLoading(false);
            return;
          }
          
          throw new Error("Kullanıcı bilgileri alınamadı");
        }
        
        const userData = await response.json();
        setUser(userData);
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          role: userData.role || "",
          status: userData.status || "",
          password: "",
        });
        
        setLoading(false);
      } catch (err) {
        console.error("Kullanıcı getirme hatası:", err);
        setError("Kullanıcı bilgileri yüklenirken bir hata oluştu.");
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        credentials: 'include',
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Kullanıcı güncellenirken bir hata oluştu");
      }
      
      setSuccessMessage("Kullanıcı başarıyla güncellendi!");
      setUser(data);
      
      // Şifre alanını temizle
      setFormData(prev => ({
        ...prev,
        password: "",
      }));
      
      // 3 saniye sonra başarı mesajını temizle
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err: any) {
      console.error("Kullanıcı güncelleme hatası:", err);
      setError(err.message || "Kullanıcı güncellenirken bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-700";
      case "BUSINESS":
        return "bg-purple-100 text-purple-700";
      case "COURIER":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-green-100 text-green-700";
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700";
      case "INACTIVE":
        return "bg-yellow-100 text-yellow-700";
      case "SUSPENDED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center">
        <Button 
          variant="ghost" 
          className="mr-4" 
          onClick={() => router.push("/admin/users")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri
        </Button>
        <h1 className="text-2xl font-bold">Kullanıcı Düzenle</h1>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Hata</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {successMessage && (
        <Alert className="mb-6 border-green-500 text-green-700 bg-green-50">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}
      
      {loading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/4" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : user ? (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="bg-gray-100 rounded-full h-12 w-12 flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <CardTitle>{user.name}</CardTitle>
                  <div className="flex space-x-2 mt-1">
                    <Badge variant="outline" className={getRoleColor(user.role)}>
                      {user.role}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(user.status)}>
                      {user.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <CardDescription className="pt-2">
                ID: {user.id} · Kayıt: {formatDate(user.createdAt, "dd MMM yyyy")} · 
                Sipariş: {user._count.orders || 0}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="general">Genel Bilgiler</TabsTrigger>
                  <TabsTrigger value="security">Güvenlik</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general">
                  <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Ad Soyad</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Kullanıcı adı soyadı"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">E-posta</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="kullanici@example.com"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefon</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="05xx xxx xx xx"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="role">Rol</Label>
                        <Select 
                          value={formData.role} 
                          onValueChange={(value) => handleSelectChange("role", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Rol seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USER">Kullanıcı</SelectItem>
                            <SelectItem value="ADMIN">Yönetici</SelectItem>
                            <SelectItem value="BUSINESS">İşletme</SelectItem>
                            <SelectItem value="COURIER">Kurye</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="status">Durum</Label>
                        <Select 
                          value={formData.status} 
                          onValueChange={(value) => handleSelectChange("status", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Durum seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Aktif</SelectItem>
                            <SelectItem value="INACTIVE">Pasif</SelectItem>
                            <SelectItem value="SUSPENDED">Askıya Alınmış</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => router.push("/admin/users")}
                      >
                        İptal
                      </Button>
                      <Button type="submit" disabled={saving}>
                        {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                      </Button>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="security">
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="password">
                          Yeni Şifre <span className="text-gray-400 text-sm">(Değiştirmek istemiyorsanız boş bırakın)</span>
                        </Label>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="••••••••"
                        />
                      </div>
                      
                      {user.email === "admin@sepettakip.com" && (
                        <Alert className="mb-6 border-amber-500 text-amber-700 bg-amber-50">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Dikkat</AlertTitle>
                          <AlertDescription>
                            Bu bir sistem hesabıdır. Rol ve durum değişiklikleri uygulanmayacaktır.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                    
                    <div className="mt-6 flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => router.push("/admin/users")}
                      >
                        İptal
                      </Button>
                      <Button type="submit" disabled={saving}>
                        {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="mb-4">
              <AlertCircle className="h-10 w-10 text-red-600 mx-auto" />
              <h3 className="text-lg font-medium mt-2">Kullanıcı Bulunamadı</h3>
              <p className="text-gray-500 mt-1">İstenen kullanıcı bilgilerine erişilemedi veya kullanıcı mevcut değil.</p>
            </div>
            <Button 
              className="mt-2" 
              onClick={() => router.push("/admin/users")}
            >
              Kullanıcı Listesine Dön
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 