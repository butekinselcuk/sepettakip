const fs = require('fs');
const path = require('path');

const REPORT_FILE = path.join(__dirname, 'app', 'page-manual-check', 'page-manual-check.md');

// Check if the file exists
if (!fs.existsSync(REPORT_FILE)) {
  console.error(`Report file not found at ${REPORT_FILE}`);
  process.exit(1);
}

// Read the file content
const content = fs.readFileSync(REPORT_FILE, 'utf8');

// Count test statuses
const successCount = (content.match(/✅ Başarılı/g) || []).length;
const partialCount = (content.match(/⚠️ Kısmen Başarılı/g) || []).length;
const failedCount = (content.match(/❌ Başarısız/g) || []).length;
const notTestedCount = (content.match(/📝 Test Edilmedi/g) || []).length;
const totalPages = successCount + partialCount + failedCount + notTestedCount;

console.log('Test Progress:');
console.log(`- ✅ Başarılı: ${successCount}`);
console.log(`- ⚠️ Kısmen Başarılı: ${partialCount}`);
console.log(`- ❌ Başarısız: ${failedCount}`);
console.log(`- 📝 Test Edilmedi: ${notTestedCount}`);
console.log(`- Total Pages Tested: ${successCount + partialCount + failedCount}/${totalPages}`);

// Look for sections that have been updated
console.log('\nChecking section updates:');

const sections = [
  { name: 'Admin Sayfaları', pattern: '## 9. Admin Sayfaları Test Sonuçları' },
  { name: 'İşletme Sayfaları', pattern: '## 10. İşletme Sayfaları Test Sonuçları' },
  { name: 'Kurye Sayfaları', pattern: '## 11. Kurye Sayfaları Test Sonuçları' },
  { name: 'Müşteri Sayfaları', pattern: '## 12. Müşteri Sayfaları Test Sonuçları' },
  { name: 'Genel Sayfalar', pattern: '## 1. Genel Sayfalar' }
];

for (const section of sections) {
  if (content.includes(section.pattern)) {
    console.log(`- ${section.name}: Updated`);
  } else {
    console.log(`- ${section.name}: Not updated yet`);
  }
} 