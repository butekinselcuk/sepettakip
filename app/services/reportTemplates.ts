import { ReportData } from './reportService';

export const reportTemplates = {
  dailyPerformance: (data: ReportData): ReportData => ({
    ...data,
    title: 'Günlük Performans Raporu',
    metrics: {
      ...data.metrics,
      // Günlük özel metrikler
      peakHour: 0, // En yoğun saat
      zoneCoverage: 0, // Bölge kapsama oranı
    },
  }),

  weeklyTrend: (data: ReportData): ReportData => ({
    ...data,
    title: 'Haftalık Trend Raporu',
    metrics: {
      ...data.metrics,
      // Haftalık özel metrikler
      weeklyGrowth: 0, // Haftalık büyüme
      weeklyRetention: 0, // Haftalık müşteri tutma oranı
    },
  }),

  monthlySummary: (data: ReportData): ReportData => ({
    ...data,
    title: 'Aylık Özet Rapor',
    metrics: {
      ...data.metrics,
      // Aylık özel metrikler
      monthlyRevenue: 0, // Aylık gelir
      monthlyExpenses: 0, // Aylık gider
      monthlyProfit: 0, // Aylık kar
    },
  }),

  zoneBased: (data: ReportData): ReportData => ({
    ...data,
    title: 'Bölge Bazlı Performans Raporu',
    metrics: {
      ...data.metrics,
      // Bölge bazlı özel metrikler
      zoneEfficiency: 0, // Bölge verimliliği
      zoneCoverage: 0, // Bölge kapsama oranı
    },
  }),

  courierPerformance: (data: ReportData): ReportData => ({
    ...data,
    title: 'Kurye Performans Raporu',
    metrics: {
      ...data.metrics,
      // Kurye bazlı özel metrikler
      courierEfficiency: 0, // Kurye verimliliği
      courierSatisfaction: 0, // Kurye memnuniyeti
    },
  }),
}; 