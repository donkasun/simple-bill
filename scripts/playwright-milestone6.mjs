/**
 * Playwright checks for Milestone 6 (guidance + empty states) and baseline M4 smoke.
 *
 * Prerequisites (pick one):
 * - Start dev yourself: VITE_MOCK_USER=true npm run dev -- --port 5173
 *   then: BASE_URL=http://localhost:5173 PLAYWRIGHT_START_SERVER=0 node scripts/playwright-milestone6.mjs
 * - Or let this script start Vite (default): uses PLAYWRIGHT_PORT (default 5179) and VITE_MOCK_USER=true.
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import http from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const PORT = Number(process.env.PLAYWRIGHT_PORT || 5179);
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const START_SERVER = process.env.PLAYWRIGHT_START_SERVER !== "0";

function httpGetOk(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(url, maxMs = 90_000) {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    if (await httpGetOk(url)) return;
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Timed out waiting for dev server at ${url}`);
}

let devChild = null;

async function ensureServer() {
  if (!START_SERVER) {
    if (!(await httpGetOk(BASE_URL))) {
      throw new Error(
        `No server at ${BASE_URL}. Start dev with VITE_MOCK_USER=true or set PLAYWRIGHT_START_SERVER=1.`,
      );
    }
    return;
  }

  if (await httpGetOk(BASE_URL)) return;

  devChild = spawn("npx", ["vite", "--port", String(PORT), "--strictPort"], {
    cwd: repoRoot,
    env: { ...process.env, VITE_MOCK_USER: "true" },
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  devChild.on("error", (err) => {
    console.error("Failed to start Vite:", err);
  });

  await waitForServer(BASE_URL);
}

function shutdown() {
  if (devChild && !devChild.killed) {
    devChild.kill("SIGTERM");
  }
}

async function run() {
  await ensureServer();

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    await page.getByText("Recent documents", { exact: false }).waitFor({
      timeout: 30_000,
    });

    // M6: Dashboard copy (empty state or header area still loads)
    await page
      .getByRole("button", { name: "New invoice", exact: true })
      .click();
    await page.waitForURL("**/documents/new", { timeout: 15_000 });

    await page
      .getByRole("main")
      .getByRole("heading", { name: "New invoice or quote" })
      .waitFor({
        timeout: 15_000,
      });

    // M6: Helper microcopy (always on page when form loads)
    await page.getByText(/proposing work/i).waitFor({ timeout: 10_000 });
    await page.getByText(/billing for payment/i).waitFor({ timeout: 10_000 });
    await page.getByText(/Drafts stay editable/i).waitFor({ timeout: 10_000 });

    // M7: Terms page renders
    await page.goto(`${BASE_URL}/terms`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Terms of Service" }).waitFor({
      timeout: 15_000,
    });
    await page.getByText(/By using SimpleBill/i).waitFor({ timeout: 15_000 });

    // M6: Stepper — only when Firestore reports zero docs and profile not dismissed
    const guide = page.getByLabel("First invoice guide");
    try {
      await guide.waitFor({ state: "visible", timeout: 12_000 });
      await page.getByRole("button", { name: /got it.*show again/i }).click();
      await guide.waitFor({ state: "hidden", timeout: 10_000 });
    } catch {
      console.warn(
        "[playwright-milestone6] First invoice guide not shown (Firestore may be unavailable or user already has documents / dismissed). Skipping stepper assertions.",
      );
    }

    // M6: Items empty-state CTA (only when catalog empty)
    await page.goto(`${BASE_URL}/items`, { waitUntil: "domcontentloaded" });
    const addFirst = page.getByRole("button", { name: /add your first item/i });
    if (await addFirst.isVisible().catch(() => false)) {
      await addFirst.click();
      await page.getByText("Add Item", { exact: true }).waitFor({
        timeout: 10_000,
      });
    } else {
      console.warn(
        "[playwright-milestone6] Items list non-empty or still loading; skipped Add Item modal check.",
      );
    }

    // M4 baseline still present on create page
    await page.goto(`${BASE_URL}/documents/new`, {
      waitUntil: "domcontentloaded",
    });
    await page.getByText("Copy from previous", { exact: false }).waitFor({
      timeout: 15_000,
    });
    await page.getByText("Bill To", { exact: false }).waitFor({
      timeout: 10_000,
    });

    console.log("Playwright Milestone 6 + Milestone 7 checks: OK");
  } finally {
    await browser.close();
    shutdown();
  }
}

run().catch((e) => {
  console.error(e);
  shutdown();
  process.exit(1);
});
