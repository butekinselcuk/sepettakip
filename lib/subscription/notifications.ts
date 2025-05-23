import { prisma } from "@/lib/prisma";

/**
 * Abonelik yenileme bildirimi gönderir
 * @param subscriptionId Abonelik ID'si
 */
export async function notifySubscriptionRenewal(subscriptionId: string) {
  try {
    // Abonelik bilgilerini al
    const subscription = await prisma.$queryRaw`
      SELECT s.*, sp.name as plan_name, c.email as customer_email, c.name as customer_name
      FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.id
      JOIN users c ON s.customer_id = c.id
      WHERE s.id = ${subscriptionId}
    `;
    
    if (!subscription || (Array.isArray(subscription) && subscription.length === 0)) {
      console.error(`Bildirim gönderilemedi: Abonelik bulunamadı (${subscriptionId})`);
      return;
    }
    
    const subData = Array.isArray(subscription) ? subscription[0] : subscription;
    
    // Bildirim oluştur
    await prisma.$executeRaw`
      INSERT INTO notifications (
        id, title, content, type, is_read, created_at, user_id
      ) VALUES (
        uuid_generate_v4(),
        'Abonelik Yenilendi',
        'Aboneliğiniz başarıyla yenilendi: ' || ${subData.plan_name},
        'SUBSCRIPTION_RENEWAL',
        false,
        NOW(),
        ${subData.customer_id}
      )
    `;
    
    console.log(`Abonelik yenileme bildirimi gönderildi: ${subscriptionId}`);
    
    // E-posta gönderimi (burada e-posta servisi entegrasyonu yapılabilir)
    console.log(`E-posta gönderilecek: ${subData.customer_email}`);
    
  } catch (error) {
    console.error(`Bildirim gönderirken hata oluştu:`, error);
  }
}

/**
 * Ödeme başarısız bildirimi gönderir
 * @param subscriptionId Abonelik ID'si
 * @param paymentId Ödeme ID'si
 */
export async function notifyPaymentFailed(subscriptionId: string, paymentId: string) {
  try {
    // Abonelik ve ödeme bilgilerini al
    const subscription = await prisma.$queryRaw`
      SELECT s.*, sp.name as plan_name, c.email as customer_email, c.name as customer_name,
             rp.amount, rp.currency, rp.retry_count, rp.max_retries, rp.next_retry_date
      FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.id
      JOIN users c ON s.customer_id = c.id
      JOIN recurring_payments rp ON rp.id = ${paymentId}
      WHERE s.id = ${subscriptionId}
    `;
    
    if (!subscription || (Array.isArray(subscription) && subscription.length === 0)) {
      console.error(`Bildirim gönderilemedi: Abonelik veya ödeme bulunamadı (${subscriptionId})`);
      return;
    }
    
    const subData = Array.isArray(subscription) ? subscription[0] : subscription;
    
    // Yeniden deneme bilgisi
    const willRetry = subData.retry_count < subData.max_retries;
    const retryDate = new Date(subData.next_retry_date).toLocaleDateString('tr-TR');
    
    // Bildirim içeriği
    const content = willRetry
      ? `Ödemeniz başarısız oldu. ${subData.plan_name} aboneliğiniz için ${retryDate} tarihinde tekrar deneyeceğiz.`
      : `${subData.plan_name} aboneliğiniz için ödeme başarısız oldu ve daha fazla deneme yapılmayacak. Lütfen ödeme yönteminizi güncelleyin.`;
    
    // Bildirim oluştur
    await prisma.$executeRaw`
      INSERT INTO notifications (
        id, title, content, type, is_read, created_at, user_id
      ) VALUES (
        uuid_generate_v4(),
        'Ödeme Başarısız',
        ${content},
        'PAYMENT_FAILED',
        false,
        NOW(),
        ${subData.customer_id}
      )
    `;
    
    console.log(`Ödeme başarısız bildirimi gönderildi: ${paymentId}`);
    
    // E-posta gönderimi (burada e-posta servisi entegrasyonu yapılabilir)
    console.log(`E-posta gönderilecek: ${subData.customer_email}`);
    
  } catch (error) {
    console.error(`Bildirim gönderirken hata oluştu:`, error);
  }
}

/**
 * Abonelik sona erdi bildirimi gönderir
 * @param subscriptionId Abonelik ID'si
 */
