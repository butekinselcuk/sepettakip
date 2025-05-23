import { test, expect } from '@playwright/test';

test.describe('Ana Sayfa', () => {
  test('Ana sayfa yükleniyor ve başlık görünüyor', async ({ page }) => {
    await page.goto('/');
    // Başlık veya ana içerik kontrolü (örnek: SepetTakip veya bir ana başlık)
    await expect(page.locator('text=SepetTakip')).toBeVisible();
  });
}); 