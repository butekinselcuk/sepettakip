import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/app/components/ui/use-toast";
import { Camera, Check, X, UploadCloud, Trash2 } from "lucide-react";
import Image from "next/image";
import { formatCurrency } from '@/lib/utils';

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string;
};

type Order = {
  id: string;
  status: string;
  totalPrice: number;
  items: OrderItem[];
  business: {
    id: string;
    name: string;
  };
};

type RefundReason = 
  | 'DAMAGED_ITEM'
  | 'WRONG_ITEM'
  | 'MISSING_ITEM'
  | 'POOR_QUALITY'
  | 'LATE_DELIVERY'
  | 'OTHER';

interface RefundRequestFormProps {
  order: Order;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export default function RefundRequestForm({ order, onClose, onSubmit }: RefundRequestFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [reason, setReason] = useState<RefundReason>('DAMAGED_ITEM');
  const [customReason, setCustomReason] = useState<string>('');
  const [details, setDetails] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [fullRefund, setFullRefund] = useState<boolean>(false);

  // Fotoğraf çekme/yükleme fonksiyonu
  const handlePhotoCapture = () => {
    // Normalde burada gerçek bir fotoğraf yükleme işlevi olacak
    // Bu örnek için rastgele bir örnek resim URL'si ekliyoruz
    const newPhoto = `https://picsum.photos/400/300?random=${Date.now()}`;
    setPhotos([...photos, newPhoto]);
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  const handleItemSelect = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const toggleFullRefund = () => {
    setFullRefund(!fullRefund);
    if (!fullRefund) {
      // Tüm ürünleri seç
      setSelectedItems(order.items.map(item => item.id));
    } else {
      // Seçimleri temizle
      setSelectedItems([]);
    }
  };

  const calculateRefundAmount = () => {
    if (fullRefund) return order.totalPrice;
    
    return order.items
      .filter(item => selectedItems.includes(item.id))
      .reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedItems.length === 0) {
      toast({
        title: "Hata",
        description: "Lütfen en az bir ürün seçin.",
        variant: "destructive"
      });
      return;
    }
    
    if (!reason) {
      toast({
        title: "Hata",
        description: "Lütfen bir iade nedeni seçin.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const requestData = {
        orderId: order.id,
        items: fullRefund ? [] : selectedItems,
        fullRefund,
        reason: reason === 'OTHER' ? customReason : reason,
        details,
        photos,
        refundAmount: calculateRefundAmount()
      };
      
      await onSubmit(requestData);
      
      toast({
        title: "Başarılı",
        description: "İade talebiniz başarıyla oluşturuldu.",
        variant: "default"
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Hata",
        description: "İade talebi oluşturulurken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const refundReasons = [
    { value: 'DAMAGED_ITEM', label: 'Hasarlı Ürün' },
    { value: 'WRONG_ITEM', label: 'Yanlış Ürün' },
    { value: 'MISSING_ITEM', label: 'Eksik Ürün' },
    { value: 'POOR_QUALITY', label: 'Kalite Sorunu' },
    { value: 'LATE_DELIVERY', label: 'Geç Teslimat' },
    { value: 'OTHER', label: 'Diğer' }
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>İade Talebi Oluştur</CardTitle>
        <CardDescription>
          Siparişiniz için iade talebinde bulunun. Lütfen gerekli bilgileri ve görselleri ekleyin.
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
          </div>
          
          {/* Ürün Seçimi */}
          <div>
            <h3 className="font-medium mb-2">İade Edilecek Ürünler</h3>
            <div className="flex items-center space-x-2 mb-3">
              <Checkbox 
                id="fullRefund" 
                checked={fullRefund}
                onCheckedChange={toggleFullRefund}
              />
              <Label htmlFor="fullRefund">Tüm siparişi iade et</Label>
            </div>
            
            {!fullRefund && (
              <div className="space-y-3 mt-2">
                {order.items.map(item => (
                  <div 
                    key={item.id} 
                    className="flex items-start border rounded-md p-3"
                  >
                    <Checkbox 
                      id={`item-${item.id}`}
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => handleItemSelect(item.id)}
                      className="mt-1"
                    />
                    <div className="ml-3 flex-1">
                      <Label htmlFor={`item-${item.id}`} className="font-medium">
                        {item.name}
                      </Label>
                      <div className="flex justify-between text-sm mt-1">
                        <span>{item.quantity} adet</span>
                        <span>{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    </div>
                    {item.imageUrl && (
                      <div className="w-16 h-16 relative ml-2">
                        <Image 
                          src={item.imageUrl} 
                          alt={item.name} 
                          fill 
                          className="object-cover rounded-md" 
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* İade Nedeni */}
          <div>
            <Label htmlFor="reason" className="font-medium">İade Nedeni</Label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as RefundReason)}
              className="w-full mt-1 p-2 border rounded-md"
              required
            >
              {refundReasons.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            {reason === 'OTHER' && (
              <div className="mt-3">
                <Label htmlFor="customReason" className="text-sm">Lütfen iade nedeninizi belirtin</Label>
                <Input
                  id="customReason"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="İade nedeninizi yazın"
                  className="mt-1"
                  required={reason === 'OTHER'}
                />
              </div>
            )}
          </div>
          
          {/* Detaylı Açıklama */}
          <div>
            <Label htmlFor="details" className="font-medium">Detaylı Açıklama</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Lütfen iade talebiniz hakkında detaylı bilgi verin."
              className="mt-1"
              rows={3}
              required
            />
          </div>
          
          {/* Fotoğraf Ekleme */}
          <div>
            <Label className="font-medium">Fotoğraf Ekle (İsteğe Bağlı)</Label>
            <div className="mt-2 flex flex-wrap gap-3">
              {photos.map((photo, index) => (
                <div key={index} className="relative w-24 h-24">
                  <Image 
                    src={photo}
                    alt={`Evidence ${index + 1}`}
                    width={96}
                    height={96}
                    className="object-cover rounded-md border"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={handlePhotoCapture}
                className="w-24 h-24 border border-dashed rounded-md flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground hover:border-primary/50"
              >
                <UploadCloud size={24} />
                <span className="text-xs">Yükle</span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Sorunu gösteren fotoğraflar eklemeniz, talebinizin daha hızlı değerlendirilmesini sağlayacaktır.
            </p>
          </div>
          
          {/* İade Tutarı */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Talep Edilen İade Tutarı:</span>
              <span className="text-lg font-bold">{formatCurrency(calculateRefundAmount())}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              İade talebiniz onaylandığında bu tutar hesabınıza geri ödenecektir.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
          >
            <X className="mr-2 h-4 w-4" /> İptal
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || selectedItems.length === 0}
          >
            {isSubmitting ? (
              <>Gönderiliyor...</>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" /> Talebi Gönder
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 