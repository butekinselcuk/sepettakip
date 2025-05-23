import prisma from "@/lib/prisma";
import { differenceInMinutes, differenceInDays } from "date-fns";

// Policy Uygulama Servisi
export class PolicyService {
  
  /**
   * Sipariş iptal talebi için politika kurallarını kontrol eder ve otomatik işlem yapılıp yapılmayacağını belirler
   */
  static async processCancellationRequest(
    orderId: string, 
    cancellationReason: string
  ): Promise<{
    autoProcessed: boolean;
    status: string;
    cancellationFee?: number;
    message?: string;
  }> {
    try {
      // İlgili siparişi getir
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          businessId: true,
          status: true,
          createdAt: true,
          totalPrice: true
        }
      });
      
      if (!order) {
        throw new Error("Sipariş bulunamadı");
      }
      
      // İşletme politikasını getir
      const businessPolicy = await prisma.refundPolicy.findFirst({
        where: {
          businessId: order.businessId,
          isActive: true
        }
      });
      
      // Politika yoksa otomatik işlem yapma
      if (!businessPolicy) {
        return {
          autoProcessed: false,
          status: "PENDING"
        };
      }
      
      // Sipariş oluşturulduğundan bu yana geçen dakika
      const minutesSinceOrderCreation = differenceInMinutes(
        new Date(),
        new Date(order.createdAt)
      );
      
      // Otomatik onay zaman kontrolü
      if (
        businessPolicy.autoApproveTimeline && 
        minutesSinceOrderCreation <= businessPolicy.autoApproveTimeline
      ) {
        // Otomatik onay süresi içindeyse işlemi onayla
        return {
          autoProcessed: true,
          status: "AUTO_APPROVED",
          message: `Otomatik onaylandı (sipariş ${minutesSinceOrderCreation} dakika önce oluşturuldu, zaman limiti: ${businessPolicy.autoApproveTimeline} dakika)`
        };
      }
      
      // Durum kurallarını kontrol et
      if (businessPolicy.orderStatusRules) {
        const statusRules = businessPolicy.orderStatusRules as any;
        
        // Geçerli sipariş durumu için kural kontrolü
        if (statusRules[order.status]) {
          const rule = statusRules[order.status];
          
          // İptal izni kontrolü
          if (rule.allowCancellation === false) {
            return {
              autoProcessed: true,
              status: "REJECTED",
              message: `Bu durumdaki siparişler için iptal politikası nedeniyle otomatik reddedildi (${order.status})`
            };
          }
          
          // İptal ücreti hesaplama
          if (rule.cancellationFeePercentage && rule.cancellationFeePercentage > 0) {
            const cancellationFee = (order.totalPrice * rule.cancellationFeePercentage) / 100;
            
            return {
              autoProcessed: false, // Manuel onay gerektir (ücret var)
              status: "PENDING",
              cancellationFee,
              message: `İptal ücreti hesaplandı: %${rule.cancellationFeePercentage} (${cancellationFee.toFixed(2)} TL)`
            };
          }
        }
      }
      
      // Zaman bazlı iptal ücretlerini kontrol et
      if (businessPolicy.cancellationFees) {
        const fees = businessPolicy.cancellationFees as any;
        
        // Zaman dilimlerine göre kontrol
        for (const timeRule of fees) {
          if (
            minutesSinceOrderCreation > timeRule.minMinutes && 
            (!timeRule.maxMinutes || minutesSinceOrderCreation <= timeRule.maxMinutes)
          ) {
            // Zaman dilimine uygun ceza bedeli
            if (timeRule.feePercentage > 0) {
              const cancellationFee = (order.totalPrice * timeRule.feePercentage) / 100;
              
              return {
                autoProcessed: false, // Manuel onay gerektir (ücret var)
                status: "PENDING",
                cancellationFee,
                message: `Zaman bazlı iptal ücreti hesaplandı: %${timeRule.feePercentage} (${cancellationFee.toFixed(2)} TL)`
              };
            } else if (timeRule.feePercentage === 0) {
              // Ücret yoksa otomatik onaylanabilir
              return {
                autoProcessed: true,
                status: "AUTO_APPROVED",
                message: "Zaman bazlı iptal kuralına göre ücretsiz iptal"
              };
            }
          }
        }
      }
      
      // Özel bir duruma uymadıysa varsayılan olarak beklemede bırak
      return {
        autoProcessed: false,
        status: "PENDING"
      };
      
    } catch (error) {
      console.error("Politika uygulama hatası:", error);
      // Hata durumunda güvenli olarak beklemede bırak
      return {
        autoProcessed: false,
        status: "PENDING",
        message: "Politika uygulanırken hata oluştu"
      };
    }
  }
  
  /**
   * İade talebi için politika kurallarını kontrol eder ve otomatik işlem yapılıp yapılmayacağını belirler
   */
  static async processRefundRequest(
    orderId: string, 
    refundReason: string,
    refundAmount: number,
    refundItems: any[]
  ): Promise<{
    autoProcessed: boolean;
    status: string;
    approvedAmount?: number;
    message?: string;
  }> {
    try {
      // İlgili siparişi getir
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          businessId: true,
          status: true,
          createdAt: true,
          items: true,
          actualDelivery: true
        }
      });
      
      if (!order) {
        throw new Error("Sipariş bulunamadı");
      }
      
      // İşletme politikasını getir
      const businessPolicy = await prisma.refundPolicy.findFirst({
        where: {
          businessId: order.businessId,
          isActive: true
        }
      });
      
      // Politika yoksa otomatik işlem yapma
      if (!businessPolicy) {
        return {
          autoProcessed: false,
          status: "PENDING"
        };
      }
      
      // Teslimattan bu yana geçen gün sayısı kontrolü (teslim edildi ise)
      if (order.actualDelivery && businessPolicy.timeLimit) {
        const daysSinceDelivery = differenceInDays(
          new Date(),
          new Date(order.actualDelivery)
        );
        
        // Zaman aşımı kontrolü
        if (daysSinceDelivery > businessPolicy.timeLimit) {
          return {
            autoProcessed: true,
            status: "REJECTED",
            message: `İade talebi zaman aşımına uğradı (teslimattan sonra ${daysSinceDelivery} gün geçmiş, limit: ${businessPolicy.timeLimit} gün)`
          };
        }
      }
      
      // Ürün kategorilerine göre kurallar
      if (businessPolicy.productRules && refundItems.length > 0) {
        const productRules = businessPolicy.productRules as any;
        let allItemsRefundable = true;
        
        // Sipariş öğeleri JSON olarak saklanır, parse et
        const orderItems = typeof order.items === 'string' 
          ? JSON.parse(order.items as string) 
          : order.items;
          
        // İade edilmek istenen her ürün için kontrol
        for (const refundItem of refundItems) {
          const orderItem = orderItems.find((item: any) => item.id === refundItem.orderItemId);
          
          if (orderItem && orderItem.categoryId) {
            // Kategori bazlı kural kontrolü
            const categoryRule = productRules[orderItem.categoryId];
            
            if (categoryRule && categoryRule.refundable === false) {
              allItemsRefundable = false;
              break;
            }
          }
        }
        
        if (!allItemsRefundable) {
          return {
            autoProcessed: true,
            status: "REJECTED",
            message: "İade edilmek istenen ürünlerden bazıları iade edilemez kategorisindedir"
          };
        }
      }
      
      // Belirli sebeplere göre otomatik onay
      const autoApproveReasons = ["DAMAGED_PRODUCT", "MISSING_ITEMS", "WRONG_PRODUCT"];
      if (autoApproveReasons.includes(refundReason) && refundAmount <= 100) {
        return {
          autoProcessed: true,
          status: "AUTO_APPROVED",
          approvedAmount: refundAmount,
          message: `Düşük tutarlı ve geçerli bir sebep olduğu için otomatik onaylandı (${refundReason})`
        };
      }
      
      // Özel bir duruma uymadıysa varsayılan olarak beklemede bırak
      return {
        autoProcessed: false,
        status: "PENDING"
      };
      
    } catch (error) {
      console.error("İade politikası uygulama hatası:", error);
      // Hata durumunda güvenli olarak beklemede bırak
      return {
        autoProcessed: false,
        status: "PENDING",
        message: "İade politikası uygulanırken hata oluştu"
      };
    }
  }
  
  /**
   * Sipariş iptal talebi API'sine entegre edilecek politika değerlendirmesi
   */
  static async evaluateCancellationPolicy(
    orderId: string, 
    cancellationReason: string
  ) {
    const policyResult = await this.processCancellationRequest(orderId, cancellationReason);
    
    // Eğer otomatik işlem yapılabiliyorsa sipariş durumunu güncelle
    if (policyResult.autoProcessed && policyResult.status === "AUTO_APPROVED") {
      // Siparişi iptal edildi olarak işaretle
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" }
      });
    }
    
    return policyResult;
  }
  
  /**
   * İade talebi API'sine entegre edilecek politika değerlendirmesi
   */
  static async evaluateRefundPolicy(
    orderId: string, 
    refundReason: string,
    refundAmount: number,
    refundItems: any[]
  ) {
    const policyResult = await this.processRefundRequest(
      orderId, 
      refundReason, 
      refundAmount, 
      refundItems
    );
    
    return policyResult;
  }
} 