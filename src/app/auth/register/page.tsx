'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/app/components/ui/use-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Hata",
        description: "Şifreler eşleşmiyor.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      // Simüle edilmiş kayıt işlemi
      // Gerçek uygulamada burada API çağrısı yapılır
      console.log('Kayıt bilgileri:', { name, email, password, role });
      
      // Demo kayıt kontrolü
      setTimeout(() => {
        toast({
          title: "Kayıt Başarılı",
          description: "Hesabınız başarıyla oluşturuldu.",
        });
        
        // Giriş sayfasına yönlendir
        setTimeout(() => {
          router.push('/auth/login');
        }, 1000);
      }, 1500);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Kayıt yapılırken bir hata oluştu.",
        variant: "destructive",
      });
      console.error('Kayıt hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-primary">SepetTakip</h1>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Yeni Hesap Oluştur
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Zaten hesabınız var mı?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-primary hover:text-primary/90"
            >
              Giriş yapın
            </Link>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Hesap oluşturun</CardTitle>
            <CardDescription>
              Lütfen gerekli bilgileri doldurun
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">İsim Soyisim</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="İsim Soyisim"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Hesap Tipi</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Hesap tipinizi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business">İşletme</SelectItem>
                    <SelectItem value="courier">Kurye</SelectItem>
                    <SelectItem value="customer">Müşteri</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Şifre</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
} 