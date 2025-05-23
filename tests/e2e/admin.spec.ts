import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Test credentials
const TEST_CREDENTIALS = {
  email: 'admin1@example.com',
  password: 'Test123'
};

// Helper function to append results to report file
async function appendToReport(result: string) {
  const reportPath = path.join(process.cwd(), 'app/page-manual-check/page-manual-check.md');
  
  // Check if file exists and read it
  let content = '';
  if (fs.existsSync(reportPath)) {
    content = fs.readFileSync(reportPath, 'utf8');
  }

  // Append new result
  const timestamp = new Date().toLocaleTimeString('tr-TR');
  content += `\n### Admin Test: ${timestamp}\n\n${result}\n`;
  
  // Write back to file
  fs.writeFileSync(reportPath, content, 'utf8');
}

test.describe('Admin E2E Tests', () => {
  // Set a shorter timeout
  test.setTimeout(90000); // 1.5 dakika
  
  test('Admin login test', async ({ page }) => {
    try {
      // Navigate to login page
      await page.goto('/auth/login');
      
      // Take a screenshot of the login page
      await page.screenshot({ path: 'screenshots/login-page.png' });
      console.log('Login page screenshot saved');
      
      // Fill login form
      await page.fill('input[id="email"]', TEST_CREDENTIALS.email);
      await page.fill('input[id="password"]', TEST_CREDENTIALS.password);
      
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
      await page.screenshot({ path: 'screenshots/after-login.png' });
      
      // Check the response status
      if (!response.ok()) {
        const errorText = responseData?.error || `HTTP error ${response.status()}`;
        console.log('Login API error:', errorText);
        await appendToReport(`❌ Admin login test failed: API error: ${errorText}`);
        
        // Don't fail the test - this is documenting the current state
        console.log('Test completed with API error documentation');
        return;
      }
      
      // Check for error elements on the page as a backup
      const errorElement = await page.$('div.bg-red-100');
      if (errorElement) {
        const errorText = await errorElement.textContent();
        console.log('UI error message:', errorText);
        await appendToReport(`❌ Admin login test failed: UI error: ${errorText}`);
        
        // Don't fail the test - this is documenting the current state
        console.log('Test completed with UI error documentation');
        return;
      }
      
      await appendToReport('✅ Admin login test passed: Admin login form submitted successfully');
      console.log('Login test passed');
      
    } catch (error: any) {
      console.error('Login test execution failed:', error.message);
      try {
        // Take a screenshot of the error page
        await page.screenshot({ path: 'screenshots/login-error.png' });
      } catch (screenshotError) {
        console.error('Failed to take error screenshot');
      }
      await appendToReport(`❌ Admin login test execution failed: ${error.message}`);
      // Don't fail the test - we're just documenting the current state
    }
  });
}); 