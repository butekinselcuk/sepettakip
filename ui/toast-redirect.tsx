"use client";

import React, { useEffect } from "react";
import { useToast } from "@/app/components/ui/use-toast";

/**
 * Toast kullanımının doğru çalışmadığı durumlarda kullanmak için bir yönlendirme bileşeni.
 * Bu modül, toast kullanım hatalarını çözmek için bir geçici çözüm olarak tasarlanmıştır.
 * 
 * Kullanımı:
 * import { redirectToast } from "@/components/ui/toast-redirect";
 * 
 * redirectToast({
 *   title: "Başlık",
 *   description: "Açıklama",
 *   variant: "default" | "destructive" | "success"
 * });
 */

export function redirectToast(props: {
  title?: string;
  description: string;
  variant?: "default" | "destructive" | "success";
}) {
  const { toast } = useToast();
  
  // Varsayılan değerler ata
  const title = props.title || "Bildirim";
  const variant = props.variant || "default";
  
  toast({
    title,
    description: props.description,
    variant
  });
  
  return null;
}

export default function ToastRedirect() {
  const { toast } = useToast();
  
  // Test amaçlı bir bildirim göster
  useEffect(() => {
    toast({
      title: "Toast Çalışıyor",
      description: "Toast bileşeni düzgün çalışıyor!",
      variant: "success"
    });
  }, [toast]);
  
  return null;
} 