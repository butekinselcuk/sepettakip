import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { JWTPayload } from '@/lib/validations/auth';
import { ZodError, z } from 'zod';

// Kategori oluşturma/güncelleme için schema
const categorySchema = z.object({
  name: z.string().min(2, "Kategori adı en az 2 karakter olmalıdır"),
  description: z.string().optional(),
  slug: z.string().min(2, "Slug en az 2 karakter olmalıdır"),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
  parentId: z.string().uuid().optional().nullable()
});

// GET: Tüm kategorileri getir
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
    const parentId = searchParams.get('parentId');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Filtreleme koşullarını oluştur
    const where: any = {
      businessId: businessId,
    };

    // Ana kategorileri mi yoksa alt kategorileri mi getiriyoruz?
    if (parentId) {
      where.parentId = parentId;
    } else {
      where.parentId = null; // Ana kategoriler
    }

    // Aktif olmayan kategorileri dahil et veya etme
    if (!includeInactive) {
      where.isActive = true;
    }

    // Kategorileri getir
    const categories = await prisma.productCategory.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
      include: {
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      }
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Kategorileri getirme hatası:", error);
    return NextResponse.json(
      { error: "Kategoriler alınırken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// POST: Yeni kategori oluştur
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
    const validatedData = categorySchema.parse(body);

    // Slug'ın benzersiz olduğunu kontrol et
    const existingCategory = await prisma.productCategory.findFirst({
      where: {
        businessId,
        slug: validatedData.slug,
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Bu slug ile zaten bir kategori mevcut" },
        { status: 400 }
      );
    }

    // Eğer parentId varsa, geçerli olduğunu kontrol et
    if (validatedData.parentId) {
      const parentCategory = await prisma.productCategory.findFirst({
        where: {
          id: validatedData.parentId,
          businessId,
        },
      });

      if (!parentCategory) {
        return NextResponse.json(
          { error: "Belirtilen üst kategori bulunamadı" },
          { status: 400 }
        );
      }
    }

    // Kategoriyi oluştur
    const newCategory = await prisma.productCategory.create({
      data: {
        ...validatedData,
        businessId,
      },
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Kategori oluşturma hatası:", error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Geçersiz veri formatı", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Kategori oluşturulurken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// PUT: Kategori güncelle
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
    const categoryId = searchParams.get('id');
    
    if (!categoryId) {
      return NextResponse.json(
        { error: "Kategori ID'si belirtilmedi" },
        { status: 400 }
      );
    }

    // Kategoriyi kontrol et
    const existingCategory = await prisma.productCategory.findFirst({
      where: {
        id: categoryId,
        businessId,
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Kategori bulunamadı" },
        { status: 404 }
      );
    }

    // Request body'den veri al
    const body = await request.json();
    
    // Veriyi doğrula
    const validatedData = categorySchema.parse(body);

    // Slug güncellendiyse, benzersiz olduğunu kontrol et
    if (validatedData.slug !== existingCategory.slug) {
      const categoryWithSameSlug = await prisma.productCategory.findFirst({
        where: {
          businessId,
          slug: validatedData.slug,
          id: { not: categoryId },
        },
      });

      if (categoryWithSameSlug) {
        return NextResponse.json(
          { error: "Bu slug ile zaten bir kategori mevcut" },
          { status: 400 }
        );
      }
    }

    // Eğer parentId varsa, geçerli olduğunu kontrol et
    if (validatedData.parentId) {
      // Kendini parent olarak seçemez
      if (validatedData.parentId === categoryId) {
        return NextResponse.json(
          { error: "Bir kategori kendisini üst kategori olarak seçemez" },
          { status: 400 }
        );
      }

      const parentCategory = await prisma.productCategory.findFirst({
        where: {
          id: validatedData.parentId,
          businessId,
        },
      });

      if (!parentCategory) {
        return NextResponse.json(
          { error: "Belirtilen üst kategori bulunamadı" },
          { status: 400 }
        );
      }
    }

    // Kategoriyi güncelle
    const updatedCategory = await prisma.productCategory.update({
      where: {
        id: categoryId,
      },
      data: validatedData,
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error("Kategori güncelleme hatası:", error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Geçersiz veri formatı", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Kategori güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// DELETE: Kategori sil
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
    const categoryId = searchParams.get('id');
    
    if (!categoryId) {
      return NextResponse.json(
        { error: "Kategori ID'si belirtilmedi" },
        { status: 400 }
      );
    }

    // Kategoriyi kontrol et
    const existingCategory = await prisma.productCategory.findFirst({
      where: {
        id: categoryId,
        businessId,
      },
      include: {
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Kategori bulunamadı" },
        { status: 404 }
      );
    }

    // Alt kategorisi olan bir kategori silinemez
    if (existingCategory._count.children > 0) {
      return NextResponse.json(
        { error: "Bu kategorinin alt kategorileri olduğu için silinemez. Önce alt kategorileri silin veya taşıyın." },
        { status: 400 }
      );
    }

    // Ürünü olan bir kategori silinemez (veya pasif edilebilir)
    if (existingCategory._count.products > 0) {
      return NextResponse.json(
        { error: "Bu kategoride ürünler olduğu için silinemez. Önce ürünleri taşıyın veya silin." },
        { status: 400 }
      );
    }

    // Kategoriyi sil
    await prisma.productCategory.delete({
      where: {
        id: categoryId,
      },
    });

    return NextResponse.json({ message: "Kategori başarıyla silindi" });
  } catch (error) {
    console.error("Kategori silme hatası:", error);
    return NextResponse.json(
      { error: "Kategori silinirken bir hata oluştu" },
      { status: 500 }
    );
  }
} 