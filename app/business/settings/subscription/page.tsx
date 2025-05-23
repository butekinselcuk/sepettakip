"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, CheckCircle, CreditCard, Info, Plus, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

// Abonelik durumu için renk ayarları
const statusColors = {
  ACTIVE: "bg-green-100 text-green-800",
  TRIAL: "bg-blue-100 text-blue-800",
  PAST_DUE: "bg-amber-100 text-amber-800",
  PAUSED: "bg-slate-100 text-slate-800",
  CANCELED: "bg-red-100 text-red-800",
  EXPIRED: "bg-gray-100 text-gray-800",
  PENDING: "bg-purple-100 text-purple-800",
};

// Abonelik ve Plan türleri
interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  intervalCount: number;
  features: string[];
  isActive: boolean;
  trialPeriodDays?: number;
}

interface RecurringPayment {
  id: string;
  status: string;
  amount: number;
  currency: string;
  scheduledDate: string;
  processedDate?: string;
}

interface Subscription {
  id: string;
  status: string;
  startDate: string;
  endDate?: string;
  trialEndDate?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingDate?: string;
  plan: Plan;
  recurringPayments?: RecurringPayment[];
}

// Yardımcı fonksiyonlar
const formatCurrency = (amount: number, currency: string = "TRY"): string => {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  if (!dateString) return "--";
  return format(new Date(dateString), "dd MMM yyyy", { locale: tr });
};

