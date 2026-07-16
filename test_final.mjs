import { chromium } from 'playwright';

const URL = 'http://localhost:8081';
const API = 'http://localhost:3002';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const allErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') allErrors.push({ type: 'console', text: msg.text().substring(0, 200) });
  });
  page.on('pageerror', err => allErrors.push({ type: 'page', text: err.message.substring(0, 200) }));

  // Login
  await page.goto(`${URL}/login`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.fill('input[type="email"]', 'demo@mail.ru');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  const token = await page.evaluate(() => localStorage.getItem('token'));

  console.log(`Token: ${token ? token.substring(0, 30)+'...' : 'NONE'}`);

  const testPages = [
    '/', '/login', '/register', '/forgot-password',
    '/premium', '/premium/success', '/premium/cancel',
    '/search', '/matches', '/chats', '/profile/edit',
    '/groups', '/activity', '/settings',
  ];

  for (const path of testPages) {
    allErrors.length = 0;
    try {
      await page.goto(`${URL}${path}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);

      const realErrors = allErrors.filter(e => {
        const t = e.text;
        // Ignore expected warnings
        if (t.includes('Sentry') || t.includes('Supabase') || t.includes('Service Worker')) return false;
        // Ignore expected 404 for non-existent routes (NotFound component)
        if (t.includes('non-existent route')) return false;
        return true;
      });

      if (realErrors.length > 0) {
        console.log(`❌ ${path.padEnd(30)} ${realErrors.length} errors`);
        realErrors.slice(0, 2).forEach(e => console.log(`    ${e.type}: ${e.text}`));
      } else {
        console.log(`✅ ${path.padEnd(30)} ok`);
      }
    } catch (err) {
      console.log(`💥 ${path.padEnd(30)} CRASH: ${err.message.substring(0, 100)}`);
    }
  }

  await browser.close();
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
