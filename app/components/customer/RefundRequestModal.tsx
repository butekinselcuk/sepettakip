"use client";

import { useState, Fragment, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XCircle, AlertTriangle, Camera, Check, UploadCloud, XIcon, ChevronRight, Trash2 } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/app/components/ui/use-toast";
import RefundRequestForm from './RefundRequestForm';

// İade sebepleri enum değerlerini tanımlıyoruz (API'deki enum ile aynı)
enum RefundReason {
  DAMAGED_PRODUCT = "DAMAGED_PRODUCT",
  WRONG_PRODUCT = "WRONG_PRODUCT",
  PRODUCT_NOT_AS_DESCRIBED = "PRODUCT_NOT_AS_DESCRIBED",
  MISSING_ITEMS = "MISSING_ITEMS",
  LATE_DELIVERY = "LATE_DELIVERY",
  QUALITY_ISSUES = "QUALITY_ISSUES",
  OTHER = "OTHER"
}

// İade sebepleri için kullanıcı dostu etiketler
const refundReasonLabels: Record<RefundReason, string> = {
  [RefundReason.DAMAGED_PRODUCT]: "Ürün hasarlı geldi",
  [RefundReason.WRONG_PRODUCT]: "Yanlış ürün geldi",
  [RefundReason.PRODUCT_NOT_AS_DESCRIBED]: "Ürün açıklandığı gibi değil",
  [RefundReason.MISSING_ITEMS]: "Eksik ürün var",
  [RefundReason.LATE_DELIVERY]: "Çok geç teslim edildi",
  [RefundReason.QUALITY_ISSUES]: "Kalite sorunları",
  [RefundReason.OTHER]: "Diğer"
};

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface RefundRequestModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

export default function RefundRequestModal({ order, isOpen, onClose, onComplete }: RefundRequestModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        `/api/orders/${order.id}/refund`, 
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
          description: "İade talebiniz başarıyla oluşturuldu.",
        });
        onComplete(true);
      } else {
        throw new Error('İade talebi oluşturulurken bir hata meydana geldi.');
      }
      
    } catch (error: any) {
      console.error('İade talebi oluşturulurken hata:', error);
      
      toast({
        title: "Hata",
        description: error.response?.data?.error || error.message || "İade talebi oluşturulurken bir hata oluştu.",
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>İade Talebi</DialogTitle>
          <DialogDescription>
            Siparişiniz için iade talebi oluşturun
          </DialogDescription>
        </DialogHeader>
        
        <RefundRequestForm 
          order={order} 
          onClose={onClose} 
          onSubmit={handleSubmit} 
        />
      </DialogContent>
    </Dialog>
  );
} 