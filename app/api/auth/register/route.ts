import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcrypt';
import { signJwtToken } from '@/lib/auth';

// POST /api/auth/register - Kullanıcı kaydı
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role } = body;

    console.log("Register attempt:", { email, role });

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json({ 
        message: 'Ad, e-posta ve şifre alanları gereklidir' 
      }, { status: 400 });
    }

    // Validate role
    const validRoles = ['ADMIN', 'BUSINESS', 'COURIER', 'CUSTOMER'];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ 
        message: 'Geçersiz kullanıcı rolü' 
      }, { status: 400 });
    }

    try {
      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return NextResponse.json({ 
          message: 'Bu e-posta adresi zaten kullanılıyor' 
        }, { status: 409 });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user based on role
      const userData = {
        name,
        email,
        password: hashedPassword,
        role: role || 'CUSTOMER'
      };

      // Create user with the appropriate role relation
      const user = await prisma.user.create({
        data: {
          ...userData,
          ...(role === 'ADMIN' ? {
            admin: {
              create: {
                department: 'General',
                level: 1
              }
            }
          } : {}),
          ...(role === 'BUSINESS' ? {
            business: {
              create: {
                name: name,
                status: 'ACTIVE'
              }
            }
          } : {}),
          ...(role === 'COURIER' ? {
            courier: {
              create: {
                status: 'ACTIVE'
              }
            }
          } : {}),
          ...(role === 'CUSTOMER' ? {
            customer: {
              create: {}
            }
          } : {})
        }
      });

      // Generate JWT token
      const { password: _, ...userWithoutPassword } = user;
      const token = signJwtToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      console.log("Registration successful:", email);
      
      return NextResponse.json({
        message: 'Kullanıcı başarıyla oluşturuldu',
        user: userWithoutPassword,
        token
      });
    } catch (dbError: any) {
      console.error("Database error during registration:", dbError);
      
      // Provide more detailed error message based on the database error
      if (dbError.code === 'P2002') {
        return NextResponse.json({ 
          message: 'Bu e-posta adresi zaten kullanılıyor'
        }, { status: 409 });
      }
      
      return NextResponse.json({ 
        message: 'Veritabanı işlemi sırasında bir hata oluştu',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json({ 
      message: 'Kayıt sırasında bir hata oluştu',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
} 