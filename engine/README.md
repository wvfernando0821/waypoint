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
| `.NET WinForms` (`winforms.js`) | Validated end-to-end in M1 | `.csproj` or `.vbproj` present |
| `VB6` (`vb6.js`) | Stub — detection only, prompt context unvalidated | `.vbp`, `.frm`, or `.bas` present |
| `Java Swing/NetBeans` (`javaSwing.js`) | Stub — detection only, prompt context unvalidated | `.form` present, or `.java` + a build file |

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

You can also point it at `test-fixtures/sample-vb6-app` or
`test-fixtures/sample-java-swing-app` to exercise the stub adapters
end-to-end, but that's optional — it costs API credits and isn't required
to consider M2 done (detection being correct is the acceptance bar; stub
analysis quality hasn't been validated yet).

## What "done" looks like

Per `../ROADMAP.md` M1: the report should have a real screen inventory,
complexity score, effort estimate, and a risk-flag list a human reviewer
would find genuinely useful. The bundled `test-fixtures/sample-winforms-app`
has two deliberate risks planted for this check:

- `Data/CustomerRepository.cs` — `FindCustomerIdByLastName` builds its SQL
  query via string concatenation (SQL injection risk)
- `BillingForm.cs` — `btnCharge_Click` swallows any exception from
  `RecordPayment` silently (a failed payment write is dropped with no log
  and no user-visible error)

If the risk_flags list in the output doesn't catch both of these, the
analysis prompt/approach needs work before M1 is actually done.
