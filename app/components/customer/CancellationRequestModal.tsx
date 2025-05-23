"use client";

import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XCircle, AlertTriangle, XIcon, ChevronRight, Check } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useToast } from "@/app/components/ui/use-toast";
import CancellationRequestForm from './CancellationRequestForm';

// İptal sebepleri enum değerlerini tanımlıyoruz (API'deki enum ile aynı)
enum CancellationReason {
  CUSTOMER_CHANGED_MIND = "CUSTOMER_CHANGED_MIND",
  DUPLICATE_ORDER = "DUPLICATE_ORDER",
  DELIVERY_TOO_LONG = "DELIVERY_TOO_LONG",
  PRICE_ISSUES = "PRICE_ISSUES",
  RESTAURANT_CLOSED = "RESTAURANT_CLOSED",
  OUT_OF_STOCK = "OUT_OF_STOCK",
  OTHER = "OTHER"
}

// İptal sebepleri için kullanıcı dostu etiketler
const cancellationReasonLabels: Record<CancellationReason, string> = {
  [CancellationReason.CUSTOMER_CHANGED_MIND]: "Fikrimi değiştirdim",
  [CancellationReason.DUPLICATE_ORDER]: "Yanlışlıkla çift sipariş verdim",
  [CancellationReason.DELIVERY_TOO_LONG]: "Teslimat süresi çok uzun",
  [CancellationReason.PRICE_ISSUES]: "Fiyatlandırma sorunları",
  [CancellationReason.RESTAURANT_CLOSED]: "Restoran kapalı",
  [CancellationReason.OUT_OF_STOCK]: "Ürün(ler) tükendi",
  [CancellationReason.OTHER]: "Diğer"
};

interface CancellationRequestModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

export default function CancellationRequestModal({ 
  order, 
  isOpen, 
  onClose, 
  onComplete 
}: CancellationRequestModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock cancellation policy for testing (normally would come from API/order data)
  const cancellationPolicy = {
    allowedTime: 30, // 30 dakika
    hasFee: true,
    feePercentage: 10, // %10 ceza
  };

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      // Token al
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
      }
      
      // API isteği
      const response = await axios.post(
        `/api/orders/${order.id}/cancel`, 
        data,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.status === 200 || response.status === 201) {
        toast({
          title: "Başarılı",
          description: "İptal talebiniz başarıyla oluşturuldu.",
        });
        onComplete(true);
      } else {
        throw new Error('İptal talebi oluşturulurken bir hata meydana geldi.');
      }
      
    } catch (error: any) {
      console.error('İptal talebi oluşturulurken hata:', error);
      
      toast({
        title: "Hata",
        description: error.response?.data?.error || error.message || "İptal talebi oluşturulurken bir hata oluştu.",
        variant: "destructive"
      });
      
      onComplete(false);
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sipariş İptal Talebi</DialogTitle>
          <DialogDescription>
            Siparişinizi iptal etmek için lütfen aşağıdaki bilgileri doldurun
          </DialogDescription>
        </DialogHeader>
        
        <CancellationRequestForm 
          order={order}
          cancellationPolicy={cancellationPolicy}
          onClose={onClose} 
          onSubmit={handleSubmit} 
        />
      </DialogContent>
    </Dialog>
  );
} 