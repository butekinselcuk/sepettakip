import PDFDocument from 'pdfkit';

/**
 * PDF formatında rapor oluşturur
 * 
 * @param title Rapor başlığı
 * @param data Raporlanacak veri
 * @param columns Gösterilecek sütunlar
 * @param options Rapor seçenekleri
 * @returns PDF dosyası buffer'ı
 */
export async function generateReportPDF(
  title: string,
  data: any[],
  columns: string[],
  options?: {
    includeTotals?: boolean;
    includeCharts?: boolean;
  }
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Buffers array to store PDF chunks
      const buffers: Buffer[] = [];
      
      // Create PDF document
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        info: {
          Title: title,
          Author: 'SepetTakip System',
          Creator: 'SepetTakip Report Generator',
        },
      });
      
      // Collect PDF data chunks
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      
      // Set font
      doc.font('Helvetica');
      
      // Add header
      addHeader(doc, title);
      
      // Add table header
      const columnLabels = getColumnLabels(columns);
      const columnWidths = calculateColumnWidths(columnLabels, doc.page.width - 100);
      
      // Add table
      addTable(doc, data, columns, columnLabels, columnWidths);
      
      // Add totals if requested
      if (options?.includeTotals) {
        addTotals(doc, data, columns, columnLabels, columnWidths);
      }
      
      // Add charts if requested
      if (options?.includeCharts) {
        // Note: PDF charting is more complex and might require a library
        // For simplicity, we'll just add a note about charts
        doc.addPage();
        doc.fontSize(16).text('Grafikler', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text('Grafikler için lütfen Excel formatını tercih ediniz.', { align: 'center' });
      }
      
      // Add footer with page numbers
      let pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        
        // Save position
        const originalBottomMargin = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;
        
        // Add footer
        doc.fontSize(8)
           .text(
              `Sayfa ${i + 1} / ${pageCount} - SepetTakip Sistemi tarafından oluşturuldu. Oluşturulma tarihi: ${new Date().toLocaleString('tr-TR')}`,
              50,
              doc.page.height - 50,
              { align: 'center', width: doc.page.width - 100 }
           );
        
        // Restore margins
        doc.page.margins.bottom = originalBottomMargin;
      }
      
      // Finalize the PDF
      doc.end();
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * PDF'e başlık ekler
 */
function addHeader(doc: PDFKit.PDFDocument, title: string) {
  // Logo veya başlık eklenebilir
  doc.fontSize(18)
     .fillColor('#333333')
     .text(title, { align: 'center' });
  
  doc.moveDown();
  doc.fontSize(10)
     .fillColor('#666666')
     .text(`Oluşturulma Tarihi: ${new Date().toLocaleString('tr-TR')}`, { align: 'center' });
  
  doc.moveDown(2);
}

/**
 * Sütun genişliklerini hesaplar
 */
function calculateColumnWidths(columnLabels: string[], totalWidth: number): number[] {
  const columnCount = columnLabels.length;
  
  // Minimum genişlik
  const minWidth = 50;
  
  // Her sütunun tahmini genişliği (karakter uzunluğu bazında)
  const estimatedWidths = columnLabels.map(label => Math.max(label.length * 7, minWidth));
  
  // Toplam tahmini genişlik
  const totalEstimatedWidth = estimatedWidths.reduce((sum, width) => sum + width, 0);
  
  // Genişlikleri orantılı olarak ayarla
  const widths = estimatedWidths.map(width => 
    Math.floor((width / totalEstimatedWidth) * totalWidth)
  );
  
  return widths;
}

/**
 * PDF'e tablo ekler
 */
