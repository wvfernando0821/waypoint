import Anthropic from "@anthropic-ai/sdk";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
// betaZodTool's internal JSON-schema conversion needs zod v4-shaped schemas
// (the "zod" package at 3.25+ still exports the classic v3 API by default).
import { z } from "zod/v4";
import { listDirectory, readFile } from "./fileTools.js";
import { REPORT_JSON_SCHEMA } from "./reportSchema.js";

// claude-haiku-4-5 for now (cheap iteration while API credits are limited) —
// switch to claude-opus-4-8 before actually judging risk-flagging quality
// against M1's "done" criteria (see ../ROADMAP.md and README.md).
const MODEL = "claude-haiku-4-5";

/**
 * Spec §4.4 Steps 2-4: agentic exploration (UI / business logic / data
 * access / dependency passes) + risk flagging, ending in a structured
 * report constrained to REPORT_JSON_SCHEMA. `inventory` is the Step 1
 * structural-pass output, given to the agent as a starting map instead of
 * dumping the whole tree into the prompt. `adapter` is the matched
 * language adapter (see adapters/index.js) — its promptContext carries
 * the language-specific detection signatures, quirks, and pass checklist.
 */
export async function analyze(rootDir, inventory, adapter) {
  const client = new Anthropic();

  const listDirectoryTool = betaZodTool({
    name: "list_directory",
    description:
      "List the files and subdirectories directly inside a directory of the project, relative to the project root.",
    inputSchema: z.object({
      path: z.string().describe('Directory path relative to the project root. Use "." for the root.'),
    }),
    run: async ({ path: relativePath }) => {
      const entries = await listDirectory(rootDir, relativePath);
      return JSON.stringify(entries);
    },
  });

  const readFileTool = betaZodTool({
    name: "read_file",
    description: "Read the full text contents of a single file, given its path relative to the project root.",
    inputSchema: z.object({
      path: z.string().describe("File path relative to the project root."),
    }),
    run: async ({ path: relativePath }) => readFile(rootDir, relativePath),
  });

  const systemPrompt = [
    adapter.promptContext,
    "",
    "File inventory (from a deterministic pre-pass, not yet read):",
    JSON.stringify(inventory.files, null, 2),
  ].join("\n");

  const finalMessage = await client.beta.messages.toolRunner({
    model: MODEL,
    max_tokens: 16000,
    // claude-haiku-4-5 doesn't support adaptive thinking — re-add
    // `thinking: { type: "adaptive" }` when MODEL is switched to opus-4-8.
    system: systemPrompt,
    tools: [listDirectoryTool, readFileTool],
    output_config: { format: { type: "json_schema", schema: REPORT_JSON_SCHEMA } },
    messages: [
      {
        role: "user",
        content:
          "Analyze this application following the passes described in your instructions, then produce the final migration report.",
      },
    ],
  });

  const textBlock = finalMessage.content.find((block) => block.type === "text");
  if (!textBlock) {
    throw new Error("Analysis finished without a final text response — check stop_reason: " + finalMessage.stop_reason);
  }
  return JSON.parse(textBlock.text);
}
