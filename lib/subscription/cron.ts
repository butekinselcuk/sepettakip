import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";
import { notifySubscriptionRenewal, notifyPaymentFailed, notifySubscriptionExpired } from "./notifications";

/**
 * Yenilenecek abonelikleri bulur
 */
export async function findExpiringSubscriptions() {
  const tomorrow = addDays(new Date(), 1);
  
  // Yarın sona erecek, otomatik yenilenecek abonelikler
  const expiringSubscriptions = await prisma.$queryRaw`
    SELECT * FROM subscriptions
    WHERE status = 'ACTIVE'
    AND auto_renew = true
    AND next_billing_date <= ${tomorrow}
    AND saved_payment_method_id IS NOT NULL
  `;
  
  return Array.isArray(expiringSubscriptions) ? expiringSubscriptions : [expiringSubscriptions];
}

/**
 * Başarısız ödemeleri bulur ve tekrar dener
 */
export async function findFailedPayments() {
  // Başarısız ödemeler (FAILED durumundaki ve maksimum deneme sayısına ulaşmamış)
  const failedPayments = await prisma.$queryRaw`
    SELECT * FROM recurring_payments
    WHERE status = 'FAILED'
    AND retry_count < max_retries
    AND next_retry_date <= NOW()
  `;
  
  return Array.isArray(failedPayments) ? failedPayments : [failedPayments];
}

/**
 * Süresi geçmiş abonelikleri bulur
 */
export async function findPastDueSubscriptions() {
  const thirtyDaysAgo = addDays(new Date(), -30);
  
  // 30 gün önce ödeme başarısız olmuş, hala PAST_DUE durumundaki abonelikler
  const pastDueSubscriptions = await prisma.$queryRaw`
    SELECT s.* FROM subscriptions s
    JOIN recurring_payments rp ON rp.subscription_id = s.id
    WHERE s.status = 'PAST_DUE'
    AND rp.status = 'FAILED'
    AND rp.processed_date <= ${thirtyDaysAgo}
  `;
  
  return Array.isArray(pastDueSubscriptions) ? pastDueSubscriptions : [pastDueSubscriptions];
}

/**
 * Abonelik yenileme işlemi 
 */
export async function processSubscriptionRenewal(subscription: any) {
  try {
    // Abonelik detaylarını al
    const plan = await prisma.$queryRaw`
      SELECT * FROM subscription_plans WHERE id = ${subscription.plan_id}
    `;
    
    const planData = Array.isArray(plan) ? plan[0] : plan;
    
    if (!planData) {
      console.error(`Plan bulunamadı: ${subscription.plan_id}`);
      return;
    }
    
    // Yeni ödeme dönemi tarihlerini hesapla
    const currentDate = new Date();
    const nextBillingDate = calculateNextBillingDate(
      currentDate, 
      planData.interval, 
      planData.interval_count
    );
    
    // Ödeme işlemi oluştur
    await prisma.$executeRaw`
      INSERT INTO recurring_payments (
        id, subscription_id, amount, currency, status,
        scheduled_date, saved_payment_method_id, 
        created_at, updated_at
      ) VALUES (
        uuid_generate_v4(), ${subscription.id}, 
        ${planData.price}, ${planData.currency || 'TRY'}, 
        'PENDING', NOW(), ${subscription.saved_payment_method_id},
        NOW(), NOW()
      )
    `;
    
    // Abonelik tarihlerini güncelle
    await prisma.$executeRaw`
      UPDATE subscriptions 
      SET 
        current_period_start = ${currentDate},
        current_period_end = ${nextBillingDate},
        next_billing_date = ${nextBillingDate},
        updated_at = NOW()
      WHERE id = ${subscription.id}
    `;
    
    // Bildirim gönder
    await notifySubscriptionRenewal(subscription.id);
    
    console.log(`Abonelik yenilendi: ${subscription.id}`);
  } catch (error) {
    console.error(`Abonelik yenileme hatası (${subscription.id}):`, error);
  }
}

/**
 * Ödeme yeniden deneme işlemi
 */
