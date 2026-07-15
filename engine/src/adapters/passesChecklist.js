// Shared across all adapters (spec §4.4 Step 2-3) — the exploration
// methodology itself doesn't vary by source language, only the
// language-specific quirks each adapter prepends before this.
export const EXPLORATION_PASSES_CHECKLIST = `
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
