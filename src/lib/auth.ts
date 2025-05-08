import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 gün
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/login',
    error: '/auth/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        role: { label: 'Role', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.role) {
          return null;
        }

        // Gerçek uygulamada API/veritabanı kontrolleri yapılacak
        // Demo için sabit kullanıcılar
        const demoUsers = {
          admin: { 
            id: '1', 
            email: 'admin@sepettakip.com', 
            password: 'admin123', 
            name: 'Admin', 
            role: 'admin' 
          },
          business: { 
            id: '2', 
            email: 'business@sepettakip.com', 
            password: 'business123', 
            name: 'İşletme', 
            role: 'business' 
          },
          courier: { 
            id: '3', 
            email: 'courier@sepettakip.com', 
            password: 'courier123', 
            name: 'Kurye', 
            role: 'courier' 
          },
          customer: { 
            id: '4', 
            email: 'customer@sepettakip.com', 
            password: 'customer123', 
            name: 'Müşteri', 
            role: 'customer' 
          }
        };

        const user = demoUsers[credentials.role as keyof typeof demoUsers];
        
        if (user && user.email === credentials.email && user.password === credentials.password) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

// Auth.js için tipleri genişlet
declare module 'next-auth' {
  interface User {
    id: string;
    role: string;
  }
  
  interface Session {
    user: {
      id: string;
      role: string;
      email: string;
      name?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    id: string;
  }
} 