'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, PlusCircle, CreditCard, Trash2, Pencil } from 'lucide-react';
import { toast } from '@/app/components/ui/use-toast';

interface PaymentMethod {
  id: string;
  type: 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_ACCOUNT';
  cardNumber?: string;
  cardHolder?: string;
  expiryMonth?: string;
  expiryYear?: string;
  isDefault: boolean;
  lastFourDigits?: string;
  bankName?: string;
  accountNumber?: string;
  createdAt: string;
}

export default function PaymentMethodsPage() {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formValues, setFormValues] = useState({
    type: 'CREDIT_CARD',
    cardNumber: '',
    cardHolder: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    isDefault: false,
    bankName: '',
    accountNumber: '',
  });

  useEffect(() => {
    setIsClient(true);
    
    // Auth kontrolü
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Token bulunamadı, login sayfasına yönlendiriliyor");
      router.push("/auth/login");
      return;
    }
    
    // Kullanıcı bilgilerini kontrol et
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        console.error("Kullanıcı bilgisi bulunamadı, login sayfasına yönlendiriliyor");
        router.push("/auth/login");
        return;
      }
      
      const userData = JSON.parse(storedUser);
      if (userData.role !== "CUSTOMER") {
        console.error("Kullanıcı rolü CUSTOMER değil, login sayfasına yönlendiriliyor");
        router.push("/auth/login");
        return;
      }
      
      // Ödeme yöntemlerini yükle
      fetchPaymentMethods();
    } catch (error) {
      console.error("Kullanıcı bilgisi işlenirken hata:", error);
      router.push("/auth/login");
    }
  }, [router]);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Oturum açmanız gerekiyor');
        setLoading(false);
        return;
      }

      // Gerçek API çağrısı burada yapılacak, şimdilik mock data kullanıyoruz
      // const response = await fetch('/api/customer/payment-methods', {
      //   headers: {
      //     Authorization: `Bearer ${token}`
      //   }
      // });
      // const data = await response.json();
      // setPaymentMethods(data.paymentMethods || []);

      // Mock data
      const mockData: PaymentMethod[] = [
        {
          id: '1',
          type: 'CREDIT_CARD',
          cardHolder: 'JOHN DOE',
          lastFourDigits: '1234',
          expiryMonth: '12',
          expiryYear: '2026',
          isDefault: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          type: 'DEBIT_CARD',
          cardHolder: 'JOHN DOE',
          lastFourDigits: '5678',
          expiryMonth: '06',
          expiryYear: '2025',
          isDefault: false,
          createdAt: new Date().toISOString()
        }
      ];
      
      setPaymentMethods(mockData);
      setLoading(false);
    } catch (error) {
      console.error('Ödeme yöntemleri alınırken hata:', error);
      setError('Ödeme yöntemleri alınamadı');
      setLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormValues({
      ...formValues,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormValues({
      ...formValues,
      [name]: value
    });
  };

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Hata",
          description: "Oturum açmanız gerekiyor",
          variant: "destructive"
        });
        return;
      }

      // Gerçek API çağrısı burada yapılacak
      // const response = await fetch('/api/customer/payment-methods', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${token}`
      //   },
      //   body: JSON.stringify(formValues)
      // });
      // const data = await response.json();

      // Mock data ekleme
      const newPaymentMethod: PaymentMethod = {
        id: Math.random().toString(36).substring(7),
        type: formValues.type as 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_ACCOUNT',
        cardHolder: formValues.cardHolder,
        lastFourDigits: formValues.cardNumber.slice(-4),
        expiryMonth: formValues.expiryMonth,
        expiryYear: formValues.expiryYear,
        isDefault: formValues.isDefault,
        bankName: formValues.type === 'BANK_ACCOUNT' ? formValues.bankName : undefined,
        accountNumber: formValues.type === 'BANK_ACCOUNT' ? formValues.accountNumber : undefined,
        createdAt: new Date().toISOString()
      };

      // Eğer yeni eklenen kart varsayılan ise, diğerlerinin varsayılanını kaldır
      if (formValues.isDefault) {
        setPaymentMethods(prev => prev.map(method => ({
          ...method,
          isDefault: false
        })));
      }

      setPaymentMethods(prev => [...prev, newPaymentMethod]);
      setShowAddDialog(false);
      
      // Form değerlerini sıfırla
      setFormValues({
        type: 'CREDIT_CARD',
        cardNumber: '',
        cardHolder: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: '',
        isDefault: false,
        bankName: '',
        accountNumber: '',
      });

      toast({
        title: "Başarılı",
        description: "Ödeme yöntemi başarıyla eklendi"
      });
    } catch (error) {
      console.error('Ödeme yöntemi eklenirken hata:', error);
      toast({
        title: "Hata",
        description: "Ödeme yöntemi eklenemedi",
        variant: "destructive"
      });
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    if (!window.confirm('Bu ödeme yöntemini silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Hata",
          description: "Oturum açmanız gerekiyor",
          variant: "destructive"
        });
        return;
      }

      // Gerçek API çağrısı burada yapılacak
      // await fetch(`/api/customer/payment-methods/${id}`, {
      //   method: 'DELETE',
      //   headers: {
      //     Authorization: `Bearer ${token}`
      //   }
      // });

      setPaymentMethods(prev => prev.filter(method => method.id !== id));

      toast({
        title: "Başarılı",
        description: "Ödeme yöntemi başarıyla silindi"
      });
    } catch (error) {
      console.error('Ödeme yöntemi silinirken hata:', error);
      toast({
        title: "Hata",
        description: "Ödeme yöntemi silinemedi",
        variant: "destructive"
      });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Hata",
          description: "Oturum açmanız gerekiyor",
          variant: "destructive"
        });
        return;
      }

      // Gerçek API çağrısı burada yapılacak
      // await fetch(`/api/customer/payment-methods/${id}/default`, {
      //   method: 'PATCH',
      //   headers: {
      //     Authorization: `Bearer ${token}`
      //   }
      // });

      setPaymentMethods(prev => prev.map(method => ({
        ...method,
        isDefault: method.id === id
      })));

      toast({
        title: "Başarılı",
        description: "Varsayılan ödeme yöntemi güncellendi"
      });
    } catch (error) {
      console.error('Varsayılan ödeme yöntemi güncellenirken hata:', error);
      toast({
        title: "Hata",
        description: "Varsayılan ödeme yöntemi güncellenemedi",
        variant: "destructive"
      });
    }
  };

  if (!isClient) {
    return null;
  }

  const formatCardNumber = (lastFourDigits?: string) => {
    return lastFourDigits ? `**** **** **** ${lastFourDigits}` : '';
  };

  const formatExpiryDate = (month?: string, year?: string) => {
    return month && year ? `${month}/${year.slice(-2)}` : '';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <div className="flex items-center mb-4">
              <Button variant="ghost" onClick={() => router.back()} className="mr-2">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Geri
              </Button>
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Ödeme Yöntemlerim
              </h1>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Ödeme yöntemlerinizi yönetin, yeni kart ekleyin veya varsayılan ödeme yönteminizi değiştirin.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Yeni Ödeme Yöntemi
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Yeni Ödeme Yöntemi Ekle</DialogTitle>
                  <DialogDescription>
                    Ödeme bilgilerinizi güvenli bir şekilde ekleyin.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddPaymentMethod}>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Ödeme Yöntemi Türü</Label>
                      <Select
                        value={formValues.type}
                        onValueChange={(value) => handleSelectChange('type', value)}
                      >
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Ödeme yöntemi türünü seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CREDIT_CARD">Kredi Kartı</SelectItem>
                          <SelectItem value="DEBIT_CARD">Banka Kartı</SelectItem>
                          <SelectItem value="BANK_ACCOUNT">Banka Hesabı</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {(formValues.type === 'CREDIT_CARD' || formValues.type === 'DEBIT_CARD') && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="cardNumber">Kart Numarası</Label>
                          <Input
                            id="cardNumber"
                            name="cardNumber"
                            value={formValues.cardNumber}
                            onChange={handleFormChange}
                            placeholder="1234 5678 9012 3456"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cardHolder">Kart Üzerindeki İsim</Label>
                          <Input
                            id="cardHolder"
                            name="cardHolder"
                            value={formValues.cardHolder}
                            onChange={handleFormChange}
                            placeholder="AD SOYAD"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="expiryMonth">Son Kullanma Ay</Label>
                            <Select
                              value={formValues.expiryMonth}
                              onValueChange={(value) => handleSelectChange('expiryMonth', value)}
                            >
                              <SelectTrigger id="expiryMonth">
                                <SelectValue placeholder="Ay" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(month => (
                                  <SelectItem key={month} value={month}>{month}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="expiryYear">Son Kullanma Yıl</Label>
                            <Select
                              value={formValues.expiryYear}
                              onValueChange={(value) => handleSelectChange('expiryYear', value)}
                            >
                              <SelectTrigger id="expiryYear">
                                <SelectValue placeholder="Yıl" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() + i).toString()).map(year => (
                                  <SelectItem key={year} value={year}>{year}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvv">CVV/CVC</Label>
                          <Input
                            id="cvv"
                            name="cvv"
                            value={formValues.cvv}
                            onChange={handleFormChange}
                            placeholder="123"
                            maxLength={4}
                            required
                          />
                        </div>
                      </>
                    )}

                    {formValues.type === 'BANK_ACCOUNT' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="bankName">Banka Adı</Label>
                          <Input
                            id="bankName"
                            name="bankName"
                            value={formValues.bankName}
                            onChange={handleFormChange}
                            placeholder="Banka adı"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="accountNumber">Hesap Numarası</Label>
                          <Input
                            id="accountNumber"
                            name="accountNumber"
                            value={formValues.accountNumber}
                            onChange={handleFormChange}
                            placeholder="Hesap numarası"
                            required
                          />
                        </div>
                      </>
                    )}

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isDefault"
                        name="isDefault"
                        checked={formValues.isDefault}
                        onCheckedChange={(checked) => 
                          setFormValues({...formValues, isDefault: checked === true})
                        }
                      />
                      <label
                        htmlFor="isDefault"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Varsayılan ödeme yöntemi olarak ayarla
                      </label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Kaydet</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {paymentMethods.length === 0 ? (
              <Card>
                <CardContent className="pt-6 pb-6 text-center">
                  <p className="text-gray-500">Henüz kayıtlı ödeme yönteminiz bulunmuyor.</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowAddDialog(true)}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Ödeme Yöntemi Ekle
                  </Button>
                </CardContent>
              </Card>
            ) : (
              paymentMethods.map(method => (
                <Card key={method.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg flex items-center">
                        <CreditCard className="h-5 w-5 mr-2" />
                        {method.type === 'CREDIT_CARD' ? 'Kredi Kartı' : 
                         method.type === 'DEBIT_CARD' ? 'Banka Kartı' : 'Banka Hesabı'}
                        {method.isDefault && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Varsayılan
                          </span>
                        )}
                      </CardTitle>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeletePaymentMethod(method.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      {method.cardHolder && `${method.cardHolder} | `}
                      {method.type !== 'BANK_ACCOUNT' ? (
                        <>
                          {formatCardNumber(method.lastFourDigits)}
                          {method.expiryMonth && method.expiryYear && (
                            <span className="ml-2">
                              Son Kullanma: {formatExpiryDate(method.expiryMonth, method.expiryYear)}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          {method.bankName && `${method.bankName} | `}
                          {method.accountNumber && `Hesap No: ${method.accountNumber}`}
                        </>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    {!method.isDefault && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSetDefault(method.id)}
                      >
                        Varsayılan Yap
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
} 