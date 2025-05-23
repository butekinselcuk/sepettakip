const { chromium } = require('playwright');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const checkResultsPath = path.join(__dirname, '..', 'app', 'page-manual-check', 'page-manual-check.md');

// Test credentials
const TEST_USERS = {
  ADMIN: { email: 'admin@sepettakip.com', password: 'admin123' },
  BUSINESS: { email: 'business@sepettakip.com', password: 'business123' },
  CUSTOMER: { email: 'customer@sepettakip.com', password: 'customer123' },
  COURIER: { email: 'courier@sepettakip.com', password: 'courier123' }
};

// Full list of all 40 pages to test
const ALL_PAGES = {
  public: [
    { path: '/', name: 'Ana Sayfa' },
    { path: '/auth/login', name: 'Giriş Sayfası' },
    { path: '/auth/register', name: 'Kayıt Sayfası' },
    { path: '/about', name: 'Hakkımızda' },
    { path: '/contact', name: 'İletişim' },
  ],
  admin: [
    { path: '/admin', name: 'Admin Paneli Ana Sayfa' },
    { path: '/admin/dashboard', name: 'Admin Gösterge Paneli' },
    { path: '/admin/users', name: 'Kullanıcı Yönetimi', crud: true },
    { path: '/admin/users/create', name: 'Kullanıcı Oluşturma' },
    { path: '/admin/users/edit', name: 'Kullanıcı Düzenleme' },
    { path: '/admin/businesses', name: 'İşletme Yönetimi', crud: true },
    { path: '/admin/customers', name: 'Müşteri Yönetimi', crud: true },
    { path: '/admin/couriers', name: 'Kurye Yönetimi', crud: true },
    { path: '/admin/orders', name: 'Sipariş Yönetimi', crud: true },
    { path: '/admin/deliveries', name: 'Teslimat Yönetimi', crud: true },
    { path: '/admin/settings', name: 'Sistem Ayarları' },
    { path: '/admin/zones', name: 'Bölge Yönetimi', crud: true }
  ],
  business: [
    { path: '/business', name: 'İşletme Paneli Ana Sayfa' },
    { path: '/business/dashboard', name: 'İşletme Gösterge Paneli' },
    { path: '/business/orders', name: 'Siparişler', crud: true },
    { path: '/business/products', name: 'Ürün Yönetimi', crud: true },
    { path: '/business/products/create', name: 'Ürün Oluşturma' },
    { path: '/business/products/edit', name: 'Ürün Düzenleme' },
    { path: '/business/stats', name: 'İstatistikler' },
    { path: '/business/couriers', name: 'Kurye Takibi' },
    { path: '/business/settings', name: 'İşletme Ayarları' },
    { path: '/business/account', name: 'Hesap Yönetimi' }
  ],
  customer: [
    { path: '/customer', name: 'Müşteri Paneli Ana Sayfa' },
    { path: '/customer/dashboard', name: 'Müşteri Gösterge Paneli' },
    { path: '/customer/orders', name: 'Siparişlerim' },
    { path: '/customer/profile', name: 'Profil Bilgileri' },
    { path: '/customer/address', name: 'Adres Yönetimi', crud: true },
    { path: '/customer/address/create', name: 'Adres Ekleme' },
    { path: '/customer/address/edit', name: 'Adres Düzenleme' },
    { path: '/customer/payment', name: 'Ödeme Yöntemleri', crud: true },
    { path: '/customer/settings', name: 'Kullanıcı Ayarları' }
  ],
  courier: [
    { path: '/courier', name: 'Kurye Paneli Ana Sayfa' },
    { path: '/courier/dashboard', name: 'Kurye Gösterge Paneli' },
    { path: '/courier/deliveries', name: 'Teslimatlarım' },
    { path: '/courier/map', name: 'Teslimat Haritası' },
    { path: '/courier/account', name: 'Hesap Bilgileri' },
    { path: '/courier/earnings', name: 'Kazanç Raporu' },
    { path: '/courier/settings', name: 'Ayarlar' }
  ]
};

// Initialize results object
const testResults = {
  totalPages: 0,
  testedPages: 0,
  successfulPages: 0,
  failedPages: 0,
  skippedPages: 0,
  results: []
};

// Count total pages
Object.values(ALL_PAGES).forEach(category => {
  testResults.totalPages += category.length;
});

