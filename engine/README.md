# Waypoint engine — M1/M2 proof-of-concept

Standalone CLI that runs the AI analysis engine (spec §4.4) against a legacy
codebase and produces a structured migration report + a plain-language
summary. No database, job queue, or UI yet — those are later milestones
(see `../ROADMAP.md`).

## Adapters

`src/adapters/` (M2) detects the source language from the file inventory and
supplies language-specific prompt context to the analysis engine:

| Adapter | Status | Detection |
|---|---|---|
| `.NET WinForms` (`winforms.js`) | Validated end-to-end against the full CRUD fixture | `.csproj` or `.vbproj` present |
| `VB6` (`vb6.js`) | Validated end-to-end against the full CRUD fixture | `.vbp`, `.frm`, or `.bas` present |
| `Java Swing/NetBeans` (`javaSwing.js`) | Validated end-to-end against the full CRUD fixture | `.form` present, or `.java` + a build file |

`npm test` checks each bundled fixture detects as the right adapter — see
`src/adapters/adapters.test.js`.

## Setup

```
cd engine
npm install
cp .env.example .env
```

Edit `.env` and set `ANTHROPIC_API_KEY` to your own key (get one at
[console.anthropic.com](https://console.anthropic.com) → API Keys). `.env`
is git-ignored — never commit it. The API is pay-as-you-go (no standing free
tier) — you'll need a payment method or prepaid credits on the account.

**Current model: `claude-haiku-4-5`** (temporary, for cheap iteration while
credits are limited). `analyze.js` and `summarize.js` each have a `MODEL`
constant with a comment marking this — switch both to `claude-opus-4-8`
before actually judging risk-flagging quality against the "done" criteria
below; Haiku is fine for confirming the plumbing works, not for the real
quality bar.

## Run

```
npm run analyze -- test-fixtures/sample-winforms-app
```

This writes `migration-report.json` (the structured report) to the current
directory and prints a short human-readable summary to the terminal.

Optional output path:

```
npm run analyze -- test-fixtures/sample-winforms-app --out my-report.json
```

Same works for `test-fixtures/sample-vb6-app` and
`test-fixtures/sample-java-swing-app` — all three fixtures are now full
CRUD apps (Create/Read/Update/Delete on a `Customer` entity, plus the
original billing/lookup screen each started with) and all three adapters
have been run end-to-end.

## What "done" looks like

Per `../ROADMAP.md` M1: the report should have a real screen inventory,
complexity score, effort estimate, and a risk-flag list a human reviewer
would find genuinely useful. Each fixture has two deliberate risks planted:

- **WinForms**: `Data/CustomerRepository.cs`'s `FindCustomerIdByLastName`
  (SQL injection via string concatenation); `BillingForm.cs`'s
  `btnCharge_Click` (swallowed exception on a failed payment write)
- **VB6**: `Module1.bas`'s `FindCustomerId` (SQL injection via string
  concatenation); `Form1.frm`'s `cmdSearch_Click` (`On Error Resume Next`
  hiding the failure)
- **Java Swing**: `MainForm.java`'s `onSearch` (SQL injection via string
  concatenation; also a swallowed `SQLException`)

All three were caught correctly on the CRUD-sized fixtures with Haiku 4.5,
with no hallucinated screens/fields — except one WinForms run that came
back with hallucinated fields and missed both risks, then was correct again
on retry. Worth knowing: Haiku's output isn't perfectly consistent
run-to-run on a larger (~11 file) fixture. If you see a report that looks
wrong, retry once before assuming the adapter's prompt needs work — and
switch to `claude-opus-4-8` (see the model note above) if you need
consistent quality rather than cheap iteration.
