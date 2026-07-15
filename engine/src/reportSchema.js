// Mirrors the `migration_reports` table (spec §4.2) plus the screen
// inventory and entity/schema map called out in §4.4 Step 4.
export const REPORT_JSON_SCHEMA = {
  type: "object",
  properties: {
    architecture_summary: {
      type: "string",
      description: "A few sentences on the overall structure of the application.",
    },
    screens: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string", description: "What the screen displays and what user actions it handles." },
          tables_used: { type: "array", items: { type: "string" } },
        },
        required: ["name", "description", "tables_used"],
        additionalProperties: false,
      },
    },
    entity_schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          table: { type: "string" },
          columns: { type: "array", items: { type: "string" } },
          relationships: { type: "array", items: { type: "string" } },
        },
        required: ["table", "columns", "relationships"],
        additionalProperties: false,
      },
    },
    complexity_score: {
      type: "integer",
      description: "1 (trivial) to 10 (very high complexity).",
    },
    effort_estimate_hours: { type: "integer" },
    risk_flags: {
      type: "array",
      items: {
        type: "object",
        properties: {
          severity: { type: "string", enum: ["high", "medium", "low"] },
          file: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
        },
        required: ["severity", "file", "title", "description"],
        additionalProperties: false,
      },
    },
  },
  required: [
    "architecture_summary",
    "screens",
    "entity_schema",
    "complexity_score",
    "effort_estimate_hours",
    "risk_flags",
  ],
  additionalProperties: false,
};

// Adapter guidance for .NET WinForms (spec §4.3) — what to look for and
// what to watch out for, given to the agent as exploration context.
export const WINFORMS_ADAPTER_CONTEXT = `
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

Work through these passes, in order, using the read_file and list_directory
tools:
1. UI layer pass — identify each screen/form, what it displays, what user
   actions it handles.
2. Business logic pass — for each UI action, trace what it actually does:
   validation, calculations, workflows.
3. Data access pass — find every place the app talks to a database:
   connection strings, raw SQL, stored procedure calls; reconstruct the
   schema (tables, columns, relationships) from this.
4. Dependency pass — external libraries, OS-specific calls, anything with
   no obvious web equivalent.
5. Risk flagging — explicitly flag anything you're not confident about
   rather than silently guessing, plus the known quirks above.

Once you've explored enough to answer confidently, respond with the final
structured report. Do not guess at file contents you haven't actually read.
`.trim();
