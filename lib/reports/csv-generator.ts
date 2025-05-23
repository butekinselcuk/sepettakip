/**
 * CSV formatında rapor oluşturur
 * 
 * @param data Raporlanacak veri
 * @param columns Gösterilecek sütunlar
 * @returns CSV dosyası buffer'ı
 */
export async function generateReportCSV(
  data: any[],
  columns: string[]
): Promise<Buffer> {
  // Sütun başlıklarını al
  const columnLabels = getColumnLabels(columns);
  
  // CSV içeriğini oluştur
  let csvContent = '';
  
  // Başlık satırı
  csvContent += columnLabels.map(label => escapeCSVValue(label)).join(',') + '\n';
  
  // Veri satırları
  data.forEach(item => {
    const rowValues = columns.map(column => {
      const value = formatCellValue(item[column]);
      return escapeCSVValue(value);
    });
    
    csvContent += rowValues.join(',') + '\n';
  });
  
  // UTF-8 BOM ekle (Excel'de Türkçe karakterlerin düzgün görünmesi için)
  const BOM = '\uFEFF';
  csvContent = BOM + csvContent;
  
  // Buffer olarak döndür
  return Buffer.from(csvContent, 'utf8');
}

/**
 * Sütun başlıklarını alır
 */
function getColumnLabels(columns: string[]): string[] {
  // Bu fonksiyon column id'lerini insan tarafından okunabilir etiketlere dönüştürür
  const columnMap: Record<string, string> = {
    id: 'ID',
    createdAt: 'Oluşturulma Tarihi',
    status: 'Durum',
    total: 'Toplam Tutar',
    items: 'Ürün Sayısı',
    customer: 'Müşteri',
    business: 'İşletme',
    courier: 'Kurye',
    deliveryAddress: 'Teslimat Adresi',
    deliveryTime: 'Teslimat Süresi',
    paymentMethod: 'Ödeme Yöntemi',
    name: 'Ad Soyad',
    email: 'E-posta',
    phone: 'Telefon',
    region: 'Bölge',
    deliveryCount: 'Teslimat Sayısı',
    avgDeliveryTime: 'Ortalama Teslimat Süresi',
    rating: 'Puanlama',
    earnings: 'Kazanç',
    category: 'Kategori',
    address: 'Adres',
    orderCount: 'Sipariş Sayısı',
    revenue: 'Ciro',
    totalSpent: 'Toplam Harcama',
    lastOrderAt: 'Son Sipariş Tarihi',
    orderId: 'Sipariş ID',
    courierId: 'Kurye ID',
    startTime: 'Başlangıç Zamanı',
    endTime: 'Bitiş Zamanı',
    duration: 'Süre',
    distance: 'Mesafe',
    customerRating: 'Müşteri Puanı',
    businessRating: 'İşletme Puanı',
  };
  
  return columns.map(column => columnMap[column] || column);
}

/**
 * Hücre değerini formatlar
 */
function formatCellValue(value: any): string {
  if (value === undefined || value === null) {
    return '';
  }
  
  if (value === 'N/A') {
    return value;
  }
  
  if (typeof value === 'object' && value instanceof Date) {
    return value.toLocaleString('tr-TR');
  }
  
  return String(value);
}

/**
 * CSV değerini kaçış karakterleriyle korur
 */
function escapeCSVValue(value: string): string {
  // Eğer değer virgül, çift tırnak veya yeni satır içeriyorsa, çift tırnak içine al
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    // Değer içindeki çift tırnakları iki çift tırnak yaparak kaç
    return '"' + value.replace(/"/g, '""') + '"';
  }
  
  return value;
} 