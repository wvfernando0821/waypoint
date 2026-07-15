# Waypoint engine — M1 proof-of-concept

Standalone CLI that runs the AI analysis engine (spec §4.4) against a legacy
codebase and produces a structured migration report + a plain-language
summary. No database, job queue, or UI yet — those are later milestones
(see `../ROADMAP.md`).

Currently supports **.NET WinForms** only (the adapter layer that makes this
pluggable across languages is M2).

## Setup

```
cd engine
npm install
cp .env.example .env
```

Edit `.env` and set `ANTHROPIC_API_KEY` to your own key (get one at
[console.anthropic.com](https://console.anthropic.com) → API Keys). `.env`
is git-ignored — never commit it.

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
