import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { structuralPass } from "../structuralPass.js";
import { detectAdapter } from "./index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesRoot = path.resolve(__dirname, "../../test-fixtures");

const cases = [
  { fixture: "sample-winforms-app", expectedId: "dotnet_winforms" },
  { fixture: "sample-vb6-app", expectedId: "vb6" },
  { fixture: "sample-java-swing-app", expectedId: "java_swing" },
];

for (const { fixture, expectedId } of cases) {
  test(`detects ${fixture} as ${expectedId}`, async () => {
    const inventory = await structuralPass(path.join(fixturesRoot, fixture));
    const adapter = detectAdapter(inventory);
    assert.ok(adapter, `expected an adapter match for ${fixture}, got none`);
    assert.equal(adapter.id, expectedId);
  });
}
