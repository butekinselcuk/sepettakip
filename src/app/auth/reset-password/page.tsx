'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/app/components/ui/use-toast';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simüle edilmiş şifre sıfırlama
      // Gerçek uygulamada burada API çağrısı yapılır
      console.log('Şifre sıfırlama e-posta:', email);
      
      // Demo sıfırlama
      setTimeout(() => {
        setIsSubmitted(true);
        toast({
          title: "E-posta Gönderildi",
          description: "Şifre sıfırlama talimatları e-posta adresinize gönderildi.",
        });
      }, 1500);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Şifre sıfırlama işlemi sırasında bir hata oluştu.",
        variant: "destructive",
      });
      console.error('Şifre sıfırlama hatası:', error);
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
            Şifre Sıfırlama
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            <Link
              href="/auth/login"
              className="font-medium text-primary hover:text-primary/90"
            >
              Giriş sayfasına dön
            </Link>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Şifrenizi mi unuttunuz?</CardTitle>
            <CardDescription>
              {isSubmitted 
                ? "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi." 
                : "E-posta adresinizi girin ve şifre sıfırlama talimatlarını alın."}
            </CardDescription>
          </CardHeader>
          {!isSubmitted ? (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
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
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
                </Button>
              </CardFooter>
            </form>
          ) : (
            <CardContent className="space-y-4">
              <div className="rounded-md bg-blue-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.75.75 0 00.736-.574l.444-1.727a.75.75 0 00-.739-.925H9.75a.75.75 0 00-.75.75v1.75zm3.333 6.25a.75.75 0 00.75-.75v-.25a.75.75 0 00-.75-.75h-1.75a.75.75 0 00-.75.75v.25a.75.75 0 00.75.75H12.333z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1 md:flex md:justify-between">
                    <p className="text-sm text-blue-700">E-posta kutunuzu kontrol edin. Spam klasörünü de kontrol etmeyi unutmayın.</p>
                  </div>
                </div>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => router.push('/auth/login')}
              >
                Giriş Sayfasına Dön
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
} 