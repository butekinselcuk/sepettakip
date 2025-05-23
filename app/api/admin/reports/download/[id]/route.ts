import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Yetki kontrolü
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Admin yetkisi veya report:download yetkisi kontrolü
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    
    const hasPermission = user?.role?.permissions?.includes('reports:download') || 
                          user?.role?.name === 'admin';
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    
    // Raporu veritabanından al
    const reportId = params.id;
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });
    
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    
    // Kullanıcı raporu indirme yetkisine sahip mi kontrol et
    // Admin değilse ve rapor başka bir kullanıcıya aitse indiremez
    if (user?.role?.name !== 'admin' && report.userId !== userId) {
      return NextResponse.json({ error: 'You do not have permission to download this report' }, { status: 403 });
    }
    
    // Rapor dosyasının tam yolunu oluştur
    const filePath = path.join(process.cwd(), 'public', report.filePath.replace(/^\//, ''));
    
    // Dosyanın varlığını kontrol et
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Report file not found' }, { status: 404 });
    }
    
    // Dosyayı oku
    const fileBuffer = fs.readFileSync(filePath);
    
    // İndirme kaydını oluştur
    await prisma.reportDownload.create({
      data: {
        reportId: report.id,
        userId,
        downloadedAt: new Date(),
      },
    });
    
    // Dosya tipini belirle
    let contentType = 'application/octet-stream';
    switch (report.format) {
      case 'excel':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'pdf':
        contentType = 'application/pdf';
        break;
      case 'csv':
        contentType = 'text/csv';
        break;
    }
    
    // Dosya adını belirle
    const fileName = `${report.title}.${report.format}`;
    
    // Dosyayı yanıt olarak gönder
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    });
    
  } catch (error) {
    console.error('Error downloading report:', error);
    return NextResponse.json({ 
      error: 'Failed to download report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 