function addTable(
  doc: PDFKit.PDFDocument, 
  data: any[], 
  columns: string[], 
  columnLabels: string[],
  columnWidths: number[]
) {
  const rowHeight = 20;
  const fontSize = 10;
  let yPos = doc.y;
  
  // Tablo başlığı
  doc.fontSize(fontSize).fillColor('#ffffff');
  let xPos = 50;
  
  for (let i = 0; i < columnLabels.length; i++) {
    // Başlık hücresinin arka planını çiz
    doc.fillColor('#4A5568')
       .rect(xPos, yPos, columnWidths[i], rowHeight)
       .fill();
    
    // Başlık metnini ekle
    doc.fillColor('#ffffff')
       .text(
          columnLabels[i], 
          xPos + 2, 
          yPos + 5, 
          { width: columnWidths[i] - 4, align: 'center' }
       );
    
    xPos += columnWidths[i];
  }
  
  yPos += rowHeight;
  
  // Tablo içeriği
  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    // Sayfa taşması kontrolü
    if (yPos + rowHeight > doc.page.height - 70) {
      doc.addPage();
      yPos = 50; // Yeni sayfada başlangıç pozisyonu
      
      // Yeni sayfada tablo başlığını tekrar ekle
      xPos = 50;
      for (let i = 0; i < columnLabels.length; i++) {
        doc.fillColor('#4A5568')
           .rect(xPos, yPos, columnWidths[i], rowHeight)
           .fill();
        
        doc.fillColor('#ffffff')
           .text(
              columnLabels[i], 
              xPos + 2, 
              yPos + 5, 
              { width: columnWidths[i] - 4, align: 'center' }
           );
        
        xPos += columnWidths[i];
      }
      
      yPos += rowHeight;
    }
    
    // Satır arka planı (alternatif renklendirme)
    const bgColor = rowIndex % 2 === 0 ? '#ffffff' : '#f7fafc';
    
    xPos = 50;
    doc.fillColor(bgColor);
    doc.rect(xPos, yPos, doc.page.width - 100, rowHeight).fill();
    
    // Satır içeriği
    doc.fontSize(fontSize).fillColor('#333333');
    xPos = 50;
    
    for (let i = 0; i < columns.length; i++) {
      const value = formatCellValue(data[rowIndex][columns[i]]);
      
      doc.text(
        value, 
        xPos + 2, 
        yPos + 5, 
        { width: columnWidths[i] - 4, align: 'left' }
      );
      
      xPos += columnWidths[i];
    }
    
    // Hücre sınırlarını çiz
    doc.strokeColor('#e2e8f0');
    
    // Yatay çizgi (satır altı)
    doc.moveTo(50, yPos + rowHeight)
       .lineTo(doc.page.width - 50, yPos + rowHeight)
       .stroke();
    
    // Dikey çizgiler
    xPos = 50;
    for (let i = 0; i <= columns.length; i++) {
      doc.moveTo(xPos, yPos)
         .lineTo(xPos, yPos + rowHeight)
         .stroke();
      
      if (i < columns.length) {
        xPos += columnWidths[i];
      }
    }
    
    yPos += rowHeight;
  }
}

/**
 * PDF'e toplam satırı ekler
 */
function addTotals(
  doc: PDFKit.PDFDocument,
  data: any[],
  columns: string[],
  columnLabels: string[],
  columnWidths: number[]
) {
  const rowHeight = 20;
  const fontSize = 10;
  let yPos = doc.y;
  
  // Sayfa taşması kontrolü
  if (yPos + rowHeight > doc.page.height - 70) {
    doc.addPage();
    yPos = 50; // Yeni sayfada başlangıç pozisyonu
  }
  
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
  
  // Toplam satırı arka planı
  doc.fillColor('#e2e8f0')
     .rect(50, yPos, doc.page.width - 100, rowHeight)
     .fill();
  
  // Toplam satırı içeriği
  doc.fontSize(fontSize).fillColor('#000000');
  let xPos = 50;
  
  for (let i = 0; i < columns.length; i++) {
    let value = '';
    
    if (i === 0) {
      value = 'TOPLAM';
    } else {
      value = formatCellValue(totals[columns[i]]);
    }
    
    doc.text(
      value, 
      xPos + 2, 
      yPos + 5, 
      { width: columnWidths[i] - 4, align: i === 0 ? 'left' : 'right', continued: i < columns.length - 1 }
    );
    
    xPos += columnWidths[i];
  }
  
  // Hücre sınırlarını çiz
  doc.strokeColor('#a0aec0');
  
  // Yatay çizgiler
  doc.moveTo(50, yPos)
     .lineTo(doc.page.width - 50, yPos)
     .stroke();
  
  doc.moveTo(50, yPos + rowHeight)
     .lineTo(doc.page.width - 50, yPos + rowHeight)
     .stroke();
  
  // Dikey çizgiler
  xPos = 50;
  for (let i = 0; i <= columns.length; i++) {
    doc.moveTo(xPos, yPos)
       .lineTo(xPos, yPos + rowHeight)
       .stroke();
    
    if (i < columns.length) {
      xPos += columnWidths[i];
    }
  }
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