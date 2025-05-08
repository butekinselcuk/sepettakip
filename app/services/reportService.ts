import nodemailer from 'nodemailer';
import { PDFDocument, rgb } from '@react-pdf/renderer';
import * as XLSX from 'xlsx';

export interface ReportData {
  title: string;
  date: string;
  metrics: {
    totalDeliveries: number;
    activeCouriers: number;
    averageDeliveryTime: number;
    successRate: number;
  };
  zoneStats: {
    name: string;
    deliveries: number;
    successRate: number;
  }[];
  courierStats: {
    name: string;
    deliveries: number;
    performance: number;
  }[];
}

interface EmailConfig {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: {
    filename: string;
    content: Buffer;
  }[];
}

class ReportService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async generatePDFReport(data: ReportData): Promise<Buffer> {
    const doc = await PDFDocument.create();
    const page = doc.addPage();
    const { width, height } = page.getSize();

    // Add title
    page.drawText(data.title, {
      x: 50,
      y: height - 50,
      size: 20,
      color: rgb(0, 0, 0),
    });

    // Add date
    page.drawText(`Rapor Tarihi: ${data.date}`, {
      x: 50,
      y: height - 80,
      size: 12,
      color: rgb(0, 0, 0),
    });

    // Add metrics
    let y = height - 120;
    Object.entries(data.metrics).forEach(([key, value]) => {
      page.drawText(`${key}: ${value}`, {
        x: 50,
        y,
        size: 12,
        color: rgb(0, 0, 0),
      });
      y -= 20;
    });

    return Buffer.from(await doc.save());
  }

  async generateExcelReport(data: ReportData): Promise<Buffer> {
    const workbook = XLSX.utils.book_new();

    // Metrics sheet
    const metricsData = Object.entries(data.metrics).map(([key, value]) => ({
      Metric: key,
      Value: value,
    }));
    const metricsSheet = XLSX.utils.json_to_sheet(metricsData);
    XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Metrics');

    // Zone stats sheet
    const zoneSheet = XLSX.utils.json_to_sheet(data.zoneStats);
    XLSX.utils.book_append_sheet(workbook, zoneSheet, 'Zone Stats');

    // Courier stats sheet
    const courierSheet = XLSX.utils.json_to_sheet(data.courierStats);
    XLSX.utils.book_append_sheet(workbook, courierSheet, 'Courier Stats');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async sendEmail(config: EmailConfig): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: Array.isArray(config.to) ? config.to.join(',') : config.to,
      subject: config.subject,
      html: config.html,
      attachments: config.attachments,
    });
  }

  async generateAndSendReport(data: ReportData, recipients: string[]): Promise<void> {
    const [pdfBuffer, excelBuffer] = await Promise.all([
      this.generatePDFReport(data),
      this.generateExcelReport(data),
    ]);

    const html = `
      <h1>${data.title}</h1>
      <p>Rapor Tarihi: ${data.date}</p>
      <h2>Özet Metrikler</h2>
      <ul>
        ${Object.entries(data.metrics)
          .map(([key, value]) => `<li>${key}: ${value}</li>`)
          .join('')}
      </ul>
    `;

    await this.sendEmail({
      to: recipients,
      subject: `${data.title} - ${data.date}`,
      html,
      attachments: [
        {
          filename: 'report.pdf',
          content: pdfBuffer,
        },
        {
          filename: 'report.xlsx',
          content: excelBuffer,
        },
      ],
    });
  }
}

export const reportService = new ReportService(); 