import { EXPLORATION_PASSES_CHECKLIST } from "./passesChecklist.js";

// Validated end-to-end in M1 against test-fixtures/sample-winforms-app —
// the risk-flagging pass caught both deliberately planted risks.
export const winformsAdapter = {
  id: "dotnet_winforms",
  displayName: ".NET WinForms",

  detect(inventory) {
    const ext = inventory.byExtension;
    return Boolean(ext[".csproj"]) || Boolean(ext[".vbproj"]);
  },

  promptContext: `
You are analyzing a .NET WinForms desktop application.

Detection signatures: .csproj/.vbproj files, "System.Windows.Forms" usings,
paired *.cs / *.Designer.cs files per form.

Known quirks to watch for:
- Designer-generated code (in *.Designer.cs) is mixed with hand-written
  logic (in the paired *.cs file) — the designer file defines UI layout and
  should generally be treated as boilerplate, while the hand-written file
  usually contains the real business logic and event handlers.
- Direct ADO.NET SQL (SqlConnection/SqlCommand) is common instead of an ORM
  — trace these to reconstruct the database schema, and flag any raw SQL
  built via string concatenation as a risk (SQL injection).
- Swallowed exceptions (empty or overly broad catch blocks) are a common
  source of silent failures in this ecosystem — flag them as risks.

${EXPLORATION_PASSES_CHECKLIST}
`.trim(),
};