export default function BusinessSubscriptionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/businesses/subscriptions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setSubscriptions(response.data.subscriptions || []);
      setAvailablePlans(response.data.availablePlans || []);
    } catch (error) {
      console.error("Abonelik bilgileri alınamadı:", error);
      toast({
        title: "Hata",
        description: "Abonelik bilgileri yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNewPlan = async () => {
    if (!selectedPlan) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "/api/businesses/subscriptions",
        { planId: selectedPlan.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setOpenDialog(false);
      toast({
        title: "Başarılı",
        description: "Abonelik başarıyla oluşturuldu.",
        variant: "default",
      });
      
      // Verileri yeniden yükle
      fetchSubscriptions();
    } catch (error) {
      console.error("Abonelik oluşturulamadı:", error);
      toast({
        title: "Hata",
        description: "Abonelik oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renewSubscription = async (subscriptionId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await axios.post(
        `/api/businesses/subscriptions/${subscriptionId}/renew`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast({
        title: "Başarılı",
        description: "Abonelik yenileme talebi alındı.",
        variant: "default",
      });
      
      // Verileri yeniden yükle
      fetchSubscriptions();
    } catch (error) {
      console.error("Abonelik yenilenemedi:", error);
      toast({
        title: "Hata",
        description: "Abonelik yenilenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async (subscriptionId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await axios.post(
        `/api/businesses/subscriptions/${subscriptionId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast({
        title: "Başarılı",
        description: "Abonelik iptal edildi.",
        variant: "default",
      });
      
      // Verileri yeniden yükle
      fetchSubscriptions();
    } catch (error) {
      console.error("Abonelik iptal edilemedi:", error);
      toast({
        title: "Hata",
        description: "Abonelik iptal edilirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Abonelik kart bileşeni
  const SubscriptionCard = ({ subscription }: { subscription: Subscription }) => {
    const isActive = subscription.status === "ACTIVE" || subscription.status === "TRIAL";
    const statusColor = statusColors[subscription.status as keyof typeof statusColors] || statusColors.PENDING;
    
    return (
      <Card className="w-full mb-4 border border-gray-200">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{subscription.plan.name}</CardTitle>
              <CardDescription>{subscription.plan.description}</CardDescription>
            </div>
            <Badge className={statusColor}>
              {subscription.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Fiyat:</span>
              <span className="font-medium">
                {formatCurrency(subscription.plan.price, subscription.plan.currency)}
                /{subscription.plan.interval.toLowerCase()}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Başlangıç Tarihi:</span>
              <span>{formatDate(subscription.startDate)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Mevcut Dönem:</span>
              <span>
                {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
              </span>
            </div>
            
            {subscription.nextBillingDate && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Sonraki Fatura:</span>
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(subscription.nextBillingDate)}
                </span>
              </div>
            )}
            
            {subscription.trialEndDate && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Deneme Süresi Sonu:</span>
                <span>{formatDate(subscription.trialEndDate)}</span>
              </div>
            )}
            
            {subscription.recurringPayments && subscription.recurringPayments.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Son Ödeme</h4>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tutar:</span>
                    <span>
                      {formatCurrency(
                        subscription.recurringPayments[0].amount,
                        subscription.recurringPayments[0].currency
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Durumu:</span>
                    <span>{subscription.recurringPayments[0].status}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tarih:</span>
                    <span>
                      {formatDate(
                        subscription.recurringPayments[0].processedDate || 
                        subscription.recurringPayments[0].scheduledDate
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {isActive ? (
            <Button 
              variant="outline" 
              onClick={() => cancelSubscription(subscription.id)}
            >
              Aboneliği İptal Et
            </Button>
          ) : (
            <Button 
              variant="outline"
              className="flex items-center gap-1"
              onClick={() => renewSubscription(subscription.id)}
            >
              <RotateCcw className="h-4 w-4" /> Yenile
            </Button>
          )}
          
          <Button 
            variant="secondary"
            onClick={() => router.push(`/business/settings/subscription/${subscription.id}`)}
          >
            Abonelik Detayları
          </Button>
        </CardFooter>
      </Card>
    );
  };

  // Mevcut abonelik yoksa boş durum kartı
  const EmptySubscriptionCard = () => (
    <Card className="w-full mb-6 border border-dashed border-gray-300 bg-gray-50">
      <CardContent className="flex flex-col items-center justify-center py-10">
        <Info className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">Aktif Abonelik Bulunamadı</h3>
        <p className="text-gray-500 text-center mb-4">
          İşletmeniz için bir abonelik planı seçerek avantajlardan yararlanmaya başlayın.
        </p>
        <Button onClick={() => setOpenDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Abonelik Planı Seç
        </Button>
      </CardContent>
    </Card>
  );

  // Plan Kart bileşeni
  const PlanCard = ({ plan, onSelect }: { plan: Plan; onSelect: () => void }) => (
    <Card 
      className={`w-full h-full border ${
        selectedPlan?.id === plan.id ? "border-primary" : "border-gray-200"
      }`}
      onClick={onSelect}
    >
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{plan.name}</span>
          {selectedPlan?.id === plan.id && (
            <CheckCircle className="h-5 w-5 text-primary" />
          )}
        </CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <span className="text-2xl font-bold">{formatCurrency(plan.price, plan.currency)}</span>
          <span className="text-gray-500">/{plan.interval.toLowerCase()}</span>
        </div>
        
        {plan.trialPeriodDays && plan.trialPeriodDays > 0 && (
          <Badge className="bg-blue-100 text-blue-800 mb-4">
            {plan.trialPeriodDays} gün ücretsiz deneme
          </Badge>
        )}
        
        <div className="space-y-2">
          {plan.features && plan.features.map((feature, index) => (
            <div key={index} className="flex items-start">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant={selectedPlan?.id === plan.id ? "default" : "outline"} 
          className="w-full"
          onClick={onSelect}
        >
          {selectedPlan?.id === plan.id ? "Seçildi" : "Seç"}
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="container max-w-4xl py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Abonelik Yönetimi</h1>
        <p className="text-gray-500 mt-1">
          Mevcut aboneliklerinizi görüntüleyin ve yönetin.
        </p>
      </div>

      <Separator className="my-6" />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-semibold mb-4">Mevcut Abonelikler</h2>
          
          {subscriptions.length > 0 ? (
            <div className="space-y-4">
              {subscriptions.map((subscription) => (
                <SubscriptionCard 
                  key={subscription.id} 
                  subscription={subscription} 
                />
              ))}
            </div>
          ) : (
            <EmptySubscriptionCard />
          )}

          <div className="mt-8 flex justify-end">
            <Button onClick={() => setOpenDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> Yeni Abonelik Oluştur
            </Button>
          </div>
        </>
      )}

      {/* Abonelik Planları Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Abonelik Planı Seçin</DialogTitle>
            <DialogDescription>
              İşletmeniz için en uygun abonelik planını seçerek devam edin.
            </DialogDescription>
          </DialogHeader>
          
          {availablePlans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
              {availablePlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onSelect={() => setSelectedPlan(plan)}
                />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500">Kullanılabilir abonelik planı bulunamadı.</p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              İptal
            </Button>
            <Button 
              disabled={!selectedPlan || loading} 
              onClick={subscribeToNewPlan}
            >
              {loading ? (
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white rounded-full" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Aboneliği Başlat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 