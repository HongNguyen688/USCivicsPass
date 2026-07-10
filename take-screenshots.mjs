import { chromium } from './node_modules/playwright/index.mjs';

const BASE = 'http://localhost:5173';
const OUT  = './screenshots';

const shot = async (page, name) => {
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`✓ ${name}.png`);
};

const click = async (page, sel, timeout = 8000) => {
  await page.waitForSelector(sel, { timeout });
  await page.click(sel);
};

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 390, height: 844 });

// 1. Selection screen
await page.goto(BASE);
await shot(page, '01-selection-screen');

// 2. Dashboard
await click(page, 'text=100 Questions (2008)');
await shot(page, '02-dashboard');

// 3. Civics Study
await click(page, 'text=100 Civics Questions');
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/03-civics-study.png` });
console.log('✓ 03-civics-study.png');

// scroll down to see the answer area
await page.evaluate(() => window.scrollTo(0, 500));
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/04-civics-study-bottom.png` });
console.log('✓ 04-civics-study-bottom.png');

// 5. Flashcards
await page.goto(BASE);
await click(page, 'text=100 Questions (2008)');
await click(page, 'text=Flash Card');
await shot(page, '05-flashcards');

// 6. Practice Quiz
await page.goto(BASE);
await click(page, 'text=100 Questions (2008)');
await click(page, 'text=Civics Practice Test');
await shot(page, '06-practice-quiz');

// 7. Reading Practice
await page.goto(BASE);
await click(page, 'text=100 Questions (2008)');
await click(page, 'text=Reading Practice');
await shot(page, '07-reading-practice');

// 8. Writing Practice
await page.goto(BASE);
await click(page, 'text=100 Questions (2008)');
await click(page, 'text=Writing Practice');
await shot(page, '08-writing-practice');

// 9. Vocabulary
await page.goto(BASE);
await click(page, 'text=100 Questions (2008)');
await click(page, 'text=Vocabulary');
await shot(page, '09-vocabulary');

// 10. N-400 Prep
await page.goto(BASE);
await click(page, 'text=100 Questions (2008)');
await click(page, 'text=N-400 Questions');
await shot(page, '10-n400-prep');

await browser.close();
console.log('\nAll screenshots saved to screenshots/');
