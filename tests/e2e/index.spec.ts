import { test, expect } from '@playwright/test';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Report path
const REPORT_PATH = 'app/page-manual-check/page-manual-check.md';

test.describe('End-to-End Test Suite', () => {
  test('Run E2E test suite and generate report', async () => {
    // Initialize report
    initializeReport();
    
    // Run tests in sequence
    await runTests();
  });
});

// Initialize the report file
function initializeReport() {
  try {
    // Create directory if it doesn't exist
    const dir = join(process.cwd(), 'app/page-manual-check');
    if (!existsSync(dir)){
      mkdirSync(dir, { recursive: true });
    }
    
    // Create or overwrite report file with header
    const path = join(process.cwd(), REPORT_PATH);
    const content = `# Sepet Takip Otomatik Test Raporu
_Tarih: ${new Date().toLocaleDateString('tr-TR')}_

Bu rapor, Sepet Takip uygulamasının otomatik end-to-end testlerinin sonuçlarını içermektedir. Testler Playwright test framework kullanılarak gerçekleştirilmiştir.

## Test Ortamı
- Node.js: ${process.version}
- Playwright: v1.52.0
- Test Browser: Chromium
- Test Başlangıç Zamanı: ${new Date().toLocaleTimeString('tr-TR')}

## Test Kapsamı
Bu test paketi şu senaryoları içermektedir:

1. **Admin kullanıcı testleri**: Login, dashboard erişimi, kullanıcı ekleme, logout
2. **Kurye kullanıcı testleri**: Login, teslimat görüntüleme, profil güncelleme
3. **İşletme kullanıcı testleri**: Login, ürün listeleme, sipariş yönetimi
4. **Müşteri kullanıcı testleri**: Login, sipariş verme, ödeme sayfasına gitme
5. **Auth sistem testleri**: Yanlış şifre kontrolü, yetkisiz erişim, token kontrolü

## Test Sonuçları

`;
    
    writeFileSync(path, content);
  } catch (error) {
    console.error('Error initializing report file:', error);
  }
}

// Run the individual test files in sequence
async function runTests() {
  const testFiles = [
    'auth-system.spec.ts',
    'admin.spec.ts',
    'courier.spec.ts', 
    'business.spec.ts',
    'customer.spec.ts'
  ];
  
  for (const file of testFiles) {
    console.log(`Running test file: ${file}`);
    
    try {
      // Run the test using the Playwright CLI
      const { stdout, stderr } = await execAsync(
        `npx playwright test tests/e2e/${file} --project=chromium`
      );
      
      // Log results
      console.log(`Test completed for ${file}`);
      if (stderr) {
        console.error(`Errors: ${stderr}`);
      }
    } catch (error) {
      console.error(`Failed to run tests for ${file}:`, error);
      
      // Add error to report
      appendToReport(`\n## ❌ Test Execution Error in ${file}\n`);
      appendToReport(`\`\`\`\n${error}\n\`\`\`\n`);
    }
  }
  
  // Add test completion info
  appendToReport(`\n## Test Özeti
- Test Bitiş Zamanı: ${new Date().toLocaleTimeString('tr-TR')}
- Toplam Test Dosyası: ${testFiles.length}

Test raporları detayları için HTML raporu inceleyiniz: \`playwright-report/index.html\`
`);
}

// Helper function to append to the report file
function appendToReport(content: string) {
  try {
    const path = join(process.cwd(), REPORT_PATH);
    writeFileSync(path, content, { flag: 'a' });
  } catch (error) {
    console.error('Error appending to report file:', error);
  }
} 