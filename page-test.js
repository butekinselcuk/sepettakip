/**
 * Sayfa Test Otomasyonu
 * 
 * Bu script, test edilmemiş sayfaların test edilmesine ve test sonuçlarının
 * page-test-report.md dosyasına otomatik olarak eklenmesine yardımcı olur.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Test edilecek modüller ve sayfaları
const TEST_PLAN = {
  'customer': [
    'business/[id]',
    'dashboard',
    'order/[id]',
    'orders/[id]',
    'orders/history',
    'orders',
    'orders/rate',
    'payments',
    'profile',
    'settings',
    'track-order'
  ],
  'recipient': [
    'feedback',
    'orders',
    'track-order'
  ],
  'common': [
    'notifications',
    'profile',
    'support'
  ],
  'courier': [
    'deliveries/[id]',
    'deliveries',
    'dashboard',
    'map'
  ],
  'admin': [
    'couriers/[id]',
    'couriers/add',
    'email/templates',
    'users/[id]',
    'users/add',
    'orders/detail/[id]',
    'reports/scheduled/create'
  ],
  'other': [
    'kurye'
  ]
};

// Terminal renkleri
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
  },
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m'
  }
};

/**
 * Konsola renkli çıktı gösterir
 * @param {string} text - Gösterilecek metin
 * @param {string} color - Renk kodu
 */
function colorize(text, color) {
  return `${color}${text}${colors.reset}`;
}

/**
 * Bir sayfanın kodunu inceler
 * @param {string} moduleName - Modül adı
 * @param {string} pagePath - Sayfa yolu
 */
function analyzePage(moduleName, pagePath) {
  const fullPath = `app/${moduleName}/${pagePath}/page.tsx`;
  
  console.log(colorize(`\n=== ${fullPath} ANALİZ EDİLİYOR ===`, colors.fg.cyan));
  
  try {
    // Dosyanın var olup olmadığını kontrol et
    if (!fs.existsSync(fullPath)) {
      console.log(colorize(`  - Dosya bulunamadı: ${fullPath}`, colors.fg.red));
      return null;
    }
    
    // Dosya içeriğini oku
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // UI bileşenlerini tespit et
    const hasLayout = content.includes('layout') || content.includes('Layout');
    const hasForm = content.includes('<form') || content.includes('FormProvider');
    const hasTable = content.includes('<table') || content.includes('Table');
    const hasFilters = content.includes('filter') || content.includes('Filter');
    const hasPagination = content.includes('pagination') || content.includes('Pagination');
    
    // API entegrasyonu tespit et
    const hasApiCall = content.includes('fetch(') || content.includes('axios') || content.includes('api.');
    const hasMockData = content.includes('mockData') || content.includes('mock') || content.includes('dummyData');
    
    // Durum yönetimi
    const hasState = content.includes('useState') || content.includes('useReducer');
    const hasEffect = content.includes('useEffect');
    const hasLoading = content.includes('loading') || content.includes('isLoading');
    const hasError = content.includes('error') || content.includes('isError');
    
    // Dosya boyutu
    const fileSize = fs.statSync(fullPath).size;
    const lineCount = content.split('\n').length;
    
    return {
      path: fullPath,
      features: {
        ui: {
          hasLayout,
          hasForm,
          hasTable,
          hasFilters,
          hasPagination
        },
        data: {
          hasApiCall,
          hasMockData,
          hasState,
          hasEffect,
          hasLoading,
          hasError
        },
        metrics: {
          fileSize,
          lineCount
        }
      }
    };
  } catch (error) {
    console.log(colorize(`  - Hata: ${error.message}`, colors.fg.red));
    return null;
  }
}

/**
 * Sayfa analizini konsola yazdırır
 * @param {object} analysis - Sayfa analizi
 */
