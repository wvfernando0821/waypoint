import { EXPLORATION_PASSES_CHECKLIST } from "./passesChecklist.js";

// Validated end-to-end against the CRUD test-fixtures/sample-vb6-app: the
// risk-flagging pass correctly caught the planted SQL injection and the
// On Error Resume Next silent-failure risk, with no hallucinated content.
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
