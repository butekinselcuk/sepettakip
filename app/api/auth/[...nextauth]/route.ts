import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import type { User } from "next-auth";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Burada kimlik doğrulama işlemi yapılacak
        // Şimdilik basit bir kullanıcı döndürelim
        const user: User = { 
          id: "1", 
          name: "Test User", 
          email: "test@example.com",
          role: "user"
        };
        return user;
      }
    })
  ],
  session: {
    strategy: "jwt",
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 