import { promises as fs } from "node:fs";
import path from "node:path";
import { structuralPass } from "./structuralPass.js";
import { detectAdapter } from "./adapters/index.js";
import { analyze } from "./analyze.js";
import { summarize } from "./summarize.js";

function parseArgs(argv) {
  const args = argv.slice(2);
  const targetPath = args.find((arg) => !arg.startsWith("--"));
  const outIndex = args.indexOf("--out");
  const outPath = outIndex !== -1 ? args[outIndex + 1] : "migration-report.json";
  return { targetPath, outPath };
}

async function main() {
  const { targetPath, outPath } = parseArgs(process.argv);

  if (!targetPath) {
    console.error("Usage: node src/cli.js <path-to-legacy-app> [--out report.json]");
    process.exitCode = 1;
    return;
  }

  const rootDir = path.resolve(targetPath);

  console.error(`[1/4] Structural pass over ${rootDir} ...`);
  const inventory = await structuralPass(rootDir);
  console.error(`      ${inventory.fileCount} files found.`);

  console.error("[2/4] Detecting source-language adapter ...");
  const adapter = detectAdapter(inventory);
  if (!adapter) {
    console.error("      No known adapter matched this codebase (checked: .NET WinForms, VB6, Java Swing).");
    process.exitCode = 1;
    return;
  }
  console.error(`      Detected: ${adapter.displayName} (${adapter.id})`);

  console.error("[3/4] Agentic analysis (this can take a while) ...");
  const report = await analyze(rootDir, inventory, adapter);

  console.error("[4/4] Generating human-readable summary ...");
  const summary = await summarize(report);

  await fs.writeFile(outPath, JSON.stringify(report, null, 2), "utf-8");
  console.error(`\nStructured report written to ${outPath}\n`);

  console.log(summary);
}

main().catch((error) => {
  console.error("Analysis failed:", error.message);
  process.exitCode = 1;
});