export async function processPaymentRetry(payment: any) {
  try {
    // Ödeme metodunu getir
    const paymentMethod = await prisma.$queryRaw`
      SELECT * FROM saved_payment_methods 
      WHERE id = ${payment.saved_payment_method_id}
    `;
    
    const paymentMethodData = Array.isArray(paymentMethod) ? paymentMethod[0] : paymentMethod;
    
    if (!paymentMethodData) {
      console.error(`Ödeme metodu bulunamadı: ${payment.saved_payment_method_id}`);
      return;
    }
    
    // Burada ödeme işlemi gerçekleştirilir
    // Gerçek bir ödeme gateway entegrasyonu yapılması gerekir
    const paymentSuccessful = Math.random() > 0.3; // Başarı simülasyonu
    
    if (paymentSuccessful) {
      // Ödeme başarılı ise güncelle
      await prisma.$executeRaw`
        UPDATE recurring_payments
        SET 
          status = 'PAID',
          processed_date = NOW(),
          updated_at = NOW()
        WHERE id = ${payment.id}
      `;
      
      // Aboneliği aktif duruma getir
      await prisma.$executeRaw`
        UPDATE subscriptions
        SET 
          status = 'ACTIVE',
          updated_at = NOW()
        WHERE id = ${payment.subscription_id}
      `;
      
      console.log(`Ödeme başarılı: ${payment.id}`);
    } else {
      // Ödeme başarısız, yeniden deneme zamanını ayarla
      const nextRetryDate = addDays(new Date(), 3); // 3 gün sonra tekrar dene
      const newRetryCount = payment.retry_count + 1;
      
      await prisma.$executeRaw`
        UPDATE recurring_payments
        SET 
          retry_count = ${newRetryCount},
          next_retry_date = ${nextRetryDate},
          failure_reason = 'Ödeme reddedildi',
          updated_at = NOW()
        WHERE id = ${payment.id}
      `;
      
      // Maksimum yeniden deneme sayısına ulaşıldıysa aboneliği past_due olarak işaretle
      if (newRetryCount >= payment.max_retries) {
        await prisma.$executeRaw`
          UPDATE subscriptions
          SET 
            status = 'PAST_DUE',
            updated_at = NOW()
          WHERE id = ${payment.subscription_id}
        `;
      }
      
      // Bildirim gönder
      await notifyPaymentFailed(payment.subscription_id, payment.id);
      
      console.log(`Ödeme başarısız: ${payment.id}, Tekrar deneme: ${newRetryCount}`);
    }
  } catch (error) {
    console.error(`Ödeme işlemi hatası (${payment.id}):`, error);
  }
}

/**
 * Past Due durumundaki abonelikleri iptal et
 */
export async function processExpiredSubscriptions(subscription: any) {
  try {
    // Aboneliği sona erdir
    await prisma.$executeRaw`
      UPDATE subscriptions
      SET 
        status = 'EXPIRED',
        updated_at = NOW(),
        canceled_at = NOW()
      WHERE id = ${subscription.id}
    `;
    
    // Bildirim gönder
    await notifySubscriptionExpired(subscription.id);
    
    console.log(`Abonelik süresi doldu ve iptal edildi: ${subscription.id}`);
  } catch (error) {
    console.error(`Abonelik iptal hatası (${subscription.id}):`, error);
  }
}

/**
 * Sonraki fatura tarihini hesapla
 */
function calculateNextBillingDate(
  currentDate: Date,
  interval: string,
  intervalCount: number
): Date {
  const nextDate = new Date(currentDate);
  
  switch (interval) {
    case 'DAILY':
      nextDate.setDate(nextDate.getDate() + intervalCount);
      break;
    case 'WEEKLY':
      nextDate.setDate(nextDate.getDate() + (7 * intervalCount));
      break;
    case 'MONTHLY':
      nextDate.setMonth(nextDate.getMonth() + intervalCount);
      break;
    case 'QUARTERLY':
      nextDate.setMonth(nextDate.getMonth() + (3 * intervalCount));
      break;
    case 'YEARLY':
      nextDate.setFullYear(nextDate.getFullYear() + intervalCount);
      break;
    default:
      nextDate.setMonth(nextDate.getMonth() + 1);
  }
  
  return nextDate;
}

/**
 * Ana cron görevi
 */
export async function runSubscriptionCronTasks() {
  console.log('Abonelik cron görevi başlatıldı:', new Date());
  
  try {
    // 1. Yenilenecek abonelikleri işle
    const expiringSubscriptions = await findExpiringSubscriptions();
    console.log(`${expiringSubscriptions.length} adet yenilenecek abonelik bulundu`);
    
    for (const subscription of expiringSubscriptions) {
      await processSubscriptionRenewal(subscription);
    }
    
    // 2. Başarısız ödemeleri yeniden dene
    const failedPayments = await findFailedPayments();
    console.log(`${failedPayments.length} adet başarısız ödeme bulundu`);
    
    for (const payment of failedPayments) {
      await processPaymentRetry(payment);
    }
    
    // 3. Süresi geçmiş abonelikleri sonlandır
    const pastDueSubscriptions = await findPastDueSubscriptions();
    console.log(`${pastDueSubscriptions.length} adet süresi geçmiş abonelik bulundu`);
    
    for (const subscription of pastDueSubscriptions) {
      await processExpiredSubscriptions(subscription);
    }
    
    console.log('Abonelik cron görevi tamamlandı');
  } catch (error) {
    console.error('Abonelik cron görevi hatası:', error);
  }
} 