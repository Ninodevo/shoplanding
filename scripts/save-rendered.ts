import { config } from "dotenv";
config({ path: ".env.local" });
import { writeFileSync } from "node:fs";
import { fetchRenderedPage } from "../src/lib/audit/rendered";

async function main() {
  const url = process.argv[2]!;
  const out = process.argv[3] ?? "/tmp/rendered.html";
  const r = await fetchRenderedPage(url);
  writeFileSync(out, r.html);
  console.log(`saved ${r.html.length} bytes → ${out}`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