export async function notifySubscriptionExpired(subscriptionId: string) {
  try {
    // Abonelik bilgilerini al
    const subscription = await prisma.$queryRaw`
      SELECT s.*, sp.name as plan_name, c.email as customer_email, c.name as customer_name
      FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.id
      JOIN users c ON s.customer_id = c.id
      WHERE s.id = ${subscriptionId}
    `;
    
    if (!subscription || (Array.isArray(subscription) && subscription.length === 0)) {
      console.error(`Bildirim gönderilemedi: Abonelik bulunamadı (${subscriptionId})`);
      return;
    }
    
    const subData = Array.isArray(subscription) ? subscription[0] : subscription;
    
    // Bildirim oluştur
    await prisma.$executeRaw`
      INSERT INTO notifications (
        id, title, content, type, is_read, created_at, user_id
      ) VALUES (
        uuid_generate_v4(),
        'Abonelik Sona Erdi',
        'Ödeme alınamadığı için ' || ${subData.plan_name} || ' aboneliğiniz sona erdi. Aboneliğinizi yenilemek için ödeme yönteminizi güncelleyin.',
        'SUBSCRIPTION_EXPIRED',
        false,
        NOW(),
        ${subData.customer_id}
      )
    `;
    
    console.log(`Abonelik sona erdi bildirimi gönderildi: ${subscriptionId}`);
    
    // E-posta gönderimi (burada e-posta servisi entegrasyonu yapılabilir)
    console.log(`E-posta gönderilecek: ${subData.customer_email}`);
    
  } catch (error) {
    console.error(`Bildirim gönderirken hata oluştu:`, error);
  }
}

/**
 * Abonelik iptal bildirimi gönderir
 * @param subscriptionId Abonelik ID'si
 */
export async function notifySubscriptionCancelled(subscriptionId: string) {
  try {
    // Abonelik bilgilerini al
    const subscription = await prisma.$queryRaw`
      SELECT s.*, sp.name as plan_name, c.email as customer_email, c.name as customer_name
      FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.id
      JOIN users c ON s.customer_id = c.id
      WHERE s.id = ${subscriptionId}
    `;
    
    if (!subscription || (Array.isArray(subscription) && subscription.length === 0)) {
      console.error(`Bildirim gönderilemedi: Abonelik bulunamadı (${subscriptionId})`);
      return;
    }
    
    const subData = Array.isArray(subscription) ? subscription[0] : subscription;
    
    // Bildirim oluştur
    await prisma.$executeRaw`
      INSERT INTO notifications (
        id, title, content, type, is_read, created_at, user_id
      ) VALUES (
        uuid_generate_v4(),
        'Abonelik İptal Edildi',
        ${subData.plan_name} || ' aboneliğiniz iptal edildi. Mevcut dönem sonuna kadar hizmetlerimizden yararlanmaya devam edebilirsiniz.',
        'SUBSCRIPTION_CANCELLED',
        false,
        NOW(),
        ${subData.customer_id}
      )
    `;
    
    console.log(`Abonelik iptal bildirimi gönderildi: ${subscriptionId}`);
    
    // E-posta gönderimi (burada e-posta servisi entegrasyonu yapılabilir)
    console.log(`E-posta gönderilecek: ${subData.customer_email}`);
    
  } catch (error) {
    console.error(`Bildirim gönderirken hata oluştu:`, error);
  }
}

/**
 * Abonelik deneme süresi sona eriyor bildirimi gönderir
 * @param subscriptionId Abonelik ID'si
 * @param daysLeft Kalan gün sayısı
 */
export async function notifyTrialEnding(subscriptionId: string, daysLeft: number) {
  try {
    // Abonelik bilgilerini al
    const subscription = await prisma.$queryRaw`
      SELECT s.*, sp.name as plan_name, c.email as customer_email, c.name as customer_name,
             sp.price, sp.currency
      FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.id
      JOIN users c ON s.customer_id = c.id
      WHERE s.id = ${subscriptionId}
    `;
    
    if (!subscription || (Array.isArray(subscription) && subscription.length === 0)) {
      console.error(`Bildirim gönderilemedi: Abonelik bulunamadı (${subscriptionId})`);
      return;
    }
    
    const subData = Array.isArray(subscription) ? subscription[0] : subscription;
    
    // Para birimi formatla
    const amount = new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: subData.currency || 'TRY' 
    }).format(subData.price);
    
    // Bildirim oluştur
    await prisma.$executeRaw`
      INSERT INTO notifications (
        id, title, content, type, is_read, created_at, user_id
      ) VALUES (
        uuid_generate_v4(),
        'Deneme Süresi Bitiyor',
        ${subData.plan_name} || ' aboneliğinizin deneme süresi ' || ${daysLeft} || ' gün sonra sona erecek. Deneme süresi sonunda hesabınızdan ' || ${amount} || ' tutarında ödeme alınacaktır.',
        'TRIAL_ENDING',
        false,
        NOW(),
        ${subData.customer_id}
      )
    `;
    
    console.log(`Deneme süresi bitiyor bildirimi gönderildi: ${subscriptionId}`);
    
    // E-posta gönderimi (burada e-posta servisi entegrasyonu yapılabilir)
    console.log(`E-posta gönderilecek: ${subData.customer_email}`);
    
  } catch (error) {
    console.error(`Bildirim gönderirken hata oluştu:`, error);
  }
} 