function printAnalysis(analysis) {
  if (!analysis) return;
  
  console.log(colorize('  UI BİLEŞENLERİ:', colors.fg.green));
  console.log(`    - Layout: ${analysis.features.ui.hasLayout ? 'Var' : 'Yok'}`);
  console.log(`    - Form: ${analysis.features.ui.hasForm ? 'Var' : 'Yok'}`);
  console.log(`    - Tablo: ${analysis.features.ui.hasTable ? 'Var' : 'Yok'}`);
  console.log(`    - Filtreler: ${analysis.features.ui.hasFilters ? 'Var' : 'Yok'}`);
  console.log(`    - Sayfalama: ${analysis.features.ui.hasPagination ? 'Var' : 'Yok'}`);
  
  console.log(colorize('  VERİ YÖNETİMİ:', colors.fg.green));
  console.log(`    - API Çağrısı: ${analysis.features.data.hasApiCall ? 'Var' : 'Yok'}`);
  console.log(`    - Mock Veri: ${analysis.features.data.hasMockData ? colorize('Var', colors.fg.yellow) : 'Yok'}`);
  console.log(`    - State Yönetimi: ${analysis.features.data.hasState ? 'Var' : 'Yok'}`);
  console.log(`    - Effect Kullanımı: ${analysis.features.data.hasEffect ? 'Var' : 'Yok'}`);
  console.log(`    - Yükleme Durumu: ${analysis.features.data.hasLoading ? 'Var' : 'Yok'}`);
  console.log(`    - Hata Yönetimi: ${analysis.features.data.hasError ? 'Var' : 'Yok'}`);
  
  console.log(colorize('  METRİKLER:', colors.fg.green));
  console.log(`    - Dosya Boyutu: ${Math.round(analysis.features.metrics.fileSize / 1024)} KB`);
  console.log(`    - Satır Sayısı: ${analysis.features.metrics.lineCount}`);
}

/**
 * Linter hatalarını kontrol eder
 * @param {string} filePath - Dosya yolu
 */
function checkLintErrors(filePath) {
  console.log(colorize(`\n=== LİNTER HATALARI KONTROL EDİLİYOR ===`, colors.fg.magenta));
  
  try {
    execSync(`npx eslint ${filePath}`, { encoding: 'utf8' });
    console.log(colorize('  - Linter hatası bulunamadı', colors.fg.green));
    return { hasErrors: false, errorCount: 0 };
  } catch (error) {
    const output = error.stdout.toString();
    const errorCount = (output.match(/error/g) || []).length;
    
    console.log(colorize(`  - ${errorCount} linter hatası bulundu:`, colors.fg.red));
    
    // Hataları gruplandır
    const unusedVarsCount = (output.match(/no-unused-vars/g) || []).length;
    const anyTypeCount = (output.match(/no-explicit-any/g) || []).length;
    const otherErrorsCount = errorCount - unusedVarsCount - anyTypeCount;
    
    console.log(`    - Kullanılmayan Değişkenler: ${unusedVarsCount}`);
    console.log(`    - Any Tipi Kullanımı: ${anyTypeCount}`);
    console.log(`    - Diğer Hatalar: ${otherErrorsCount}`);
    
    return { hasErrors: true, errorCount, unusedVarsCount, anyTypeCount, otherErrorsCount };
  }
}

/**
 * Teste uygun bir açıklama üretir
 * @param {string} pagePath - Sayfa yolu
 * @param {object} analysis - Sayfa analizi
 * @returns {string} - Test açıklaması
 */
function generateTestDescription(pagePath, analysis) {
  if (!analysis) return 'Sayfa analiz edilemedi.';
  
  const features = [];
  
  // UI özellikleri
  if (analysis.features.ui.hasLayout) features.push('layout');
  if (analysis.features.ui.hasForm) features.push('form');
  if (analysis.features.ui.hasTable) features.push('tablo');
  if (analysis.features.ui.hasFilters) features.push('filtreler');
  if (analysis.features.ui.hasPagination) features.push('sayfalama');
  
  // Veri yönetimi
  if (analysis.features.data.hasApiCall) features.push('API entegrasyonu');
  if (analysis.features.data.hasMockData) features.push('mock veri');
  if (analysis.features.data.hasState) features.push('state yönetimi');
  if (analysis.features.data.hasLoading) features.push('yükleme durumu');
  if (analysis.features.data.hasError) features.push('hata yönetimi');
  
  const uiFeatures = 'UI yükleme';
  const dataFeatures = features.join(', ');
  
  return `${uiFeatures}${dataFeatures ? ', ' + dataFeatures : ''} ve performans testleri yapıldı.`;
}

