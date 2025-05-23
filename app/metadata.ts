// Shared metadata definitions for Next.js
import { Metadata } from "next";

export const DEFAULT_METADATA: Metadata = {
  title: {
    default: "Sepet Takip - Kurye Teslimat Sistemi",
    template: "%s | Sepet Takip"
  },
  description: "Sipariş ve kurye teslimat takip sistemi",
  keywords: ["teslimat", "kurye", "sipariş", "takip", "sepet"],
  authors: [{ name: "Sepet Takip Team" }],
  icons: {
    icon: "/favicon.ico",
  }
};

export const AUTH_METADATA: Metadata = {
  title: "Giriş Yap | Sepet Takip",
  description: "Sepet Takip uygulamasına giriş yapın"
};

export const ADMIN_METADATA: Metadata = {
  title: "Admin Paneli | Sepet Takip",
  description: "Sepet Takip admin yönetim paneli"
};

export const BUSINESS_METADATA: Metadata = {
  title: "İşletme Paneli | Sepet Takip",
  description: "İşletme siparişlerinizi ve ürünlerinizi yönetin"
};

export const COURIER_METADATA: Metadata = {
  title: "Kurye Paneli | Sepet Takip",
  description: "Teslimatlarınızı takip edin ve yönetin"
};

export const CUSTOMER_METADATA: Metadata = {
  title: "Müşteri Paneli | Sepet Takip",
  description: "Siparişlerinizi takip edin ve yönetin"
}; 