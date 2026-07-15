import { winformsAdapter } from "./winforms.js";
import { vb6Adapter } from "./vb6.js";
import { javaSwingAdapter } from "./javaSwing.js";

// Order matters only as a tiebreaker if multiple adapters somehow match at
// once; the three detection signatures (spec §4.3) don't overlap in
// practice.
export const ADAPTERS = [winformsAdapter, vb6Adapter, javaSwingAdapter];

/** Returns the first adapter whose detect() matches this inventory, or null. */
export function detectAdapter(inventory) {
  return ADAPTERS.find((adapter) => adapter.detect(inventory)) || null;
}

/** Looks up a previously-detected adapter by its stored id, or null. */
export function getAdapterById(id) {
  return ADAPTERS.find((adapter) => adapter.id === id) || null;
}
