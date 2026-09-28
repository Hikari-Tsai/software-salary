// Keep the sharing image's sample badge aligned with the generated statistics.
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const summary = JSON.parse(await readFile(new URL("../app/salary-data.json", import.meta.url), "utf8"));
const target = new URL("../public/images/og-salary-thumbnail.png", import.meta.url);
const count = summary.salary.n;
if (!Number.isSafeInteger(count) || count < 1) throw new Error("Invalid sample count");
const original = await readFile(target);
const metadata = await sharp(original).metadata();
if (metadata.width !== 1200 || metadata.height !== 630) throw new Error("Unexpected sharing image size");
const overlay = Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect x="68" y="455" width="238" height="58" rx="29" fill="#cdf45f"/>
  <text x="187" y="491" text-anchor="middle" font-family="PingFang TC, Noto Sans CJK TC, sans-serif" font-size="22" fill="#071c13">${count} 筆有效樣本</text>
</svg>`);
const result = await sharp(original).composite([{ input: overlay }]).png().toBuffer();
await writeFile(target, result);
console.log(`Sharing image updated: ${count} samples`);
