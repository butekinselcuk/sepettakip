import ExcelJS from 'exceljs';

/**
 * Excel formatında rapor oluşturur
 * 
 * @param title Rapor başlığı
 * @param data Raporlanacak veri
 * @param columns Gösterilecek sütunlar
 * @param options Rapor seçenekleri
 * @returns Excel dosyası buffer'ı
 */
export async function generateReportExcel(
  title: string,
  data: any[],
  columns: string[],
  options?: {
    includeTotals?: boolean;
    includeCharts?: boolean;
  }
): Promise<Buffer> {
  // Excel dosyası oluştur
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SepetTakip System';
  workbook.created = new Date();
  
  // Ana rapor sayfasını oluştur
  const worksheet = workbook.addWorksheet('Rapor');
  
  // Başlık satırı ekle
  worksheet.mergeCells('A1:H1');
  const titleRow = worksheet.getCell('A1');
  titleRow.value = title;
  titleRow.font = {
    size: 16,
    bold: true,
    color: { argb: '4F4F4F' }
  };
  titleRow.alignment = { horizontal: 'center' };
  
  // Üretim tarihi satırı ekle
  worksheet.mergeCells('A2:H2');
  const dateRow = worksheet.getCell('A2');
  dateRow.value = `Oluşturulma Tarihi: ${new Date().toLocaleString('tr-TR')}`;
  dateRow.font = {
    size: 10,
    color: { argb: '808080' }
  };
  dateRow.alignment = { horizontal: 'center' };
  
  // Boş satır ekle
  worksheet.addRow([]);
  
  // Sütun başlıklarını hazırla
  const columnLabels = getColumnLabels(columns);
  const headerRow = worksheet.addRow(columnLabels);
  
  // Başlık satırını formatla
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E2E8F0' }
    };
    cell.alignment = { horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // Veriyi ekle
  data.forEach((item, index) => {
    const rowData = columns.map(column => formatCellValue(item[column]));
    const row = worksheet.addRow(rowData);
    
    // Satırı formatla
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'E2E8F0' } },
        left: { style: 'thin', color: { argb: 'E2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
        right: { style: 'thin', color: { argb: 'E2E8F0' } }
      };
      
      // Alternatif satır renklendirmesi
      if (index % 2 !== 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F7FAFC' }
        };
      }
    });
  });
  
  // Sütun genişliklerini ayarla
  if (worksheet.columns) {
    worksheet.columns.forEach(column => {
      if (column) {
        let maxLength = 0;
        if (column.eachCell) {
          column.eachCell({ includeEmpty: true }, (cell) => {
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
              maxLength = columnLength;
            }
          });
          column.width = Math.min(maxLength + 2, 30);
        }
      }
    });
  }
  
  // Eğer toplam isteniyorsa, toplam satırı ekle
  if (options?.includeTotals) {
    addTotalsRow(worksheet, data, columns);
  }
  
  // Eğer grafikler isteniyorsa, grafik sayfası ekle
  if (options?.includeCharts) {
    addChartsSheet(workbook, data, columns, title);
  }
  
  // Excel dosyasını buffer olarak döndür
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Sütun başlıklarını alır
 */
