import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/app/lib/admin/permissions';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/reports/export/[id]/download - Rapor indirme
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Yetkilendirme
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Kimlik doğrulama gerekli' }, { status: 401 });
    }
    
    // Rapor indirme yetkisi
    const hasAccess = await hasPermission('reports:download');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }

    // Rapor ID'sini al
    const reportId = params.id;
    if (!reportId) {
      return NextResponse.json({ error: 'Rapor ID gerekli' }, { status: 400 });
    }

    // URL'den format parametresini al
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'xlsx';

    // Raporu veritabanından getir
    const report = await prisma.report.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      return NextResponse.json({ error: 'Rapor bulunamadı' }, { status: 404 });
    }

    // Raporun sahibi olup olmadığını kontrol et (Admin hariç)
    if (session.user.role !== 'ADMIN' && report.userId !== session.user.id) {
      return NextResponse.json({ error: 'Bu raporu indirme yetkiniz yok' }, { status: 403 });
    }

    // Rapor verilerini al
    const reportData = report.data || {};
    
    // İstenen formatta raporu oluştur
    let responseData;
    let contentType;
    let fileName;
    
    switch (format.toLowerCase()) {
      case 'xlsx':
      case 'excel':
        responseData = await generateExcelReport(reportData, report);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileName = `${report.name.replace(/\s+/g, '_')}_${report.id}.xlsx`;
        break;
        
      case 'csv':
        responseData = await generateCsvReport(reportData, report);
        contentType = 'text/csv';
        fileName = `${report.name.replace(/\s+/g, '_')}_${report.id}.csv`;
        break;
        
      case 'pdf':
        responseData = await generatePdfReport(reportData, report);
        contentType = 'application/pdf';
        fileName = `${report.name.replace(/\s+/g, '_')}_${report.id}.pdf`;
        break;
        
      default:
        return NextResponse.json({ error: 'Desteklenmeyen format' }, { status: 400 });
    }
    
    // Dosya indirme bilgilerini güncelle
    await prisma.report.update({
      where: { id: reportId },
      data: { 
        url: `/api/admin/reports/export/${reportId}/download?format=${format}`,
      }
    });

    // Set appropriate headers for file download
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // Return the file as a response
    return new NextResponse(responseData, {
      status: 200,
      headers
    });
    
  } catch (error) {
    console.error('Rapor indirme hatası:', error);
    return NextResponse.json({ error: 'Rapor indirme sırasında bir hata oluştu' }, { status: 500 });
  }
}

/**
 * Excel raporu oluştur
 */
async function generateExcelReport(data: any, report: any): Promise<Buffer> {
  // Not: Gerçek uygulamada, Excel oluşturmak için ExcelJS gibi 
  // bir kütüphane kullanmalısınız. Burada basit bir simülasyon yapıyoruz.
  
  // Bu bir simülasyondur ve gerçek bir Excel içermez
  return Buffer.from(JSON.stringify({
    reportName: report.name,
    reportType: report.type,
    createdAt: report.createdAt,
    data: data
  }));

  // Gerçek bir Excel oluşturmak için:
  // const ExcelJS = require('exceljs');
  // const workbook = new ExcelJS.Workbook();
  // const worksheet = workbook.addWorksheet('Report');
  // 
  // // Add headers from data
  // const headers = Object.keys(data[0] || {});
  // worksheet.addRow(headers);
  // 
  // // Add data rows
  // data.forEach(item => {
  //   const row = [];
  //   headers.forEach(header => {
  //     row.push(item[header]);
  //   });
  //   worksheet.addRow(row);
  // });
  // 
  // return await workbook.xlsx.writeBuffer();
}

/**
 * CSV raporu oluştur
 */
async function generateCsvReport(data: any, report: any): Promise<Buffer> {
  // Not: Gerçek uygulamada, CSV oluşturmak için bir kütüphane 
  // kullanabilirsiniz. Burada basit bir simülasyon yapıyoruz.
  
  // Bu bir simülasyondur ve gerçek bir CSV içermez
  return Buffer.from(JSON.stringify({
    reportName: report.name,
    reportType: report.type,
    createdAt: report.createdAt,
    data: data
  }));

  // Gerçek CSV oluşturmak için:
  // const headers = Object.keys(data[0] || {}).join(',');
  // const rows = data.map(item => {
  //   return Object.values(item).map(value => {
  //     // If value contains commas or double quotes, enclose in double quotes
  //     if (String(value).includes(',') || String(value).includes('"')) {
  //       return `"${String(value).replace(/"/g, '""')}"`;
  //     }
  //     return value;
  //   }).join(',');
  // });
  // 
  // return Buffer.from([headers, ...rows].join('\n'));
}

/**
 * PDF raporu oluştur
 */
async function generatePdfReport(data: any, report: any): Promise<Buffer> {
  // Not: Gerçek uygulamada, PDF oluşturmak için PDFKit gibi
  // bir kütüphane kullanmalısınız. Burada basit bir simülasyon yapıyoruz.
  
  // Bu bir simülasyondur ve gerçek bir PDF içermez
  return Buffer.from(JSON.stringify({
    reportName: report.name,
    reportType: report.type,
    createdAt: report.createdAt,
    data: data
  }));

  // Gerçek PDF oluşturmak için:
  // const PDFDocument = require('pdfkit');
  // const doc = new PDFDocument();
  // 
  // const buffers = [];
  // doc.on('data', buffers.push.bind(buffers));
  // 
  // let bufferPromise = new Promise((resolve) => {
  //   doc.on('end', () => {
  //     const pdfData = Buffer.concat(buffers);
  //     resolve(pdfData);
  //   });
  // });
  // 
  // // Add content to PDF
  // doc.fontSize(25).text(report.name, { align: 'center' });
  // doc.moveDown();
  // doc.fontSize(14).text(`Generated on: ${new Date(report.createdAt).toLocaleString()}`);
  // doc.moveDown();
  // 
  // // Add a table - this is simplified, you'd need to format this better
  // if (Array.isArray(data) && data.length > 0) {
  //   const headers = Object.keys(data[0]);
  //   doc.fontSize(12);
  //   doc.text(headers.join(' | '));
  //   doc.moveDown(0.5);
  //   
  //   data.forEach(item => {
  //     doc.text(headers.map(h => item[h]).join(' | '));
  //     doc.moveDown(0.5);
  //   });
  // }
  // 
  // doc.end();
  // return await bufferPromise;
} 