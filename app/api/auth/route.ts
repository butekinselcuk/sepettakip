import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST /api/auth - Kullanıcı girişi
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, role } = body;

    // Giriş kontrolü
    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-posta ve şifre gereklidir' },
        { status: 400 }
      );
    }

    // Kullanıcı kontrolü
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Geçersiz kimlik bilgileri' },
        { status: 401 }
      );
    }

    // Rol kontrolü - isteğe bağlı bir özelliktir
    let userRole: Role;
    if (role === 'ADMIN' || role === 'BUSINESS' || role === 'COURIER' || role === 'CUSTOMER') {
      userRole = role as Role;
      // Eğer kullanıcı belirli bir rolle giriş yapmak istiyorsa, 
      // o role sahip olup olmadığını kontrol et
      if (user.role !== userRole) {
        return NextResponse.json(
          { error: 'Bu rol için yetkiniz bulunmamaktadır' },
          { status: 403 }
        );
      }
    }

    // Şifre kontrolü
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Geçersiz kimlik bilgileri' },
        { status: 401 }
      );
    }

    // JWT token oluştur
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        role: user.role,
        name: user.name
      }, 
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Kullanıcıyı döndür (şifre hariç)
    const { password: _, ...userData } = user;

    return NextResponse.json({
      message: 'Giriş başarılı',
      user: userData,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Giriş sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
} 