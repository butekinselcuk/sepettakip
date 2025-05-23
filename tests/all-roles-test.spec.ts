import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Test credentials for all roles
const ROLE_CREDENTIALS = {
  admin: { email: 'admin1@example.com', password: 'Test123' },
  courier: { email: 'courier1@example.com', password: 'Test123' },
  business: { email: 'business1@example.com', password: 'Test123' },
  customer: { email: 'customer1@example.com', password: 'Test123' },
};

// Pages to test for each role after login
const ROLE_PAGES = {
  admin: [
    '/admin/dashboard',
    '/admin/profile',
    '/admin/settings'
  ],
  courier: [
    '/courier/dashboard',
    '/courier/profile',
    '/courier/settings'
  ],
  business: [
    '/business/dashboard',
    '/business/profile',
    '/business/settings'
  ],
  customer: [
    '/customer/dashboard',
    '/customer/profile',
    '/customer/settings'
  ],
};

// Path for report file
const REPORT_PATH = 'app/page-manual-check/page-manual-check.md';

// Helper function to append results to report file
async function appendToReport(result: string) {
  let reportDir = path.dirname(REPORT_PATH);
  let reportPath = path.join(process.cwd(), REPORT_PATH);
  
  // Ensure directory exists
  if (!fs.existsSync(path.join(process.cwd(), reportDir))) {
    fs.mkdirSync(path.join(process.cwd(), reportDir), { recursive: true });
  }
  
  // Check if file exists and read it
  let content = '';
  if (fs.existsSync(reportPath)) {
    content = fs.readFileSync(reportPath, 'utf8');
  }

  // Append new result
  const timestamp = new Date().toLocaleTimeString('tr-TR', { hour12: false });
  content += `\n### Test: ${timestamp}\n\n${result}\n`;
  
  // Write back to file
  fs.writeFileSync(reportPath, content, 'utf8');
}

// Get a nice display name for roles
function getRoleName(role: string): string {
  switch(role) {
    case 'admin': return 'Admin';
    case 'courier': return 'Kurye';
    case 'business': return 'İşletme';
    case 'customer': return 'Müşteri';
    default: return role;
  }
}

// Test each role
for (const [role, credentials] of Object.entries(ROLE_CREDENTIALS)) {
  test.describe(`${getRoleName(role)} E2E Tests`, () => {
    test.setTimeout(60000); // 1 minute timeout
    
    test(`${getRoleName(role)} login test`, async ({ page }) => {
      try {
        // Navigate to login page
        await page.goto('/auth/login');
        
        // Take a screenshot of the login page
        const loginScreenshotPath = `screenshots/${role}-login-page.png`;
        await page.screenshot({ path: loginScreenshotPath });
        console.log(`${getRoleName(role)} login page screenshot saved`);
        
        // Fill login form
        await page.fill('input[id="email"]', credentials.email);
        await page.fill('input[id="password"]', credentials.password);
        
        // Click login button and wait for response
        const responsePromise = page.waitForResponse(
          response => response.url().includes('/api/auth/login')
        );
        
        await page.click('button[type="submit"]');
        
        // Get the response
        const response = await responsePromise;
        const responseData = await response.json().catch(() => null);
        
        // Wait a bit for processing
        await page.waitForTimeout(3000);
        
        // Take a screenshot after login attempt
        const afterLoginScreenshotPath = `screenshots/${role}-after-login.png`;
        await page.screenshot({ path: afterLoginScreenshotPath });
        
        // Check the response status
        if (!response.ok()) {
          const errorText = responseData?.error || `HTTP error ${response.status()}`;
          console.log(`${getRoleName(role)} Login API error:`, errorText);
          await appendToReport(`❌ ${getRoleName(role)} login test failed: API error: ${errorText}`);
          return;
        }
        
        // Check for error elements on the page as a backup
        const errorElement = await page.$('div.bg-red-100');
        if (errorElement) {
          const errorText = await errorElement.textContent();
          console.log(`${getRoleName(role)} UI error message:`, errorText);
          await appendToReport(`❌ ${getRoleName(role)} login test failed: UI error: ${errorText}`);
          return;
        }
        
        await appendToReport(`✅ ${getRoleName(role)} login test passed: Successfully submitted login form`);
        console.log(`${getRoleName(role)} login test passed`);
        
        // Try to access role-specific pages
        if (ROLE_PAGES[role as keyof typeof ROLE_PAGES]) {
          const pages = ROLE_PAGES[role as keyof typeof ROLE_PAGES];
          for (const pagePath of pages) {
            await testPageAccess(page, pagePath, role);
          }
        }
        
      } catch (error: any) {
        console.error(`${getRoleName(role)} login test execution failed:`, error.message);
        try {
          await page.screenshot({ path: `screenshots/${role}-error.png` });
        } catch (screenshotError) {
          console.error('Failed to take error screenshot');
        }
        await appendToReport(`❌ ${getRoleName(role)} login test execution failed: ${error.message}`);
      }
    });
  });
}

// Test access to a specific page
async function testPageAccess(page: Page, pagePath: string, role: string) {
  try {
    console.log(`Testing access to ${pagePath} for ${getRoleName(role)}`);
    
    // Navigate to the page
    await page.goto(pagePath, { timeout: 30000 });
    
    // Take a screenshot
    const screenshotPath = `screenshots/${role}${pagePath.replace(/\//g, '-')}.png`;
    await page.screenshot({ path: screenshotPath });
    
    // Get page title or heading
    const title = await page.title();
    
    // Check for error elements
    const errorElement = await page.$('div:has-text("Error")');
    if (errorElement) {
      const errorText = await errorElement.textContent();
      await appendToReport(`❌ ${getRoleName(role)} - ${pagePath} access failed: ${errorText}`);
      return;
    }
    
    // Success
    await appendToReport(`✅ ${getRoleName(role)} - ${pagePath} access successful. Title: ${title}`);
    console.log(`✅ ${getRoleName(role)} - ${pagePath} access successful`);
    
  } catch (error: any) {
    console.error(`Error accessing ${pagePath} for ${getRoleName(role)}:`, error.message);
    await appendToReport(`❌ ${getRoleName(role)} - ${pagePath} access error: ${error.message}`);
  }
} 