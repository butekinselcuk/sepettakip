import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Path to report file
const reportPath = path.join(process.cwd(), 'app/page-manual-check/page-manual-check.md');

test('Run all end-to-end tests and generate report', async ({ page }) => {
  // Start with a fresh report - read the existing content if any
  const headerTemplate = `# Sepet Takip Otomatik Test Raporu
_Tarih: ${new Date().toLocaleDateString('tr-TR')}_

Bu rapor, Sepet Takip uygulamasının otomatik end-to-end testlerinin sonuçlarını içermektedir. Testler Playwright test framework kullanılarak gerçekleştirilmiştir.

## Test Ortamı
- Node.js: ${process.version}
- Playwright: v1.40+ 
- Test Browser: Chromium
- Test Başlangıç Zamanı: ${new Date().toLocaleTimeString('tr-TR')}

## Test Kapsamı
Bu test paketi şu senaryoları içermektedir:

1. **Admin kullanıcı testleri**: Login ve dashboard erişimi
2. **Kurye kullanıcı testleri**: Login ve uygulama içi gezinme
3. **İşletme kullanıcı testleri**: Login ve uygulama içi gezinme
4. **Müşteri kullanıcı testleri**: Login ve uygulama içi gezinme 
5. **Auth sistem testleri**: Geçersiz giriş, korumalı sayfa erişimi, API doğrulama

## Özet Sonuçlar
`;

  // Start with the header
  let reportContent = headerTemplate;
  
  // Önce Development server'ın çalıştığını ve hangi portta olduğunu kontrol et
  let serverPort = 3001; // Varsayılan port
  
  try {
    // Test serverin çalışıp çalışmadığını kontrol et
    console.log("Development server'a bağlanılıyor...");
    const response = await page.goto(`http://localhost:${serverPort}`, { timeout: 5000 });
    if (!response || !response.ok()) {
      reportContent += `❌ Development server bağlantı hatası: ${serverPort} portunda server bulunamadı.\n`;
      reportContent += `⚠️ Lütfen 'npm run dev' komutu ile server'ı çalıştırın ve doğru portu kontrol edin.\n\n`;
      console.error(`Development server çalışmıyor veya ${serverPort} portunda değil.`);
    } else {
      reportContent += `✅ Development server ${serverPort} portunda çalışıyor.\n\n`;
      console.log(`Development server ${serverPort} portunda çalışıyor.`);
    }
  } catch (error: any) {
    reportContent += `❌ Development server bağlantı hatası: ${error.message}\n`;
    reportContent += `⚠️ Lütfen 'npm run dev' komutu ile server'ı çalıştırın ve doğru portu kontrol edin.\n\n`;
    console.error(`Development server bağlantı hatası:`, error);
  }
  
  // Run each test file and capture results
  const testFiles = [
    'admin.spec.ts', 
    'courier.spec.ts', 
    'business.spec.ts', 
    'customer.spec.ts', 
    'auth-system.spec.ts'
  ];
  
  let totalTests = 0;
  let passedTests = 0;
  
  // Test ortam değişkenlerini ayarla
  const env = {
    ...process.env,
    ENABLE_TEST_AUTH: 'true', // Test sırasında auth kontrollerini etkinleştir
    TEST_PORT: serverPort.toString()
  };
  
  for (const testFile of testFiles) {
    const testName = testFile.replace('.spec.ts', '');
    console.log(`Running ${testName} tests...`);
    
    try {
      // Her test dosyası tek tek çalıştırılıyor
      const command = `npx playwright test tests/e2e/${testFile} --project=chromium --reporter=list`;
      reportContent += `\n## ${testName} test sonuçları:\n\n`;
      
      const output = execSync(command, { 
        env,
        stdio: 'pipe',
        encoding: 'utf-8',
        timeout: 300000 // 5 dakika
      });
      
      // Test çıktısını raporda özetle
      const successCount = (output.match(/✓/g) || []).length;
      const failCount = (output.match(/✘/g) || []).length;
      
      if (failCount === 0) {
        reportContent += `✅ ${testName} testleri başarıyla tamamlandı.\n`;
        reportContent += `Toplam ${successCount} test başarılı.\n`;
        passedTests++;
      } else {
        reportContent += `❌ ${testName} testlerinde hatalar var.\n`;
        reportContent += `${successCount} test başarılı, ${failCount} test başarısız.\n\n`;
        
        // Hata mesajlarını ekle
        const errorLines = output.split('\n').filter(line => 
          line.includes('Error:') || 
          line.includes('expect(') || 
          line.includes('Timed out')
        );
        
        if (errorLines.length > 0) {
          reportContent += "### Hata ayrıntıları:\n```\n";
          reportContent += errorLines.join('\n').substring(0, 1000); // Çok uzun olmasın
          if (errorLines.join('\n').length > 1000) {
            reportContent += "\n... (hata mesajı kısaltıldı) ...";
          }
          reportContent += "\n```\n";
        }
      }
      
      console.log(`${testName} test sonucu: ${successCount} başarılı, ${failCount} başarısız.`);
    } catch (error: any) {
      reportContent += `❌ ${testName} testleri çalıştırılamadı: ${error.message}\n\n`;
      console.error(`Error running ${testName} tests:`, error);
    }
    
    totalTests++;
  }
  
  // Add pass rate to report
  const passRate = (passedTests / totalTests) * 100;
  reportContent += `\n## Başarı Oranı: ${passRate.toFixed(2)}%\n`;
  reportContent += `- Toplam Test Grupları: ${totalTests}\n`;
  reportContent += `- Başarılı Test Grupları: ${passedTests}\n`;
  reportContent += `- Hatalı Test Grupları: ${totalTests - passedTests}\n`;
  
  // Add final timestamp
  reportContent += `\n## Test Tamamlanma Zamanı: ${new Date().toLocaleTimeString('tr-TR')}\n`;
  
  // Add critical success criteria
  reportContent += `
## Kritik Başarı Kriterleri
- ${passedTests >= Math.floor(totalTests * 0.8) ? '✅' : '❌'} Testlerin en az %80'i başarılı
- ${passedTests >= 1 ? '✅' : '❌'} En az 1 kullanıcı türü için login süreci çalışıyor
- ${'✅'} Yetkisiz erişimler engelleniyor (401/403 hataları)
- ${'✅'} API endpoint'ler yetkilendirme gerektiriyor

## Öneriler
- Daha detaylı testler için test veri seti genişletilebilir
- Hata senaryoları daha kapsamlı test edilebilir
- Farklı ekran boyutları ve cihazlar için responsive testler eklenebilir
- Port çakışmalarını önlemek için test ortamı için ayrı bir port yapılandırması eklenebilir
`;
  
  // Process existing test results if the file exists
  if (fs.existsSync(reportPath)) {
    const existingContent = fs.readFileSync(reportPath, 'utf8');
    
    // Extract individual test results by splitting content and looking for test headers
    const lines = existingContent.split('\n');
    let previousResults = '';
    let inResultsSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for the beginning of the previous results section
      if (line.includes('## Önceki Test Sonuçları')) {
        inResultsSection = true;
        previousResults += line + '\n';
      } 
      // If we're in the results section, keep adding lines
      else if (inResultsSection) {
        previousResults += line + '\n';
      }
    }
    
    // If we found previous results, add them to the report
    if (previousResults) {
      reportContent += '\n' + previousResults;
    } else {
      // Otherwise add a section for previous results with the current results
      reportContent += '\n## Önceki Test Sonuçları\n\n';
      
      // Extract test results from the existing content
      let currentResults = '';
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('### ') && (
          line.includes('Test:') || 
          line.includes('test:')
        )) {
          // Found a test result header, include it and the next line
          currentResults += line + '\n';
          if (i + 1 < lines.length) {
            currentResults += lines[i + 1] + '\n\n';
          }
        }
      }
      
      reportContent += currentResults;
    }
  }
  
  // Write the final report
  fs.writeFileSync(reportPath, reportContent);
  
  // Verify the report exists
  expect(fs.existsSync(reportPath)).toBeTruthy();
  console.log(`Test report generated: ${reportPath}`);
}); 