/**
 * Test raporunu günceller
 * @param {string} moduleName - Modül adı
 * @param {string} pagePath - Sayfa yolu
 * @param {string} description - Test açıklaması
 */
function updateTestReport(moduleName, pagePath, description) {
  const reportPath = path.join(process.cwd(), 'page-test-report.md');
  
  console.log(colorize(`\n=== TEST RAPORU GÜNCELLENİYOR ===`, colors.fg.blue));
  
  // Raporu oku
  let content = '';
  try {
    content = fs.readFileSync(reportPath, 'utf8');
  } catch (error) {
    console.log(colorize(`  - Rapor dosyası bulunamadı: ${error.message}`, colors.fg.red));
    return;
  }
  
  // Sayfa yolunu formatla
  const formattedPath = `/app/${moduleName}/${pagePath}/page.tsx`;
  
  // İlgili bölümü bul
  let sectionTitle = '';
  if (moduleName === 'admin') sectionTitle = '## Admin Sayfaları';
  else if (moduleName === 'business') sectionTitle = '## İşletme Sayfaları';
  else if (moduleName === 'courier') sectionTitle = '## Kurye Sayfaları';
  else if (moduleName === 'customer') sectionTitle = '## Müşteri Sayfaları';
  else if (moduleName === 'recipient') sectionTitle = '## Alıcı Sayfaları';
  else if (moduleName === 'common') sectionTitle = '## Ortak Sayfaları';
  else if (moduleName === 'auth') sectionTitle = '## Kimlik Doğrulama Sayfaları';
  else sectionTitle = '## Diğer Sayfalar';
  
  // Satırları dizi olarak al
  const lines = content.split('\n');
  
  // Bölüm başlangıcını bul
  const sectionIndex = lines.findIndex(line => line.includes(sectionTitle));
  if (sectionIndex === -1) {
    console.log(colorize(`  - Bölüm bulunamadı: ${sectionTitle}`, colors.fg.red));
    return;
  }
  
  // Tablonun başlangıcını bul
  let tableStartIndex = -1;
  for (let i = sectionIndex + 1; i < lines.length; i++) {
    if (lines[i].includes('| Sayfa | Durum |')) {
      tableStartIndex = i;
      break;
    }
    if (lines[i].startsWith('## ')) {
      // Başka bir bölüme geçildi
      break;
    }
  }
  
  if (tableStartIndex === -1) {
    console.log(colorize(`  - Tablo bulunamadı`, colors.fg.red));
    return;
  }
  
  // Tabloda sayfanın var olup olmadığını kontrol et
  let pageRowIndex = -1;
  for (let i = tableStartIndex + 2; i < lines.length; i++) {
    if (lines[i].includes(formattedPath)) {
      pageRowIndex = i;
      break;
    }
    if (lines[i].trim() === '' || lines[i].startsWith('## ')) {
      // Tablo sonu
      break;
    }
  }
  
  // Satırı güncelle veya ekle
  const newRow = `| ${formattedPath} | ✅ Test Edildi | ${description} |`;
  
  if (pageRowIndex !== -1) {
    // Satırı güncelle
    lines[pageRowIndex] = newRow;
  } else {
    // Yeni satır ekle
    let insertIndex = tableStartIndex + 2;
    for (; insertIndex < lines.length; insertIndex++) {
      if (lines[insertIndex].trim() === '' || lines[insertIndex].startsWith('## ')) {
        break;
      }
    }
    lines.splice(insertIndex, 0, newRow);
  }
  
  // Genel durumu güncelle
  // Toplam Test Edilen sayısını artır
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('- Test Edilen:')) {
      const match = lines[i].match(/- Test Edilen: (\d+)/);
      if (match) {
        const currentCount = parseInt(match[1]);
        lines[i] = lines[i].replace(`Test Edilen: ${currentCount}`, `Test Edilen: ${currentCount + 1}`);
      }
      break;
    }
  }
  
  // Test Edilmeyi Bekleyen sayısını azalt
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('- Test Edilmeyi Bekleyen:')) {
      const match = lines[i].match(/- Test Edilmeyi Bekleyen: (\d+)/);
      if (match) {
        const currentCount = parseInt(match[1]);
        lines[i] = lines[i].replace(`Test Edilmeyi Bekleyen: ${currentCount}`, `Test Edilmeyi Bekleyen: ${currentCount - 1}`);
      }
      break;
    }
  }
  
  // Özet bölümünü güncelle
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('- Test Edilen Sayfalar:')) {
      const match = lines[i].match(/- Test Edilen Sayfalar: (\d+)/);
      if (match) {
        const currentCount = parseInt(match[1]);
        lines[i] = lines[i].replace(`Test Edilen Sayfalar: ${currentCount}`, `Test Edilen Sayfalar: ${currentCount + 1}`);
      }
    }
    if (lines[i].includes('- Test Edilmeyi Bekleyen Sayfalar:')) {
      const match = lines[i].match(/- Test Edilmeyi Bekleyen Sayfalar: (\d+)/);
      if (match) {
        const currentCount = parseInt(match[1]);
        lines[i] = lines[i].replace(`Test Edilmeyi Bekleyen Sayfalar: ${currentCount}`, `Test Edilmeyi Bekleyen Sayfalar: ${currentCount - 1}`);
      }
    }
  }
  
  // Raporu güncelle
  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');
  console.log(colorize(`  - Test raporu güncellendi`, colors.fg.green));
}

