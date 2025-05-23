/**
 * Lint Hata Düzeltme Script'i
 * 
 * Bu script, projedeki yaygın linter hatalarını tespit edip düzeltmeye yardımcı olur.
 * Özellikle kullanılmayan değişkenler ve any tipleri üzerinde çalışır.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ana modüller
const MODULES = ['admin', 'business', 'courier', 'customer', 'recipient', 'common', 'auth'];

// Hata istatistikleri
let stats = {
  totalFiles: 0,
  filesWithUnusedVars: 0,
  filesWithAnyType: 0,
  totalUnusedVars: 0,
  totalAnyTypes: 0,
  fixedUnusedVars: 0,
  fixedAnyTypes: 0
};

/**
 * Belirli bir modül için linter hatalarını tespit eder
 * @param {string} moduleName - Modül adı (örn: 'admin', 'business')
 * @returns {object} - Tespit edilen hatalar
 */
function detectLintErrors(moduleName) {
  console.log(`\n=== ${moduleName.toUpperCase()} MODÜLÜ ANALİZ EDİLİYOR ===`);
  
  try {
    // ESLint çalıştırarak hataları tespit et
    const lintOutput = execSync(`npx eslint app/${moduleName} --ext .ts,.tsx`, { encoding: 'utf8' });
    
    // Kullanılmayan değişkenleri say
    const unusedVarsMatches = [...lintOutput.matchAll(/@typescript-eslint\/no-unused-vars/g)];
    const anyTypeMatches = [...lintOutput.matchAll(/@typescript-eslint\/no-explicit-any/g)];
    
    const unusedVarsCount = unusedVarsMatches.length;
    const anyTypeCount = anyTypeMatches.length;
    
    // İstatistikleri güncelle
    stats.totalFiles += 1;
    stats.totalUnusedVars += unusedVarsCount;
    stats.totalAnyTypes += anyTypeCount;
    
    if (unusedVarsCount > 0) stats.filesWithUnusedVars += 1;
    if (anyTypeCount > 0) stats.filesWithAnyType += 1;
    
    // Sonuçları yazdır
    console.log(`  - ${unusedVarsCount} kullanılmayan değişken bulundu`);
    console.log(`  - ${anyTypeCount} any tipi bulundu`);
    
    return {
      unusedVars: unusedVarsCount,
      anyTypes: anyTypeCount
    };
  } catch (error) {
    // Hata durumunda, çıktıyı incele ve hatalar hakkında bilgi topla
    const output = error.stdout.toString();
    
    // Kullanılmayan değişkenleri say
    const unusedVarsMatches = [...output.matchAll(/@typescript-eslint\/no-unused-vars/g)];
    const anyTypeMatches = [...output.matchAll(/@typescript-eslint\/no-explicit-any/g)];
    
    const unusedVarsCount = unusedVarsMatches.length;
    const anyTypeCount = anyTypeMatches.length;
    
    // İstatistikleri güncelle
    stats.totalFiles += 1;
    stats.totalUnusedVars += unusedVarsCount;
    stats.totalAnyTypes += anyTypeCount;
    
    if (unusedVarsCount > 0) stats.filesWithUnusedVars += 1;
    if (anyTypeCount > 0) stats.filesWithAnyType += 1;
    
    // Sonuçları yazdır
    console.log(`  - ${unusedVarsCount} kullanılmayan değişken bulundu`);
    console.log(`  - ${anyTypeCount} any tipi bulundu`);
    
    return {
      unusedVars: unusedVarsCount,
      anyTypes: anyTypeCount
    };
  }
}

/**
 * Kullanılmayan değişkenleri otomatik olarak temizlemeye çalışır
 * @param {string} moduleName - Modül adı
 */
function fixUnusedVars(moduleName) {
  console.log(`\n=== ${moduleName.toUpperCase()} MODÜLÜ - KULLANILMAYAN DEĞİŞKENLER DÜZELTİLİYOR ===`);
  
  try {
    // ESLint'in --fix parametresi ile otomatik düzeltme
    execSync(`npx eslint app/${moduleName} --ext .ts,.tsx --fix --rule "@typescript-eslint/no-unused-vars: error"`, { encoding: 'utf8' });
    console.log(`  - Kullanılmayan değişkenler düzeltildi`);
    stats.fixedUnusedVars += 1;
  } catch (error) {
    console.log(`  - Düzeltme sırasında hatalar oluştu, manuel müdahale gerekebilir`);
    console.log(`  - Hata detayları: ${error.message}`);
  }
}

/**
 * Any tiplerini bulur ve dosya konumlarını listeler
 * @param {string} moduleName - Modül adı
 */
