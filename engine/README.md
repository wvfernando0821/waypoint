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
