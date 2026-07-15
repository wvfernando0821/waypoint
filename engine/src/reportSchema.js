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
