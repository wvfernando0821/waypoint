import { EXPLORATION_PASSES_CHECKLIST } from "./passesChecklist.js";

// Stub adapter (M2 — ROADMAP.md): detection is validated against
// test-fixtures/sample-vb6-app, but this prompt context has NOT been run
// end-to-end against a real VB6 sample the way WinForms was in M1. Expect
// to need refinement once this adapter actually gets exercised.
export const vb6Adapter = {
  id: "vb6",
  displayName: "VB6",

  detect(inventory) {
    const ext = inventory.byExtension;
    return Boolean(ext[".vbp"]) || Boolean(ext[".frm"]) || Boolean(ext[".bas"]);
  },

  promptContext: `
You are analyzing a VB6 (Visual Basic 6) desktop application — the oldest
and riskiest of the legacy stacks this platform supports.

Detection signatures: .vbp (project), .frm (forms), .bas (modules), .cls
(class modules).

Known quirks to watch for:
- Implicit variant typing — VB6 lets variables hold any type without
  declaration; trace actual usage rather than assuming a type from the name.
- "On Error Resume Next" is common and silently swallows errors, letting
  execution continue after a failure with no visible sign anything went
  wrong — flag every instance as a risk.
- COM dependencies and third-party OCX controls (e.g. Crystal Reports) are
  common and often have no direct web equivalent — flag these as migration
  blockers needing a design decision, not just a risk.
- Data access is typically via ADO or DAO rather than an ORM — trace these
  to reconstruct the database schema.

${EXPLORATION_PASSES_CHECKLIST}
`.trim(),
};
