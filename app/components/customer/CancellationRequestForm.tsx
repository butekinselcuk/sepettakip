import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/app/components/ui/use-toast";
import { Check, X, AlertTriangle } from "lucide-react";
import { formatCurrency, formatDate } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type Order = {
  id: string;
  status: string;
  totalPrice: number;
  createdAt: string | Date;
  business: {
    id: string;
    name: string;
  };
};

type CancellationPolicy = {
  allowedTime: number; // dakika cinsinden
  hasFee: boolean;
  feeAmount?: number;
  feePercentage?: number;
};

type CancellationReason =
  | 'CHANGED_MIND'
  | 'ORDERED_BY_MISTAKE'
  | 'LONG_WAITING_TIME'
  | 'DUPLICATE_ORDER'
  | 'OTHER';

interface CancellationRequestFormProps {
  order: Order;
  cancellationPolicy?: CancellationPolicy;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export default function CancellationRequestForm({
  order,
  cancellationPolicy,
  onClose,
  onSubmit
}: CancellationRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [reason, setReason] = useState<CancellationReason>('CHANGED_MIND');
  const [details, setDetails] = useState<string>('');

  const orderDate = new Date(order.createdAt);
  const currentTime = new Date();
  const minutesSinceOrder = Math.floor((currentTime.getTime() - orderDate.getTime()) / (1000 * 60));
  
  // İptal politikasına göre durumu hesapla
  const policyTimeExceeded = cancellationPolicy && (minutesSinceOrder > cancellationPolicy.allowedTime);
  const cancellationFee = calculateCancellationFee();

  function calculateCancellationFee() {
    if (!cancellationPolicy || !cancellationPolicy.hasFee || !policyTimeExceeded) {
      return 0;
    }

    if (cancellationPolicy.feeAmount) {
      return cancellationPolicy.feeAmount;
    }

    if (cancellationPolicy.feePercentage) {
      return (order.totalPrice * cancellationPolicy.feePercentage) / 100;
    }

    return 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason) {
      toast({
        title: "Hata",
        description: "Lütfen bir iptal nedeni seçin.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const requestData = {
        orderId: order.id,
        reason,
        details,
        cancellationFee
      };
      
      await onSubmit(requestData);
      
      toast({
        title: "Başarılı",
        description: "İptal talebiniz başarıyla oluşturuldu.",
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Hata",
        description: "İptal talebi oluşturulurken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancellationReasons = [
    { value: 'CHANGED_MIND', label: 'Fikrim değişti' },
    { value: 'ORDERED_BY_MISTAKE', label: 'Yanlışlıkla sipariş verdim' },
    { value: 'LONG_WAITING_TIME', label: 'Bekleme süresi çok uzun' },
    { value: 'DUPLICATE_ORDER', label: 'Mükerrer sipariş' },
    { value: 'OTHER', label: 'Diğer' }
  ];

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Sipariş İptal Talebi</CardTitle>
        <CardDescription>
          Siparişinizi iptal etmek için lütfen aşağıdaki bilgileri doldurun.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Sipariş Bilgileri */}
          <div className="border rounded-md p-4 bg-muted/20">
            <h3 className="font-medium mb-2">Sipariş Bilgileri</h3>
            <p className="text-sm">Sipariş No: #{order.id.substring(0, 8)}</p>
            <p className="text-sm">İşletme: {order.business.name}</p>
            <p className="text-sm">Toplam Tutar: {formatCurrency(order.totalPrice)}</p>
            <p className="text-sm">Sipariş Tarihi: {formatDate(orderDate)}</p>
          </div>
          
          {/* İptal Politikası Uyarısı */}
          {cancellationPolicy && (
            <div className={`p-4 rounded-md ${policyTimeExceeded ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex items-start">
                <div className={`p-1 rounded-full ${policyTimeExceeded ? 'text-amber-500' : 'text-green-500'} mr-3 mt-0.5`}>
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <h4 className="font-medium text-sm">İptal Politikası</h4>
                  <p className="text-sm mt-1">
                    {policyTimeExceeded
                      ? `Siparişiniz üzerinden ${minutesSinceOrder} dakika geçmiş. ${cancellationPolicy.allowedTime} dakikalık ücretsiz iptal süresi aşılmış.`
                      : `Siparişinizi ${cancellationPolicy.allowedTime} dakika içinde ücretsiz iptal edebilirsiniz. ${cancellationPolicy.allowedTime - minutesSinceOrder} dakikanız kaldı.`
                    }
                  </p>
                  
                  {policyTimeExceeded && cancellationPolicy.hasFee && (
                    <p className="text-sm font-medium mt-1 text-amber-700">
                      İptal ücreti: {formatCurrency(cancellationFee)}
                      {cancellationPolicy.feePercentage ? ` (sipariş tutarının %${cancellationPolicy.feePercentage}'i)` : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* İptal Nedeni */}
          <div>
            <Label className="font-medium">İptal Nedeni</Label>
            <RadioGroup
              value={reason}
              onValueChange={(value) => setReason(value as CancellationReason)}
              className="mt-2 space-y-2"
            >
              {cancellationReasons.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          {/* Detaylı Açıklama */}
          <div>
            <Label htmlFor="details" className="font-medium">Detaylı Açıklama</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="İptal talebiniz hakkında detaylı bilgi verebilirsiniz (isteğe bağlı)."
              className="mt-1"
              rows={3}
            />
          </div>
          
          {/* İptal Özeti */}
          {policyTimeExceeded && cancellationFee > 0 && (
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Sipariş Tutarı:</span>
                <span>{formatCurrency(order.totalPrice)}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="font-medium">İptal Ücreti:</span>
                <span className="text-destructive">- {formatCurrency(cancellationFee)}</span>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t">
                <span className="font-medium">İade Edilecek Tutar:</span>
                <span className="text-lg font-bold">{formatCurrency(order.totalPrice - cancellationFee)}</span>
              </div>
            </div>
          )}
          
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
          >
            <X className="mr-2 h-4 w-4" /> Vazgeç
          </Button>
          <Button 
            type="submit" 
            variant="destructive"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>İşleniyor...</>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" /> Siparişi İptal Et
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 