import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns"
import { tr } from "date-fns/locale"

/**
 * Combine multiple class names with clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Para birimini formatla
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(amount)
}

// Tarihi formatla
export function formatDate(dateString: string, formatString: string = "PPP"): string {
  try {
    const date = typeof dateString === "string" ? parseISO(dateString) : dateString
    return format(date, formatString, { locale: tr })
  } catch (error) {
    console.error("Tarih formatlanırken hata:", error)
    return "Geçersiz Tarih"
  }
}

// Boşlukları ve özel karakterleri temizle
export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
}

// Metni belirli bir uzunlukta kes
export function truncate(text: string, length: number): string {
  if (!text || text.length <= length) return text
  return text.slice(0, length) + "..."
}

// Rasgele bir ID oluştur
export function generateId(length: number = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// İki konum arasındaki mesafeyi hesapla (Haversine formülü)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Dünya yarıçapı (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c // Kilometre olarak mesafe
  return parseFloat(distance.toFixed(2))
}

// Sürüş süresini hesapla (ortalama hız 30 km/saat)
export function calculateDrivingTime(distanceKm: number): number {
  const averageSpeedKmPerHour = 30
  const timeInHours = distanceKm / averageSpeedKmPerHour
  const timeInMinutes = timeInHours * 60
  return Math.round(timeInMinutes)
}

// Dakikayı saat:dakika formatına dönüştür
export function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours > 0 ? `${hours} sa` : ""} ${mins} dk`
}

// URL'den sorgu parametrelerini al
export function getQueryParams(url: string): Record<string, string> {
  const params = new URLSearchParams(new URL(url).search)
  const result: Record<string, string> = {}
  
  params.forEach((value, key) => {
    result[key] = value
  })
  
  return result
}

// İki tarih arasındaki farkı hesapla (gün olarak)
export function daysBetween(startDate: Date, endDate: Date): number {
  const millisecondsPerDay = 1000 * 60 * 60 * 24
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // UTC tarihlerini kullan
  const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
  const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())
  
  return Math.floor((utcEnd - utcStart) / millisecondsPerDay)
}

// Güvenli JSON parse
export function safeJsonParse(str: string, fallback: any = {}): any {
  try {
    return JSON.parse(str)
  } catch (error) {
    console.error("JSON parse hatası:", error)
    return fallback
  }
}
