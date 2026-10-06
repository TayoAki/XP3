// UI quality gate. Builds nothing; serves dist/ with `vite preview`, opens
// every screen in scripts/ui-screens.mjs at 390px and 1440px, and fails on:
//   - interactive elements whose hit area is under 44px at 390px wide
//   - neighbouring controls closer than 8px
//   - visible text under 12px
//   - horizontal page scroll
//   - console errors or uncaught exceptions
// Usage: npm run build && node scripts/check-ui.mjs [--url http://host:port]
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { screens } from "./ui-screens.mjs";

const args = process.argv.slice(2);
const only = args.find((a) => a.startsWith("--only="))?.slice(7);
let base = args[args.indexOf("--url") + 1];
let server;
if (!args.includes("--url")) {
  const port = 4199;
  base = `http://127.0.0.1:${port}/`;
  server = spawn(
    "npx",
    ["vite", "preview", "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
    { stdio: "ignore" },
  );
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(base)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
}

const viewports = [
  { name: "390", width: 390, height: 844, touch: true },
  { name: "1440", width: 1440, height: 900, touch: false },
];

// Runs inside the page. Returns a list of human-readable violations.
function audit({ touch }) {
  const out = [];
  const visible = (el) => {
    if (el.closest("[aria-hidden='true'], .sr-only, [hidden]")) return false;
    const s = getComputedStyle(el);
    if (s.visibility === "hidden" || s.display === "none" || +s.opacity === 0)
      return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const describe = (el) => {
    const name =
      el.getAttribute("aria-label") ||
      el.textContent?.trim().replace(/\s+/g, " ").slice(0, 40) ||
      el.getAttribute("placeholder") ||
      el.tagName.toLowerCase();
    const cls = typeof el.className === "string" ? el.className.split(" ")[0] : "";
    return `${el.tagName.toLowerCase()}${cls ? "." + cls : ""} "${name}"`;
  };
  const controls = [
    ...document.querySelectorAll(
      "button, a[href], select, textarea, input:not([type=hidden]), [role=button], [role=tab], [role=switch]",
    ),
  ].filter(
    (el) =>
      visible(el) &&
      !el.closest("p, li:not([role]), blockquote") &&
      !el.parentElement?.closest("button, a[href]"),
  );

  // 1. Hit area (touch only). Sample the edges of a 44px square around the
  // centre: pseudo-element hit areas count because hit testing returns the
  // owning element.
  if (touch) {
    for (const el of controls) {
      const target = el.matches("input[type=checkbox], input[type=radio]")
        ? el.closest("label") || el
        : el;
      const r = target.getBoundingClientRect();
      if (r.width >= 44 && r.height >= 44) continue;
      el.scrollIntoView({ block: "center", inline: "center" });
      const b = target.getBoundingClientRect();
      const cx = b.left + b.width / 2,
        cy = b.top + b.height / 2;
      const hits = [
        [cx - 21, cy],
        [cx + 21, cy],
        [cx, cy - 21],
        [cx, cy + 21],
      ].every(([x, y]) => {
        const hit = document.elementFromPoint(x, y);
        return hit && (target.contains(hit) || hit.contains(target));
      });
      if (!hits)
        out.push(
          `hit area ${Math.round(r.width)}×${Math.round(r.height)} < 44: ${describe(el)}`,
        );
    }
    window.scrollTo(0, 0);
  }

  // 2. Spacing between neighbouring controls.
  const grouped = (el) => el.closest(".segmented, [role=tablist], .map-canvas");
  // Controls in different fixed/sticky layers only touch while scrolling.
  const layer = (el) => {
    for (let n = el; n; n = n.parentElement) {
      const p = getComputedStyle(n).position;
      if (p === "fixed" || p === "sticky") return n;
    }
    return null;
  };
  const rects = controls.map((el) => [el, el.getBoundingClientRect()]);
  for (let i = 0; i < rects.length; i++) {
    const [a, ra] = rects[i];
    for (let j = i + 1; j < rects.length; j++) {
      const [b, rb] = rects[j];
      if (a.contains(b) || b.contains(a)) continue;
      if (grouped(a) && grouped(a) === grouped(b)) continue;
      if (layer(a) !== layer(b)) continue;
      const overlapY = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
      const overlapX = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
      let gap = null;
      if (overlapY > 4) gap = Math.max(rb.left - ra.right, ra.left - rb.right);
      else if (overlapX > 4) gap = Math.max(rb.top - ra.bottom, ra.top - rb.bottom);
      if (gap !== null && gap >= 0 && gap < 7.5)
        out.push(`controls ${Math.round(gap)}px apart: ${describe(a)} / ${describe(b)}`);
    }
  }

  // 3. Text size.
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const small = new Set();
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.textContent.trim()) continue;
    const el = node.parentElement;
    if (!el || !visible(el) || el.closest("svg")) continue;
    const size = parseFloat(getComputedStyle(el).fontSize);
    if (size < 11.5) small.add(`text ${size}px: ${describe(el)}`);
  }
  out.push(...small);

  // 4. Horizontal scroll.
  const doc = document.documentElement;
  if (doc.scrollWidth > doc.clientWidth + 1)
    out.push(`horizontal scroll: ${doc.scrollWidth} > ${doc.clientWidth}`);
  return out;
}

const browser = await chromium.launch();
let failures = 0;
for (const vp of viewports) {
  for (const screen of screens) {
    if (only && !screen.name.includes(only)) continue;
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      hasTouch: vp.touch,
      isMobile: vp.touch,
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(`uncaught: ${e.message}`));
    page.on("console", (m) => {
      if (m.type() === "error" && !/Failed to load resource/.test(m.text()))
        errors.push(`console: ${m.text()}`);
    });
    // External images are blocked in some environments; never fail on them.
    await page.route(/images\.unsplash\.com|fonts\.(googleapis|gstatic)\.com/, (r) =>
      r.abort(),
    );
    try {
      await page.goto(base + (screen.hash || ""), { waitUntil: "load" });
      if (screen.setup) await screen.setup(page, vp);
      await page.waitForTimeout(250);
      const problems = [...errors, ...(await page.evaluate(audit, vp))];
      if (problems.length) {
        failures += problems.length;
        console.log(`✗ ${screen.name} @${vp.name}`);
        for (const p of problems) console.log("    " + p);
      } else console.log(`✓ ${screen.name} @${vp.name}`);
    } catch (e) {
      failures++;
      console.log(`✗ ${screen.name} @${vp.name}: setup failed: ${e.message.split("\n")[0]}`);
    }
    await context.close();
  }
}
await browser.close();
server?.kill();
console.log(failures ? `\n${failures} UI problem(s).` : "\nUI checks passed.");
process.exit(failures ? 1 : 0);
