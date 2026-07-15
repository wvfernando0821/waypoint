import Anthropic from "@anthropic-ai/sdk";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { listDirectory, readFile } from "./fileTools.js";
import { REPORT_JSON_SCHEMA, WINFORMS_ADAPTER_CONTEXT } from "./reportSchema.js";

const MODEL = "claude-opus-4-8";

/**
 * Spec §4.4 Steps 2-4: agentic exploration (UI / business logic / data
 * access / dependency passes) + risk flagging, ending in a structured
 * report constrained to REPORT_JSON_SCHEMA. `inventory` is the Step 1
 * structural-pass output, given to the agent as a starting map instead of
 * dumping the whole tree into the prompt.
 */
export async function analyze(rootDir, inventory) {
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
    WINFORMS_ADAPTER_CONTEXT,
    "",
    "File inventory (from a deterministic pre-pass, not yet read):",
    JSON.stringify(inventory.files, null, 2),
  ].join("\n");

  const finalMessage = await client.beta.messages.toolRunner({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
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
