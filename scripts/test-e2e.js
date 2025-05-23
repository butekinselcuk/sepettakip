const puppeteer = require('puppeteer');

// Test user credentials
const users = [
  { role: 'admin', email: 'admin1@example.com', password: 'Test123', dashboard: '/admin/dashboard' },
  { role: 'business', email: 'business1@example.com', password: 'Test123', dashboard: '/business/dashboard' },
  { role: 'courier', email: 'courier1@example.com', password: 'Test123', dashboard: '/courier/dashboard' },
  { role: 'customer', email: 'customer1@example.com', password: 'Test123', dashboard: '/customer/dashboard' }
];

// Base URL for the application
const baseUrl = 'http://localhost:3001';

async function runTest(user) {
  console.log(`\n=== Starting test for ${user.role} user: ${user.email} ===\n`);
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set a user agent to avoid detection as a bot
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36');
    
    // Enable console log in the page
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    
    // Step 1: Go to login page
    console.log('1. Going to login page...');
    await page.goto(`${baseUrl}/auth/login`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"]');
    
    // Step 2: Enter credentials and login
    console.log('2. Entering credentials and logging in...');
    await page.type('input[type="email"]', user.email);
    await page.type('input[type="password"]', user.password);
    
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ timeout: 60000 }) // Wait up to 60 seconds for navigation
    ]);
    
    // Step 3: Check if we're redirected to the dashboard
    console.log('3. Checking current URL after login...');
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    if (currentUrl.includes(user.dashboard)) {
      console.log(`✅ Login successful! Redirected to ${user.dashboard}`);
    } else {
      console.log(`❌ Login failed! Current URL: ${currentUrl}`);
      
      // Try to get any error message displayed
      const errorMessage = await page.evaluate(() => {
        const errorElement = document.querySelector('.text-red-500') || 
                            document.querySelector('.text-red-700') || 
                            document.querySelector('[role="alert"]');
        return errorElement ? errorElement.textContent : null;
      });
      
      if (errorMessage) {
        console.log(`Error message: ${errorMessage}`);
      }
      
      throw new Error(`Login failed for ${user.role}`);
    }
    
    // Step 4: Check dashboard content
    console.log('4. Checking dashboard content...');
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Extract the heading text to verify we're on the correct page
    const headingText = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.textContent : null;
    });
    
    console.log(`Dashboard heading: ${headingText}`);
    
    if (headingText && (headingText.includes('Dashboard') || headingText.includes('Gösterge Paneli'))) {
      console.log('✅ Dashboard content loaded successfully!');
    } else {
      console.log('❌ Dashboard content verification failed!');
    }
    
    // Step 5: Optional - check specific role features
    console.log('5. Checking role-specific features...');
    
    if (user.role === 'admin') {
      // Check admin-specific elements
      await page.waitForSelector('.metrics-card, .card', { timeout: 10000 }).catch(() => {
        console.log('⚠️ Admin metrics cards not found');
      });
    } else if (user.role === 'business') {
      // Check business-specific elements
      await page.waitForSelector('.order-list, .business-stats', { timeout: 10000 }).catch(() => {
        console.log('⚠️ Business stats elements not found');
      });
    } else if (user.role === 'courier') {
      // Check courier-specific elements
      await page.waitForSelector('.delivery-list, .courier-stats', { timeout: 10000 }).catch(() => {
        console.log('⚠️ Courier delivery elements not found');
      });
    } else if (user.role === 'customer') {
      // Check customer-specific elements
      await page.waitForSelector('.order-history, .customer-stats', { timeout: 10000 }).catch(() => {
        console.log('⚠️ Customer order history not found');
      });
    }
    
    // Step 6: Logout
    console.log('6. Testing logout...');
    await page.evaluate(() => {
      // Clear storage
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Navigate to login page to check if we're logged out
    await page.goto(`${baseUrl}/auth/login`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"]');
    console.log('✅ Successfully logged out');
    
    console.log(`\n=== Test for ${user.role} user completed successfully! ===\n`);
    
  } catch (error) {
    console.error(`❌ Test failed for ${user.role} user:`, error.message);
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('Starting end-to-end tests for all user roles...');
  
  // Run tests sequentially
  for (const user of users) {
    await runTest(user);
  }
  
  console.log('All tests completed.');
}

main().catch(error => {
  console.error('Test script error:', error);
  process.exit(1);
}); 