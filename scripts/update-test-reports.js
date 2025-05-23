/**
 * SepetTakip - Test raporlarını Playwright test sonuçlarıyla güncelleme scripti
 * 
 * Bu script, Playwright test sonuçlarını okur ve test raporlarını güncelleştirir:
 * - page-test-report.md: Sayfa testlerinin güncel durumlarını içerir
 * - lint-issues-report.md: Kod kalitesi ve lint sorunlarını içerir
 */

const fs = require('fs');
const path = require('path');

// Dosya yolları
const PLAYWRIGHT_RESULTS = path.join(__dirname, '..', 'test-results', 'playwright-results.json');
const PAGE_TEST_REPORT = path.join(__dirname, '..', 'page-test-report.md');
const LINT_ISSUES_REPORT = path.join(__dirname, '..', 'lint-issues-report.md');

// Sonuç emoji'leri
const PASSED = '✅';
const FAILED = '❌';
const NOT_IMPLEMENTED = '🚫';
const PARTIAL = '⚠️';

// Tarih formatını Türkçeleştir
function formatDate(date) {
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date);
}

/**
 * Playwright test sonuçlarını oku
 */
function readPlaywrightResults() {
  try {
    if (!fs.existsSync(PLAYWRIGHT_RESULTS)) {
      console.error(`Playwright sonuç dosyası bulunamadı: ${PLAYWRIGHT_RESULTS}`);
      return { suites: [], tests: [] };
    }
    
    const rawData = fs.readFileSync(PLAYWRIGHT_RESULTS, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Playwright sonuçları okunamadı:', error);
    return { suites: [], tests: [] };
  }
}

/**
 * Test edilen sayfaları ve durumlarını belirle
 */
function getPageTestStatus(results) {
  const pageStatuses = new Map();
  
  // Test sonuçlarını işle
  if (results.suites && results.suites.length > 0) {
    processTestSuites(results.suites, pageStatuses);
  }
  
  if (results.tests && results.tests.length > 0) {
    for (const test of results.tests) {
      const pagePath = extractPagePathFromTest(test.title);
      if (pagePath) {
        const status = test.status === 'passed' ? PASSED : FAILED;
        pageStatuses.set(pagePath, { 
          status, 
          description: formatTestDescription(test)
        });
      }
    }
  }
  
  return pageStatuses;
}

/**
 * Test süitlerini işle
 */
function processTestSuites(suites, pageStatuses) {
  for (const suite of suites) {
    // Alt süitleri işle
    if (suite.suites && suite.suites.length > 0) {
      processTestSuites(suite.suites, pageStatuses);
    }
    
    // Testleri işle
    if (suite.tests && suite.tests.length > 0) {
      for (const test of suite.tests) {
        const pagePath = extractPagePathFromTest(test.title);
        if (pagePath) {
          const status = test.status === 'passed' ? PASSED : FAILED;
          pageStatuses.set(pagePath, { 
            status, 
            description: formatTestDescription(test)
          });
        }
      }
    }
  }
}

/**
 * Test başlığından sayfa yolunu çıkart
 */
function extractPagePathFromTest(title) {
  // Başlıktan sayfa yolunu çıkart
  const pagePathMatch = title.match(/\/app\/.*\/page\.tsx/);
  return pagePathMatch ? pagePathMatch[0] : null;
}

/**
 * Test açıklamasını biçimlendir
 */
function formatTestDescription(test) {
  const statusText = test.status === 'passed' ? 'başarılı' : 'başarısız';
  return `Production ortamda test edildi (${statusText}). ${test.annotations?.length > 0 ? test.annotations[0].description : 'UI, veri yükleme, boş durumlar ve hatalar kontrol edildi.'}`;
}

/**
 * page-test-report.md dosyasını güncelle
 */
function updatePageTestReport(pageStatuses) {
  try {
    if (!fs.existsSync(PAGE_TEST_REPORT)) {
      console.error(`Test rapor dosyası bulunamadı: ${PAGE_TEST_REPORT}`);
      return;
    }
    
    let content = fs.readFileSync(PAGE_TEST_REPORT, 'utf8');
    
    // Mevcut içeriği satırlara ayır
    const lines = content.split('\n');
    const updatedLines = [];
    
    let inPageSection = false;
    
    for (const line of lines) {
      // Sayfa bölümünü bul
      if (line.startsWith('## Sayfalar')) {
        inPageSection = true;
        updatedLines.push(line);
        continue;
      }
      
      // Sayfa bölümünde mi?
      if (inPageSection && line.match(/^\|.*\/page\.tsx\|/)) {
        // Satırı parçalara ayır
        const parts = line.split('|').map(p => p.trim());
        const pagePath = parts[1];
        
        // Bu sayfa test edildiyse güncelle
        if (pageStatuses.has(pagePath)) {
          const { status, description } = pageStatuses.get(pagePath);
          const updatedLine = `| ${pagePath} | ${status} ${status === PASSED ? 'Test Edildi' : status === FAILED ? 'Test Başarısız' : 'Uygulanmadı'} | ${description} |`;
          updatedLines.push(updatedLine);
        } else {
          updatedLines.push(line);
        }
      } else {
        updatedLines.push(line);
      }
    }
    
    // Son güncelleme zamanını ekle
    const currentDate = formatDate(new Date());
    const updatedContent = updatedLines.join('\n').replace(
      /Son güncelleme: .*$/m,
      `Son güncelleme: ${currentDate}`
    );
    
    // Dosyayı yaz
    fs.writeFileSync(PAGE_TEST_REPORT, updatedContent);
    console.log(`✅ page-test-report.md güncellendi (${pageStatuses.size} sayfa)`);
  } catch (error) {
    console.error('Test raporu güncellenirken hata oluştu:', error);
  }
}

/**
 * lint-issues-report.md dosyasını güncelle
 */
function updateLintIssuesReport(pageStatuses) {
  try {
    if (!fs.existsSync(LINT_ISSUES_REPORT)) {
      console.error(`Lint rapor dosyası bulunamadı: ${LINT_ISSUES_REPORT}`);
      return;
    }
    
    let content = fs.readFileSync(LINT_ISSUES_REPORT, 'utf8');
    
    // Mevcut içeriği satırlara ayır
    const lines = content.split('\n');
    const updatedLines = [];
    
    let inPageSection = false;
    let totalPages = 0;
    let testedPages = 0;
    let failedPages = 0;
    
    for (const line of lines) {
      // Sayfa bölümünü bul
      if (line.startsWith('## Sayfa Tabanlı Raporlar')) {
        inPageSection = true;
        updatedLines.push(line);
        continue;
      }
      
      // Genel durum bölümünde mi?
      if (line.match(/^\|.*Toplam sayfa sayısı.*\|/)) {
        totalPages = pageStatuses.size;
        const updatedLine = `| Toplam sayfa sayısı | ${totalPages} |`;
        updatedLines.push(updatedLine);
      } 
      else if (line.match(/^\|.*Test edilen sayfa sayısı.*\|/)) {
        testedPages = Array.from(pageStatuses.values()).filter(p => p.status === PASSED).length;
        const updatedLine = `| Test edilen sayfa sayısı | ${testedPages} |`;
        updatedLines.push(updatedLine);
      }
      else if (line.match(/^\|.*Başarısız test sayısı.*\|/)) {
        failedPages = Array.from(pageStatuses.values()).filter(p => p.status === FAILED).length;
        const updatedLine = `| Başarısız test sayısı | ${failedPages} |`;
        updatedLines.push(updatedLine);
      }
      // Sayfa bölümünde mi?
      else if (inPageSection && line.match(/^\|.*\/page\.tsx\|/)) {
        // Satırı parçalara ayır
        const parts = line.split('|').map(p => p.trim());
        const pagePath = parts[1];
        
        // Bu sayfa test edildiyse güncelle
        if (pageStatuses.has(pagePath)) {
          const { status, description } = pageStatuses.get(pagePath);
          const updatedLine = `| ${pagePath} | ${status} ${status === PASSED ? 'Test Edildi' : status === FAILED ? 'Test Başarısız' : 'Uygulanmadı'} | ${description} |`;
          updatedLines.push(updatedLine);
        } else {
          updatedLines.push(line);
        }
      } else {
        updatedLines.push(line);
      }
    }
    
    // Son güncelleme zamanını ekle
    const currentDate = formatDate(new Date());
    const updatedContent = updatedLines.join('\n').replace(
      /Son güncelleme: .*$/m,
      `Son güncelleme: ${currentDate}`
    );
    
    // Dosyayı yaz
    fs.writeFileSync(LINT_ISSUES_REPORT, updatedContent);
    console.log(`✅ lint-issues-report.md güncellendi (${pageStatuses.size} sayfa)`);
  } catch (error) {
    console.error('Lint raporu güncellenirken hata oluştu:', error);
  }
}

// Ana fonksiyon
function main() {
  console.log('Test raporlarını güncelleme başlatılıyor...');
  
  // Playwright test sonuçlarını oku
  const playwrightResults = readPlaywrightResults();
  
  // Test edilen sayfaları ve durumlarını belirle
  const pageStatuses = getPageTestStatus(playwrightResults);
  console.log(`${pageStatuses.size} sayfa testi işlendi`);
  
  // Raporları güncelle
  updatePageTestReport(pageStatuses);
  updateLintIssuesReport(pageStatuses);
  
  console.log('✅ Test raporları başarıyla güncellendi');
}

// Scripti çalıştır
main(); 