function getColumnLabels(columns: string[]): string[] {
  // Bu fonksiyon column id'lerini insan tarafından okunabilir etiketlere dönüştürür
  // Gerçek uygulamada bu bir tür haritadan veya veri sözlüğünden gelebilir
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
function formatCellValue(value: any): any {
  if (value === undefined || value === null) {
    return '';
  }
  
  if (value === 'N/A') {
    return value;
  }
  
  if (typeof value === 'object' && value instanceof Date) {
    return value.toLocaleString('tr-TR');
  }
  
  return value;
}

/**
 * Toplam satırı ekler
 */
function addTotalsRow(worksheet: ExcelJS.Worksheet, data: any[], columns: string[]) {
  // Toplamları hesapla
  const totals: Record<string, any> = {};
  
  columns.forEach(column => {
    // Sayısal değerleri topla
    if (['total', 'items', 'deliveryCount', 'orderCount', 'revenue', 'totalSpent', 'earnings', 'distance'].includes(column)) {
      totals[column] = data.reduce((sum, item) => {
        const value = parseFloat(item[column]);
        return !isNaN(value) ? sum + value : sum;
      }, 0);
    } else {
      totals[column] = '';
    }
  });
  
  // Toplam satırını ekle
  const totalRow = worksheet.addRow(columns.map(column => {
    if (columns.length > 0 && column === columns[0]) {
      return 'TOPLAM';
    }
    return totals[column];
  }));
  
  // Toplam satırını formatla
  totalRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E2E8F0' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
}

/**
 * Grafik sayfası ekler
 */
function addChartsSheet(workbook: ExcelJS.Workbook, data: any[], columns: string[], title: string) {
  // Yeni bir çalışma sayfası ekle
  const chartSheet = workbook.addWorksheet('Grafikler');
  
  // Başlık satırı ekle
  chartSheet.mergeCells('A1:H1');
  const titleRow = chartSheet.getCell('A1');
  titleRow.value = `${title} - Grafikler`;
  titleRow.font = {
    size: 16,
    bold: true,
    color: { argb: '4F4F4F' }
  };
  titleRow.alignment = { horizontal: 'center' };
  
  // Boş satır ekle
  chartSheet.addRow([]);
  
  // Grafikler için veri hazırla
  // Bu kısım için genellikle veri analizi ve gruplama gerekir
  // Örnek olarak durum dağılımı gösteriyoruz
  if (columns.includes('status')) {
    addStatusDistributionChart(chartSheet, data);
  }
  
  // Eğer tarih içeriyorsa, zaman serisi grafiği ekle
  if (columns.includes('createdAt')) {
    addTimeSeriesChart(chartSheet, data);
  }
}

/**
 * Durum dağılımı grafiği ekler
 */
function addStatusDistributionChart(chartSheet: ExcelJS.Worksheet, data: any[]) {
  // Durum dağılımını hesapla
  const statusCounts: Record<string, number> = {};
  
  data.forEach(item => {
    const status = item.status || 'Unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  
  // Veriyi çalışma sayfasına ekle
  chartSheet.addRow(['Durum Dağılımı']);
  chartSheet.addRow(['Durum', 'Sayı']);
  
  Object.entries(statusCounts).forEach(([status, count]) => {
    chartSheet.addRow([status, count]);
  });
  
  // Not: ExcelJS'in grafik desteği sınırlıdır ve bazı sürümlerde tam olarak çalışmaz
  // Bu nedenle bu kısım devre dışı bırakıldı, gerçek uygulamada başka bir çözüm kullanılabilir
  
  // Aşağıdaki kod grafik ekleme örneğidir, ancak bazı TypeScript hataları verebilir:
  /*
  const chart = chartSheet.addChart({
    type: 'pie',
    title: { name: 'Durum Dağılımı' },
    legend: { position: 'right' },
    series: [{
      name: 'Durum',
      labels: Object.keys(statusCounts),
      values: Object.values(statusCounts)
    }]
  });
  chart.setPosition('A6', 'H20');
  */
}

/**
 * Zaman serisi grafiği ekler
 */
function addTimeSeriesChart(chartSheet: ExcelJS.Worksheet, data: any[]) {
  // Verileri tarih bazında grupla
  const dateGroups: Record<string, number> = {};
  
  data.forEach(item => {
    const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString('tr-TR') : 'Unknown';
    dateGroups[date] = (dateGroups[date] || 0) + 1;
  });
  
  // Veriyi çalışma sayfasına ekle
  chartSheet.addRow([]);
  chartSheet.addRow(['Tarih Bazlı Dağılım']);
  chartSheet.addRow(['Tarih', 'Sayı']);
  
  Object.entries(dateGroups).forEach(([date, count]) => {
    chartSheet.addRow([date, count]);
  });
  
  // Not: ExcelJS'in grafik desteği sınırlıdır ve bazı sürümlerde tam olarak çalışmaz
  // Bu nedenle bu kısım devre dışı bırakıldı, gerçek uygulamada başka bir çözüm kullanılabilir
  
  // Aşağıdaki kod grafik ekleme örneğidir, ancak bazı TypeScript hataları verebilir:
  /*
  const chart = chartSheet.addChart({
    type: 'line',
    title: { name: 'Tarih Bazlı Dağılım' },
    legend: { position: 'right' },
    series: [{
      name: 'Günlük Sayı',
      labels: Object.keys(dateGroups),
      values: Object.values(dateGroups)
    }]
  });
  chart.setPosition('A24', 'H40');
  */
} 