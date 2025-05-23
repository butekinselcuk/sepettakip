"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { sign } from "@/lib/auth";
import { compare } from "bcryptjs";
import { redirect } from "next/navigation";

interface LoginResult {
  success: boolean;
  error?: string;
  redirectUrl?: string;
}

export async function loginAction(formData: FormData): Promise<LoginResult> {
  try {
    const email = formData.get("email")?.toString() || "";
    const password = formData.get("password")?.toString() || "";
    
    console.log(`🔒 Login action attempt: ${email}`);
    
    if (!email || !password) {
      return { success: false, error: "Email ve şifre gereklidir" };
    }
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        admin: true,
        business: true,
        courier: true,
        customer: true
      }
    });
    
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return { success: false, error: "Geçersiz email veya şifre" };
    }
    
    // Verify password
    const passwordValid = await compare(password, user.password);
    
    // Test user support
    const testUsers = {
      'admin1@example.com': 'Test123',
      'business1@example.com': 'Test123',
      'courier1@example.com': 'Test123',
      'customer1@example.com': 'Test123'
    };
    
    const isTestUser = email in testUsers && password === testUsers[email as keyof typeof testUsers];
    
    if (!passwordValid && !isTestUser) {
      console.log(`❌ Invalid password for: ${email}`);
      return { success: false, error: "Geçersiz email veya şifre" };
    }
    
    // Generate token
    const token = await sign({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role.toUpperCase()
    });
    
    // Determine redirect URL
    let redirectUrl = '/dashboard';
    if (user.role === 'ADMIN') {
      redirectUrl = '/admin/dashboard';
    } else if (user.role === 'BUSINESS') {
      redirectUrl = '/business/dashboard';
    } else if (user.role === 'COURIER') {
      redirectUrl = '/courier/dashboard';
    } else if (user.role === 'CUSTOMER') {
      redirectUrl = '/customer/dashboard';
    }
    
    // Set cookies using the cookies API
    const cookieStore = cookies();
    
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
      sameSite: 'strict'
    });
    
    // Set non-httpOnly user data for client storage
    cookieStore.set('user-data', JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
      sameSite: 'strict'
    });
    
    console.log(`✅ Login successful for ${email}, redirecting to ${redirectUrl}`);
    
    // Return success
    return { 
      success: true,
      redirectUrl 
    };
  } catch (error) {
    console.error('💥 Login action error:', error);
    return { 
      success: false, 
      error: 'Giriş sırasında bir hata oluştu, lütfen tekrar deneyin' 
    };
  }
} 