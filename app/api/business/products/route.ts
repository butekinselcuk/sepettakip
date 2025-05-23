import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { JWTPayload } from '@/lib/validations/auth';
import { ZodError, z } from 'zod';

// Ürün schema
const productSchema = z.object({
  name: z.string().min(2, "Ürün adı en az 2 karakter olmalıdır"),
  description: z.string().optional(),
  price: z.number().positive("Fiyat pozitif bir değer olmalıdır"),
  quantity: z.number().min(0, "Miktar negatif olamaz"),
  sku: z.string().optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
  categoryId: z.string().uuid().optional().nullable()
});

// Filtreleme şeması
const filterSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  category: z.string().optional(),
  search: z.string().optional(),
  orderBy: z.enum(['name', 'price', 'quantity', 'createdAt']).optional(),
  orderDir: z.enum(['asc', 'desc']).default('asc'),
  isActive: z.enum(['true', 'false', 'all']).default('all'),
});

// GET: Ürünleri getir
export async function GET(request: Request) {
  try {
    // JWT token'ı doğrula
    const token = request.headers.get("authorization")?.split(" ")[1];
    
    if (!token) {
      return NextResponse.json(
        { error: "Yetkilendirme token'ı eksik" },
        { status: 401 }
      );
    }

    const decodedToken = await verifyJWT(token) as JWTPayload;
    
    if (!decodedToken || decodedToken.role !== "BUSINESS") {
      return NextResponse.json(
        { error: "Bu işlem için yetkiniz yok" },
        { status: 403 }
      );
    }

    const businessId = decodedToken.businessId;
    if (!businessId) {
      return NextResponse.json(
        { error: "İşletme ID'si bulunamadı" },
        { status: 400 }
      );
    }

    // URL parametrelerini al
    const { searchParams } = new URL(request.url);
    
    // Filtreleme parametrelerini parse et
    const filterResult = filterSchema.safeParse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      category: searchParams.get("category"),
      search: searchParams.get("search"),
      orderBy: searchParams.get("orderBy"),
      orderDir: searchParams.get("orderDir"),
      isActive: searchParams.get("isActive"),
    });
    
    if (!filterResult.success) {
      return NextResponse.json(
        { error: "Geçersiz filtre parametreleri", details: filterResult.error.format() },
        { status: 400 }
      );
    }
    
    const filter = filterResult.data;
    const skip = (filter.page - 1) * filter.limit;

    // Filtreleme koşullarını oluştur
    const where: any = {
      businessId: businessId,
    };

    // Kategori filtresi
    if (filter.category) {
      where.categoryId = filter.category;
    }

    // Aktiflik durumu filtresi
    if (filter.isActive !== 'all') {
      where.isActive = filter.isActive === 'true';
    }

    // Arama filtresi
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
        { sku: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    // Sıralama seçeneklerini oluştur
    const orderBy: any = {};
    if (filter.orderBy) {
      orderBy[filter.orderBy] = filter.orderDir;
    } else {
      orderBy.name = filter.orderDir;
    }

    // Ürünleri getir
    const products = await prisma.inventory.findMany({
      where,
      orderBy,
      skip,
      take: filter.limit,
      include: {
        category: true
      }
    });

    // Toplam ürün sayısını getir
    const totalProducts = await prisma.inventory.count({
      where,
    });

    // Toplam kategori sayısını getir
    const totalCategories = await prisma.productCategory.count({
      where: {
        businessId: businessId,
      },
    });

    // Yanıtı formatla
    return NextResponse.json({
      products,
      pagination: {
        total: totalProducts,
        page: filter.page,
        limit: filter.limit,
        pages: Math.ceil(totalProducts / filter.limit),
      },
      meta: {
        totalCategories,
      },
    });
  } catch (error) {
    console.error("Ürünleri getirme hatası:", error);
    return NextResponse.json(
      { error: "Ürünler alınırken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// POST: Yeni ürün oluştur
export async function POST(request: Request) {
  try {
    // JWT token'ı doğrula
    const token = request.headers.get("authorization")?.split(" ")[1];
    
    if (!token) {
      return NextResponse.json(
        { error: "Yetkilendirme token'ı eksik" },
        { status: 401 }
      );
    }

    const decodedToken = await verifyJWT(token) as JWTPayload;
    
    if (!decodedToken || decodedToken.role !== "BUSINESS") {
      return NextResponse.json(
        { error: "Bu işlem için yetkiniz yok" },
        { status: 403 }
      );
    }

    const businessId = decodedToken.businessId;
    if (!businessId) {
      return NextResponse.json(
        { error: "İşletme ID'si bulunamadı" },
        { status: 400 }
      );
    }

    // Request body'den veri al
    const body = await request.json();
    
    // Veriyi doğrula
    const validatedData = productSchema.parse(body);

    // Eğer categoryId varsa, geçerli olduğunu kontrol et
    if (validatedData.categoryId) {
      const category = await prisma.productCategory.findFirst({
        where: {
          id: validatedData.categoryId,
          businessId,
        },
      });

      if (!category) {
        return NextResponse.json(
          { error: "Belirtilen kategori bulunamadı" },
          { status: 400 }
        );
      }
    }

    // Ürünü oluştur
    const newProduct = await prisma.inventory.create({
      data: {
        ...validatedData,
        businessId,
      },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Ürün oluşturma hatası:", error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Geçersiz veri formatı", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Ürün oluşturulurken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// PUT: Ürün güncelle
export async function PUT(request: Request) {
  try {
    // JWT token'ı doğrula
    const token = request.headers.get("authorization")?.split(" ")[1];
    
    if (!token) {
      return NextResponse.json(
        { error: "Yetkilendirme token'ı eksik" },
        { status: 401 }
      );
    }

    const decodedToken = await verifyJWT(token) as JWTPayload;
    
    if (!decodedToken || decodedToken.role !== "BUSINESS") {
      return NextResponse.json(
        { error: "Bu işlem için yetkiniz yok" },
        { status: 403 }
      );
    }

    const businessId = decodedToken.businessId;
    if (!businessId) {
      return NextResponse.json(
        { error: "İşletme ID'si bulunamadı" },
        { status: 400 }
      );
    }

    // URL parametrelerini al
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');
    
    if (!productId) {
      return NextResponse.json(
        { error: "Ürün ID'si belirtilmedi" },
        { status: 400 }
      );
    }

    // Ürünü kontrol et
    const existingProduct = await prisma.inventory.findFirst({
      where: {
        id: productId,
        businessId,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Ürün bulunamadı" },
        { status: 404 }
      );
    }

    // Request body'den veri al
    const body = await request.json();
    
    // Veriyi doğrula
    const validatedData = productSchema.parse(body);

    // Eğer categoryId varsa, geçerli olduğunu kontrol et
    if (validatedData.categoryId) {
      const category = await prisma.productCategory.findFirst({
        where: {
          id: validatedData.categoryId,
          businessId,
        },
      });

      if (!category) {
        return NextResponse.json(
          { error: "Belirtilen kategori bulunamadı" },
          { status: 400 }
        );
      }
    }

    // Ürünü güncelle
    const updatedProduct = await prisma.inventory.update({
      where: {
        id: productId,
      },
      data: validatedData,
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Ürün güncelleme hatası:", error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Geçersiz veri formatı", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Ürün güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// DELETE: Ürün sil
export async function DELETE(request: Request) {
  try {
    // JWT token'ı doğrula
    const token = request.headers.get("authorization")?.split(" ")[1];
    
    if (!token) {
      return NextResponse.json(
        { error: "Yetkilendirme token'ı eksik" },
        { status: 401 }
      );
    }

    const decodedToken = await verifyJWT(token) as JWTPayload;
    
    if (!decodedToken || decodedToken.role !== "BUSINESS") {
      return NextResponse.json(
        { error: "Bu işlem için yetkiniz yok" },
        { status: 403 }
      );
    }

    const businessId = decodedToken.businessId;
    if (!businessId) {
      return NextResponse.json(
        { error: "İşletme ID'si bulunamadı" },
        { status: 400 }
      );
    }

    // URL parametrelerini al
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');
    
    if (!productId) {
      return NextResponse.json(
        { error: "Ürün ID'si belirtilmedi" },
        { status: 400 }
      );
    }

    // Ürünü kontrol et
    const existingProduct = await prisma.inventory.findFirst({
      where: {
        id: productId,
        businessId,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Ürün bulunamadı" },
        { status: 404 }
      );
    }

    // Ürünü sil
    await prisma.inventory.delete({
      where: {
        id: productId,
      },
    });

    return NextResponse.json({ message: "Ürün başarıyla silindi" });
  } catch (error) {
    console.error("Ürün silme hatası:", error);
    return NextResponse.json(
      { error: "Ürün silinirken bir hata oluştu" },
      { status: 500 }
    );
  }
} 