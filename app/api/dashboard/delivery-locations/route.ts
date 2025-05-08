import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Status } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Tarih parametreleri
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    
    // Filtre parametreleri
    const regionFilter = searchParams.get('region');
    const courierFilter = searchParams.get('courier');
    const statusFilter = searchParams.get('status');
    const platformFilter = searchParams.get('platform');
    const orderTypeFilter = searchParams.get('orderType');
    const minAmountParam = searchParams.get('minAmount');
    const maxAmountParam = searchParams.get('maxAmount');
    const onlyLate = searchParams.get('onlyLate') === 'true';
    
    // Tarih filtresi
    const from = fromParam ? new Date(fromParam) : new Date(new Date().setDate(new Date().getDate() - 7));
    const to = toParam ? new Date(toParam) : new Date();
    
    // Temel filtre koşulları
    const whereConditions: any = {
      createdAt: {
        gte: from,
        lte: to
      }
    };
    
    // Filtre koşulları
    if (courierFilter && courierFilter !== 'all') {
      whereConditions.courierId = courierFilter;
    }
    
    if (statusFilter && statusFilter !== 'all') {
      whereConditions.status = statusFilter as Status;
    }
    
    if (regionFilter && regionFilter !== 'all') {
      whereConditions.zoneId = regionFilter;
    }
    
    if (platformFilter && platformFilter !== 'all') {
      whereConditions.platformId = platformFilter;
    }
    
    if (orderTypeFilter && orderTypeFilter !== 'all') {
      whereConditions.orderType = orderTypeFilter;
    }
    
    if (minAmountParam) {
      whereConditions.amount = {
        ...whereConditions.amount,
        gte: parseFloat(minAmountParam)
      };
    }
    
    if (maxAmountParam) {
      whereConditions.amount = {
        ...whereConditions.amount,
        lte: parseFloat(maxAmountParam)
      };
    }
    
    if (onlyLate) {
      whereConditions.isLate = true;
    }
    
    // Lokasyon verisi için örnek veri oluştur
    // Gerçek uygulamada bu veriler veritabanından çekilir
    
    // İstanbul'da farklı bölgeler için örnek koordinatlar
    const istanbulAreas = [
      { lat: 41.0082, lng: 28.9784, name: 'Sultanahmet' }, // Sultanahmet
      { lat: 41.0366, lng: 28.9850, name: 'Taksim' }, // Taksim
      { lat: 41.0114, lng: 29.0728, name: 'Kadıköy' }, // Kadıköy
      { lat: 41.0483, lng: 29.0020, name: 'Beşiktaş' }, // Beşiktaş
      { lat: 41.0177, lng: 29.0710, name: 'Üsküdar' }, // Üsküdar
      { lat: 41.0051, lng: 28.9320, name: 'Zeytinburnu' }, // Zeytinburnu
      { lat: 41.0678, lng: 28.9388, name: 'Eyüpsultan' }, // Eyüpsultan
      { lat: 40.9865, lng: 29.1525, name: 'Maltepe' }, // Maltepe
      { lat: 41.0790, lng: 29.0500, name: 'Sarıyer' }, // Sarıyer
      { lat: 41.0128, lng: 28.9700, name: 'Fatih' }, // Fatih
    ];
    
    // Rastgele varyasyonlu lokasyonlar oluştur
    const generateRandomLocations = (count: number) => {
      const statuses = ['completed', 'in_progress', 'cancelled', 'delayed'];
      const locations = [];
      
      for (let i = 0; i < count; i++) {
        const baseArea = istanbulAreas[Math.floor(Math.random() * istanbulAreas.length)];
        
        // Baz koordinata rastgele varyasyon ekle
        const latVariation = (Math.random() - 0.5) * 0.02;
        const lngVariation = (Math.random() - 0.5) * 0.02;
        
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        locations.push({
          id: `loc-${i}`,
          latitude: baseArea.lat + latVariation,
          longitude: baseArea.lng + lngVariation,
          status: statusFilter !== 'all' ? statusFilter : status,
          address: `${baseArea.name}, İstanbul`,
          courierId: `courier-${Math.floor(Math.random() * 10) + 1}`,
          courierName: `Kurye ${Math.floor(Math.random() * 10) + 1}`,
          timestamp: new Date(
            from.getTime() + Math.random() * (to.getTime() - from.getTime())
          ).toISOString()
        });
      }
      
      return locations;
    };
    
    // Filtre durumuna göre lokasyon sayısını belirle
    let locationCount = 25; // Varsayılan değer
    
    if (regionFilter !== 'all') locationCount = 10;
    if (courierFilter !== 'all') locationCount = 15;
    if (statusFilter !== 'all') locationCount = 20;
    
    const mockLocations = generateRandomLocations(locationCount);
    
    return NextResponse.json(mockLocations);
  } catch (error) {
    console.error('Teslimat lokasyonları alınamadı:', error);
    return NextResponse.json({ error: 'Teslimat lokasyonları alınamadı' }, { status: 500 });
  }
} 