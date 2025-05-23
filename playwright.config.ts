import { defineConfig, devices } from '@playwright/test';

/**
 * SepetTakip uygulaması için Playwright test konfigürasyonu
 * Docker ortamında ve production build üzerinde çalışacak şekilde yapılandırılmıştır
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'test-results/playwright-results.json' }],
  ],
  
  // Test sonuçlarını ve raporları sakla
  outputDir: 'test-results',
  
  use: {
    // Tüm sayfa trafiğini yakala
    trace: 'on-first-retry',
    
    // Ekran görüntülerini otomatik olarak al
    screenshot: 'only-on-failure',
    
    // Video kaydetme
    video: 'on-first-retry',
    
    // Base URL'i ayarla
    baseURL: 'http://localhost:3001',
    
    // Sayfa yüklenme zaman aşımını artır
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    /* Commenting out other browsers to speed up testing
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
    */
  ],

  /* Using existing development server, not starting a new one
  webServer: process.env.TEST_BASE_URL ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60000,
  },
  */
}); 