function findAnyTypes(moduleName) {
  console.log(`\n=== ${moduleName.toUpperCase()} MODÜLÜ - ANY TİPLERİ BULUNUYOR ===`);
  
  try {
    // grep benzeri arama ile any tiplerini bul
    const result = execSync(`npx eslint app/${moduleName} --ext .ts,.tsx --rule "@typescript-eslint/no-explicit-any: error" -f json`, { encoding: 'utf8' });
    const jsonResult = JSON.parse(result);
    
    // Her dosya için any tiplerinin konumlarını listele
    jsonResult.forEach(file => {
      if (file.messages.length > 0) {
        console.log(`  - ${file.filePath}:`);
        file.messages.forEach(msg => {
          if (msg.ruleId === '@typescript-eslint/no-explicit-any') {
            console.log(`    - Satır ${msg.line}, Sütun ${msg.column}: ${msg.message}`);
          }
        });
      }
    });
  } catch (error) {
    try {
      // Hata durumunda, çıktıyı JSON olarak ayrıştırmaya çalış
      const output = error.stdout.toString();
      const jsonResult = JSON.parse(output);
      
      // Her dosya için any tiplerinin konumlarını listele
      jsonResult.forEach(file => {
        if (file.messages.length > 0) {
          console.log(`  - ${file.filePath}:`);
          file.messages.forEach(msg => {
            if (msg.ruleId === '@typescript-eslint/no-explicit-any') {
              console.log(`    - Satır ${msg.line}, Sütun ${msg.column}: ${msg.message}`);
            }
          });
        }
      });
    } catch (jsonError) {
      console.log(`  - Any tiplerini bulurken hata oluştu: ${error.message}`);
    }
  }
}

/**
 * Lint sonuçlarını rapor dosyasına ekler
 */
function updateLintReport() {
  console.log('\n=== RAPOR GÜNCELLENİYOR ===');
  
  const reportPath = path.join(process.cwd(), 'lint-issues-report.md');
  
  // Rapor içeriğini oku
  let reportContent = '';
  try {
    reportContent = fs.readFileSync(reportPath, 'utf8');
  } catch (error) {
    console.log('  - Rapor dosyası bulunamadı, yeni oluşturulacak');
  }
  
  // Tamamlanan İyileştirmeler bölümünü güncelle
  const completedSection = `## Tamamlanan İyileştirmeler
- Taranan Modüller: ${MODULES.length}
- Toplam Taranan Dosya: ${stats.totalFiles}
- Kullanılmayan Değişken İçeren Dosya: ${stats.filesWithUnusedVars}
- Any Tipi İçeren Dosya: ${stats.filesWithAnyType}
- Tespit Edilen Kullanılmayan Değişken: ${stats.totalUnusedVars}
- Tespit Edilen Any Tipi: ${stats.totalAnyTypes}
- Düzeltilen Dosya: ${stats.fixedUnusedVars}`;

  // Rapor içeriğini güncelle
  if (reportContent.includes('## Tamamlanan İyileştirmeler')) {
    reportContent = reportContent.replace(/## Tamamlanan İyileştirmeler[\s\S]*$/, completedSection);
  } else {
    reportContent += '\n\n' + completedSection;
  }
  
  // Rapor dosyasını güncelle
  fs.writeFileSync(reportPath, reportContent, 'utf8');
  console.log('  - Lint raporu güncellendi');
}

/**
 * Ana işlev
 */
function main() {
  console.log('=== LINT HATA DÜZELTME SCRIPTİ BAŞLATILDI ===');
  
  // Her modül için lint hatalarını tespit et
  MODULES.forEach(moduleName => {
    detectLintErrors(moduleName);
  });
  
  // İstenirse, kullanılmayan değişkenleri düzelt
  const fixPrompt = process.argv.includes('--fix');
  if (fixPrompt) {
    MODULES.forEach(moduleName => {
      fixUnusedVars(moduleName);
    });
  }
  
  // Any tiplerini bul
  MODULES.forEach(moduleName => {
    findAnyTypes(moduleName);
  });
  
  // Lint raporunu güncelle
  updateLintReport();
  
  console.log('\n=== ÖZET ===');
  console.log(`Toplam Taranan Dosya: ${stats.totalFiles}`);
  console.log(`Kullanılmayan Değişken İçeren Dosya: ${stats.filesWithUnusedVars}`);
  console.log(`Any Tipi İçeren Dosya: ${stats.filesWithAnyType}`);
  console.log(`Tespit Edilen Kullanılmayan Değişken: ${stats.totalUnusedVars}`);
  console.log(`Tespit Edilen Any Tipi: ${stats.totalAnyTypes}`);
  
  if (fixPrompt) {
    console.log(`Düzeltilen Dosya: ${stats.fixedUnusedVars}`);
  }
  
  console.log('\n=== KULLANIM ===');
  console.log('- Sadece analiz: node lint-fix.js');
  console.log('- Analiz ve düzeltme: node lint-fix.js --fix');
}

// Scripti çalıştır
main(); 