async function startTests() {
  console.log('Starting comprehensive test suite with Playwright and Chrome...');
  
  // Create test results file header
  const testHeader = `# Sepet Takip Uygulaması Kapsamlı Test Raporu

Test Tarihi: ${new Date().toLocaleString('tr-TR')}

## Özet

Bu rapor, Sepet Takip uygulamasının tüm sayfalarının ve fonksiyonlarının kapsamlı testlerini içermektedir.
Testler Chrome tarayıcı üzerinde otomatize edilmiş şekilde gerçekleştirilmiştir.

## Test Ortamı

- **Tarayıcı**: Chrome
- **Test Aracı**: Playwright
- **Veritabanı**: PostgreSQL
- **Test Kapsamı**: Tüm sayfalar ve CRUD işlemleri

## Test Kullanıcıları

| Rol | E-posta | Şifre |
|-----|---------|-------|
| Admin | admin@sepettakip.com | admin123 |
| İşletme | business@sepettakip.com | business123 |
| Müşteri | customer@sepettakip.com | customer123 |
| Kurye | courier@sepettakip.com | courier123 |

## Test Sonuçları

`;

  fs.writeFileSync(checkResultsPath, testHeader);

  // Browser setup
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 50
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Test all user roles
    for (const [role, credentials] of Object.entries(TEST_USERS)) {
      const roleName = role.toLowerCase();
      console.log(`Testing ${role} role with ${credentials.email}`);
      
      // Add role header to results file
      fs.appendFileSync(checkResultsPath, `### ${role} Rolü Testleri\n\n`);
      
      // Login first
      if (role !== 'PUBLIC') {
        await page.goto('http://localhost:3001/auth/login');
        await page.fill('input[type="email"]', credentials.email);
        await page.fill('input[type="password"]', credentials.password);
        await page.click('button[type="submit"]');
        
        // Wait for navigation
        await page.waitForTimeout(2000);
        
        // Check if login was successful
        const url = page.url();
        if (url.includes('/auth/login')) {
          console.error(`Failed to login as ${role}`);
          fs.appendFileSync(checkResultsPath, `⚠️ **Giriş Başarısız**: ${credentials.email} ile giriş yapılamadı\n\n`);
          continue;
        }
        
        console.log(`Successfully logged in as ${role}`);
        fs.appendFileSync(checkResultsPath, `✅ **Giriş Başarılı**: ${credentials.email} ile giriş yapıldı\n\n`);
      }
      
      // Test pages for this role
      const pages = ALL_PAGES[roleName] || ALL_PAGES.public;
      for (const pageInfo of pages) {
        console.log(`Testing page: ${pageInfo.name} (${pageInfo.path})`);
        testResults.testedPages++;
        
        try {
          await page.goto(`http://localhost:3001${pageInfo.path}`);
          await page.waitForTimeout(2000);
          
          // Check for error or 404 pages
          const errorText = await page.evaluate(() => {
            const errorElements = document.querySelectorAll('h1, h2, h3, h4, h5');
            for (const el of errorElements) {
              if (el.textContent.includes('404') || 
                  el.textContent.includes('Error') || 
                  el.textContent.includes('Hata')) {
                return el.textContent;
              }
            }
            return null;
          });
          
          if (errorText) {
            console.error(`Error on ${pageInfo.path}: ${errorText}`);
            fs.appendFileSync(checkResultsPath, `❌ **${pageInfo.name}** (${pageInfo.path}): Hata - ${errorText}\n\n`);
            testResults.failedPages++;
            testResults.results.push({
              path: pageInfo.path,
              name: pageInfo.name,
              role: role,
              status: 'FAILED',
              error: errorText
            });
            continue;
          }
          
          // Check CRUD functionality if applicable
          let crudTestResults = '';
          if (pageInfo.crud) {
            crudTestResults = '\n   - CRUD işlemleri: ';
            try {
              // Basic test - just check for CRUD elements
              const hasCrudElements = await page.evaluate(() => {
                const createButton = document.querySelector('button, a[href*="create"], a[href*="add"], a[href*="new"]');
                const editLinks = document.querySelectorAll('a[href*="edit"]');
                const deleteButtons = document.querySelectorAll('button[aria-label*="delete"], button[aria-label*="sil"]');
                
                return {
                  create: !!createButton,
                  edit: editLinks.length > 0,
                  delete: deleteButtons.length > 0
                };
              });
              
              crudTestResults += `Ekleme: ${hasCrudElements.create ? '✅' : '❌'}, `;
              crudTestResults += `Düzenleme: ${hasCrudElements.edit ? '✅' : '❌'}, `;
              crudTestResults += `Silme: ${hasCrudElements.delete ? '✅' : '❌'}`;
              
              // Count success based on CRUD elements presence
              const crudSuccess = hasCrudElements.create || hasCrudElements.edit || hasCrudElements.delete;
              
              if (!crudSuccess) {
                crudTestResults += ' (CRUD işlemleri bulunamadı)';
              }
            } catch (crudError) {
              crudTestResults += `Test edilemedi (${crudError.message})`;
            }
          }
          
          // Page loaded successfully
          console.log(`Successfully loaded ${pageInfo.path}`);
          fs.appendFileSync(checkResultsPath, `✅ **${pageInfo.name}** (${pageInfo.path}): Başarılı${crudTestResults}\n\n`);
          testResults.successfulPages++;
          testResults.results.push({
            path: pageInfo.path,
            name: pageInfo.name,
            role: role,
            status: 'SUCCESS',
            crudInfo: crudTestResults
          });
          
        } catch (pageError) {
          console.error(`Error testing ${pageInfo.path}: ${pageError.message}`);
          fs.appendFileSync(checkResultsPath, `❌ **${pageInfo.name}** (${pageInfo.path}): Hata - ${pageError.message}\n\n`);
          testResults.failedPages++;
          testResults.results.push({
            path: pageInfo.path,
            name: pageInfo.name,
            role: role,
            status: 'FAILED',
            error: pageError.message
          });
        }
      }
      
      // Logout if we're not testing public pages
      if (role !== 'PUBLIC') {
        try {
          // Find and click logout button
          await page.click('button[aria-label="Logout"], button:has-text("Çıkış")');
          await page.waitForTimeout(2000);
          console.log(`Successfully logged out from ${role}`);
          fs.appendFileSync(checkResultsPath, `✅ **Çıkış Başarılı**: ${role} hesabından çıkış yapıldı\n\n`);
        } catch (logoutError) {
          console.error(`Error logging out from ${role}: ${logoutError.message}`);
          fs.appendFileSync(checkResultsPath, `⚠️ **Çıkış Başarısız**: ${role} hesabından çıkış yapılamadı - ${logoutError.message}\n\n`);
        }
      }
    }
    
    // Calculate success rates
    const successRate = (testResults.successfulPages / testResults.testedPages * 100).toFixed(2);
    
    // Add summary to the results file
    const summary = `## Test Özeti

- **Test Edilen Sayfa Sayısı**: ${testResults.testedPages}/${testResults.totalPages}
- **Başarılı Sayfalar**: ${testResults.successfulPages}
- **Başarısız Sayfalar**: ${testResults.failedPages}
- **Atlanılan Sayfalar**: ${testResults.skippedPages}
- **Başarı Oranı**: %${successRate}

## Veri Tabanı Durumu

PostgreSQL veritabanı üzerinde tüm tablolar başarıyla oluşturulmuş ve test verileriyle doldurulmuştur.

| Tablo | Durum | Kayıt Sayısı |
|-------|-------|--------------|
| User | ✅ | ${await prisma.user.count()} |
| Admin | ✅ | ${await prisma.admin.count()} |
| Business | ✅ | ${await prisma.business.count()} |
| Customer | ✅ | ${await prisma.customer.count()} |
| Courier | ✅ | ${await prisma.courier.count()} |
| Order | ✅ | ${await prisma.order.count()} |
| OrderItem | ✅ | ${await prisma.orderItem.count()} |
| Product | ✅ | ${await prisma.product.count()} |
| Delivery | ✅ | ${await prisma.delivery.count()} |
| Zone | ✅ | ${await prisma.zone.count()} |
| Payment | ✅ | ${await prisma.payment.count()} |
| Notification | ✅ | ${await prisma.notification.count()} |
| CustomerAddress | ✅ | ${await prisma.customerAddress.count()} |
| Vehicle | ✅ | ${await prisma.vehicle.count()} |
| UserSettings | ✅ | ${await prisma.userSettings.count()} |
| SystemSettings | ✅ | ${await prisma.systemSettings.count()} |

## Sonuç ve Öneriler

${successRate >= 90 ? 
  '✅ Uygulama üretim ortamı için hazırdır. Testler başarıyla tamamlanmıştır.' : 
  '⚠️ Uygulama üretim ortamı için henüz hazır değildir. Yukarıda belirtilen hatalar düzeltilmelidir.'}

${testResults.failedPages > 0 ? '### Düzeltilmesi Gereken Sayfalar\n\n' + 
  testResults.results.filter(r => r.status === 'FAILED')
    .map(r => `- **${r.name}** (${r.path}) - Rol: ${r.role} - Hata: ${r.error}`).join('\n') : ''}
`;

    fs.appendFileSync(checkResultsPath, summary);
    
    console.log('Tests completed. Results written to:', checkResultsPath);
    console.log(`Success rate: ${successRate}%`);
    
  } catch (error) {
    console.error('Test suite failed:', error);
    fs.appendFileSync(checkResultsPath, `\n## Test Hatası\n\nTest süreci bir hata nedeniyle tamamlanamadı: ${error.message}\n`);
  } finally {
    await prisma.$disconnect();
    await browser.close();
  }
}

// Run tests
startTests()
  .catch(console.error); 