import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // App should load with mock user mode enabled via VITE_MOCK_USER=true.
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });

  // Dashboard visible (or empty state) but should include the header copy.
  await page.waitForSelector("text=Recent Documents", { timeout: 15_000 });

  // Navigate to document creation.
  await page.getByRole("button", { name: /new invoice/i }).click();
  await page.waitForURL("**/documents/new", { timeout: 10_000 });

  // M4: Copy from previous + customer search exist on create page.
  await page.waitForSelector("text=Copy from previous", { timeout: 10_000 });
  await page.waitForSelector("text=Find customer", { timeout: 10_000 });

  // M4: Item picker exists (recent group depends on usage).
  const selects = await page.locator("select").count();
  assert(selects > 0, "Expected at least one <select> on creation page");

  await browser.close();
  console.log("Playwright smoke: OK");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

