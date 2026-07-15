import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-4-8";

/**
 * Spec §4.4 Step 5: a separate, shorter natural-language summary generated
 * from the structured report, for a non-technical reviewer to read. Kept as
 * its own unconstrained call since the structured-report call (analyze.js)
 * is schema-locked and can't also carry free prose.
 */
export async function summarize(report) {
  const client = new Anthropic();

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    system:
      "You write short, plain-language migration-report summaries for a non-technical client reviewer. No jargon, no code, no headers — 3 to 5 sentences.",
    messages: [
      {
        role: "user",
        content: `Summarize this migration report for the client:\n\n${JSON.stringify(report, null, 2)}`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  return textBlock ? textBlock.text : "";
}
