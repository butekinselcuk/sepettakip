import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Token doğrulama fonksiyonu
const verifyToken = (token: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key', (err, decoded) => {
      if (err) return resolve(null);
      resolve(decoded);
    });
  });
};

export async function GET(request: NextRequest) {
  try {
    // Token doğrulama
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: Token bulunamadı' },
        { status: 401 }
      );
    }
    
    const decodedToken = await verifyToken(token);
    
    if (!decodedToken || !decodedToken.userId) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: Geçersiz token' },
        { status: 401 }
      );
    }
    
    // URL'den businessId sorgusu al
    const searchParams = request.nextUrl.searchParams;
    let businessId = searchParams.get('businessId');
    
    // Kullanıcı doğrulama
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.userId },
      include: { business: true }
    });
    
    // Eğer URL'de businessId yoksa ve kullanıcı bir işletme ise, kendi menüsünü getir
    if (!businessId && user?.business) {
      businessId = user.business.id;
    } else if (!businessId && (!user || user.role !== 'BUSINESS')) {
      return NextResponse.json(
        { error: 'BusinessId belirtilmedi ve kullanıcı bir işletme değil' },
        { status: 400 }
      );
    }
    
    // BusinessId değeri null olamaz (yukarıdaki kontrollerden sonra)
    if (!businessId) {
      return NextResponse.json(
        { error: 'Geçerli bir businessId belirtilmelidir' },
        { status: 400 }
      );
    }
    
    // İşletme menüsünü getir
    const menuItems = await prisma.menuItem.findMany({
      where: {
        businessId: businessId,
        isAvailable: true
      },
      orderBy: {
        category: 'asc'
      }
    });
    
    // Menü öğelerini kategorilere göre grupla
    const categories: { [key: string]: any[] } = {};
    
    menuItems.forEach(item => {
      const category = item.category || 'Diğer';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(item);
    });
    
    return NextResponse.json({
      businessId,
      menu: categories
    });
  } catch (error) {
    console.error('Menü öğeleri alınırken hata:', error);
    return NextResponse.json(
      { error: 'Menü öğeleri alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Token doğrulama
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: Token bulunamadı' },
        { status: 401 }
      );
    }
    
    const decodedToken = await verifyToken(token);
    
    if (!decodedToken || !decodedToken.userId) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: Geçersiz token' },
        { status: 401 }
      );
    }
    
    // Kullanıcı işletme mi kontrolü
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.userId },
      include: { business: true }
    });
    
    if (!user || user.role !== 'BUSINESS' || !user.business) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: İşletme erişimi gerekiyor' },
        { status: 403 }
      );
    }
    
    const businessId = user.business.id;
    
    // Request body'den yeni menü öğesi verilerini al
    const body = await request.json();
    
    const { name, description, price, category, imageUrl } = body;
    
    // Veri doğrulama
    if (!name || !price) {
      return NextResponse.json(
        { error: 'Menü öğesi adı ve fiyatı gereklidir' },
        { status: 400 }
      );
    }
    
    // Aynı isimle menü öğesi var mı kontrol et
    const existingItem = await prisma.menuItem.findFirst({
      where: {
        businessId,
        name
      }
    });
    
    if (existingItem) {
      return NextResponse.json(
        { error: 'Bu isimde bir menü öğesi zaten mevcut' },
        { status: 409 }
      );
    }
    
    // Yeni menü öğesi oluştur
    const newMenuItem = await prisma.menuItem.create({
      data: {
        businessId,
        name,
        description,
        price,
        category,
        imageUrl,
        isAvailable: true
      }
    });
    
    return NextResponse.json(newMenuItem, { status: 201 });
  } catch (error) {
    console.error('Menü öğesi oluşturulurken hata:', error);
    return NextResponse.json(
      { error: 'Menü öğesi oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Token doğrulama
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: Token bulunamadı' },
        { status: 401 }
      );
    }
    
    const decodedToken = await verifyToken(token);
    
    if (!decodedToken || !decodedToken.userId) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: Geçersiz token' },
        { status: 401 }
      );
    }
    
    // Kullanıcı işletme mi kontrolü
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.userId },
      include: { business: true }
    });
    
    if (!user || user.role !== 'BUSINESS' || !user.business) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: İşletme erişimi gerekiyor' },
        { status: 403 }
      );
    }
    
    const businessId = user.business.id;
    
    // Request body'den güncellenen menü öğesi verilerini al
    const body = await request.json();
    
    const { id, name, description, price, category, imageUrl, isAvailable } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Güncellenecek menü öğesi ID\'si gereklidir' },
        { status: 400 }
      );
    }
    
    // Menü öğesini bul ve işletmenin sahibi olduğunu kontrol et
    const menuItem = await prisma.menuItem.findUnique({
      where: { id }
    });
    
    if (!menuItem) {
      return NextResponse.json(
        { error: 'Menü öğesi bulunamadı' },
        { status: 404 }
      );
    }
    
    if (menuItem.businessId !== businessId) {
      return NextResponse.json(
        { error: 'Bu menü öğesini güncelleme yetkiniz yok' },
        { status: 403 }
      );
    }
    
    // Menü öğesini güncelle
    const updatedMenuItem = await prisma.menuItem.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        price: price !== undefined ? price : undefined,
        category: category !== undefined ? category : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        isAvailable: isAvailable !== undefined ? isAvailable : undefined
      }
    });
    
    return NextResponse.json(updatedMenuItem);
  } catch (error) {
    console.error('Menü öğesi güncellenirken hata:', error);
    return NextResponse.json(
      { error: 'Menü öğesi güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Token doğrulama
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: Token bulunamadı' },
        { status: 401 }
      );
    }
    
    const decodedToken = await verifyToken(token);
    
    if (!decodedToken || !decodedToken.userId) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: Geçersiz token' },
        { status: 401 }
      );
    }
    
    // Kullanıcı işletme mi kontrolü
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.userId },
      include: { business: true }
    });
    
    if (!user || user.role !== 'BUSINESS' || !user.business) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: İşletme erişimi gerekiyor' },
        { status: 403 }
      );
    }
    
    const businessId = user.business.id;
    
    // URL'den silinecek menü öğesi ID'sini al
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Silinecek menü öğesi ID\'si gereklidir' },
        { status: 400 }
      );
    }
    
    // Menü öğesini bul ve işletmenin sahibi olduğunu kontrol et
    const menuItem = await prisma.menuItem.findUnique({
      where: { id }
    });
    
    if (!menuItem) {
      return NextResponse.json(
        { error: 'Menü öğesi bulunamadı' },
        { status: 404 }
      );
    }
    
    if (menuItem.businessId !== businessId) {
      return NextResponse.json(
        { error: 'Bu menü öğesini silme yetkiniz yok' },
        { status: 403 }
      );
    }
    
    // Menü öğesini sil
    await prisma.menuItem.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Menü öğesi silinirken hata:', error);
    return NextResponse.json(
      { error: 'Menü öğesi silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 