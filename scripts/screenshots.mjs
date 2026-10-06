// Captures key screens at 1440px and 390px for visual review.
// Usage: node scripts/screenshots.mjs <outDir> [filter]
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { screens } from "./ui-screens.mjs";
const [out = "screenshots", only] = process.argv.slice(2);
const port = 4198;
const base = `http://127.0.0.1:${port}/`;
const server = spawn(
  "npx",
  [
    "vite",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
    "--strictPort",
  ],
  { stdio: "ignore" },
);
for (let i = 0; i < 60; i++) {
  try {
    if ((await fetch(base)).ok) break;
  } catch {}
  await new Promise((r) => setTimeout(r, 250));
}
const browser = await chromium.launch();
for (const [w, h] of [
  [1440, 900],
  [390, 844],
]) {
  for (const s of screens) {
    if (only && !s.name.includes(only)) continue;
    const ctx = await browser.newContext({
      viewport: { width: w, height: h },
      isMobile: w < 500,
      hasTouch: w < 500,
    });
    const page = await ctx.newPage();
    await page.route(
      /images\.unsplash\.com|fonts\.(googleapis|gstatic)\.com/,
      (r) => r.abort(),
    );
    try {
      await page.goto(base + (s.hash || ""));
      if (s.setup) await s.setup(page);
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${out}/${s.name}-${w}.png` });
    } catch (e) {
      console.log("failed", s.name, w, e.message.split("\n")[0]);
    }
    await ctx.close();
  }
}
await browser.close();
server.kill();