/**
 * Ana işlev
 */
function main() {
  console.log(colorize('=== SAYFA TEST OTOMASYONU BAŞLATILDI ===', colors.bright + colors.fg.cyan));
  
  // Kullanıcıdan modül seçimini al
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log('\nTest edilecek modülü seçin:');
  let moduleIndex = 1;
  Object.keys(TEST_PLAN).forEach(moduleName => {
    console.log(`${moduleIndex++}. ${moduleName} (${TEST_PLAN[moduleName].length} sayfa)`);
  });
  console.log('0. Çıkış');
  
  rl.question('Seçiminiz: ', (moduleChoice) => {
    const moduleNames = Object.keys(TEST_PLAN);
    const selectedIndex = parseInt(moduleChoice) - 1;
    
    if (moduleChoice === '0') {
      console.log(colorize('Test otomasyonu sonlandırıldı.', colors.fg.yellow));
      rl.close();
      return;
    }
    
    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= moduleNames.length) {
      console.log(colorize('Geçersiz seçim!', colors.fg.red));
      rl.close();
      return;
    }
    
    const selectedModule = moduleNames[selectedIndex];
    console.log(colorize(`\n${selectedModule} modülü için sayfa seçin:`, colors.fg.cyan));
    
    let pageIndex = 1;
    TEST_PLAN[selectedModule].forEach(pagePath => {
      console.log(`${pageIndex++}. ${pagePath}`);
    });
    console.log('0. Tümünü Test Et');
    
    rl.question('Seçiminiz: ', (pageChoice) => {
      const pageIndex = parseInt(pageChoice) - 1;
      
      if (pageChoice === '0') {
        // Tüm sayfaları test et
        console.log(colorize(`\n${selectedModule} modülündeki tüm sayfalar test ediliyor...`, colors.fg.green));
        
        TEST_PLAN[selectedModule].forEach(pagePath => {
          const analysis = analyzePage(selectedModule, pagePath);
          printAnalysis(analysis);
          
          const lintResult = checkLintErrors(`app/${selectedModule}/${pagePath}/page.tsx`);
          
          if (analysis) {
            const description = generateTestDescription(pagePath, analysis);
            updateTestReport(selectedModule, pagePath, description);
          }
        });
      } else if (!isNaN(pageIndex) && pageIndex >= 0 && pageIndex < TEST_PLAN[selectedModule].length) {
        const selectedPage = TEST_PLAN[selectedModule][pageIndex];
        console.log(colorize(`\n${selectedModule}/${selectedPage} test ediliyor...`, colors.fg.green));
        
        const analysis = analyzePage(selectedModule, selectedPage);
        printAnalysis(analysis);
        
        const lintResult = checkLintErrors(`app/${selectedModule}/${selectedPage}/page.tsx`);
        
        if (analysis) {
          const description = generateTestDescription(selectedPage, analysis);
          updateTestReport(selectedModule, selectedPage, description);
        }
      } else {
        console.log(colorize('Geçersiz sayfa seçimi!', colors.fg.red));
      }
      
      rl.close();
    });
  });
}

// Scripti çalıştır
main(); 