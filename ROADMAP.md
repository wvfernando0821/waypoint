# Waypoint — Build Roadmap

Turns `legacy-migration-platform-spec.md` (v0.3) into an ordered sequence of buildable milestones. Each milestone is scoped to be independently demoable. The sequence is deliberately risk-first: per the spec's own framing (§4.4 — "highest-risk, highest-value component"), the AI analysis engine is validated in isolation *before* any infrastructure (DB, queue, Docker sandbox, Terraform) gets built around it.

## Milestone sequence

**M0 — Repo scaffolding**
- Monorepo layout: `/engine` (analysis engine + adapters), `/orchestrator` (Node API + queue, M3), `/frontend` (M5), `/infra` (Terraform modules, M8), `/docs`
- Root README pointing at the spec and this roadmap
- Spec ref: §4.1 (component boundaries)

**M1 — AI analysis engine proof-of-concept** *(first coding slice)*
- Goal: prove an agentic process can walk a real small legacy codebase and produce a usable structured migration report, standalone — no DB, no queue, no UI
- Scope: CLI (`analyze <path>`) using the Claude API (Anthropic SDK, tool-use agentic loop) implementing spec §4.4 Steps 1–4: structural pass (deterministic file walk) → agentic exploration (UI/business-logic/data-access/dependency passes) → risk flagging → structured JSON report matching the `migration_reports` shape in §4.2
- Test subject: one small real or representative sample .NET WinForms app (spec's own adapter build order — §7 — puts WinForms first as easiest to validate)
- Done when: report has a screen inventory, complexity score, effort estimate, and risk-flag list a human reviewer would find genuinely useful — not just structurally present
- Spec ref: §4.4, §4.2 (`migration_reports` table), §4.3 (WinForms adapter signatures/quirks table)

**M2 — Language adapter layer**
- Formalize the "matched adapter" concept (§4.3) as pluggable code: a detection function + extraction-rule prompt/context per source language
- Ship WinForms only; stub Java Swing and VB6 adapter interfaces so the plugin seam exists without full quirk-handling yet
- Spec ref: §4.3

**M3 — Orchestration backend skeleton**
- Node.js API + PostgreSQL (schema from §4.2) + BullMQ/Redis job queue
- Wraps M1's analysis engine as an async, resumable "analyze" job (pipeline phase 2, §3); checkpoint per file per spec's design note in §4.4
- REST endpoints for project create/upload/status; WebSocket or SSE for live job progress (§4.1)
- Spec ref: §4.1, §4.2, §4.4 design note (checkpointing)

**M4 — Upload & adapter detection (pipeline phase 1)**
- Zip/Git-URL upload handling, run M2's detection against the uploaded tree, create the `projects` record
- Spec ref: §3 (phase 1), §4.2 (`projects` table)

**M5 — Frontend wiring**
- Turn `migration-platform-ui-prototype.html` into a real React app talking to M3's API — same visual language and screens (dashboard, migration report, account mapping, staging review), swap `alert()` placeholders for real actions
- Fix the two prototype issues already found in review (nav active-state not restored after click; "Build and test" nav item pointing at the wrong view) as part of this rebuild
- Spec ref: §8

**M6 — Account mapping & secrets**
- AWS connection (IAM role or scoped keys), Git provider OAuth, Secrets Manager/Vault-backed storage — `cloud_connections` / `git_connections` tables store references only, never plaintext
- Gate: build/deploy phases stay locked in the UI until required connections exist (§8)
- Spec ref: §3 (phase 3), §4.1 (secrets management), §4.2, §5 (checklist items on secrets)

**M7 — Build/generation sandbox**
- Per-project isolated Docker container; AI generates backend + frontend + Dockerfiles + Terraform; run generated tests inside the sandbox before anything leaves it
- Spec ref: §3 (phase 4), §4.1 (build/generation sandbox)

**M8 — Cloud provisioning + deploy**
- Terraform modules (templated, AI fills parameters — not free-form AI infra), Jenkins pipeline for apply/deploy, staging environment as a mandatory gate
- Spec ref: §4.1 (cloud provisioning layer), §5 (staging mandatory, audit log)

**M9 — Approval gate & production deploy**
- Staging review screen (partially mocked in M5) wired to real staging URL + test results; explicit approve/reject; on approve, Terraform apply to prod + Jenkins deploy + DNS, tied to the approving human in the audit log
- Spec ref: §3 (phases 5–6), §8 (approval screen design principle), §5

**Cross-cutting, addressed incrementally per milestone (not a final phase):**
- Security checklist (§5): Docker isolation, retention/deletion policy, least-privilege IAM — apply at the milestone that introduces the relevant component
- Cost guardrails, monitoring/observability, RBAC, notifications (§9) — fold into M7–M9 as those components are built
- Open questions (§10) that block specific milestones: "editable/hand-off format" affects M7; data-privacy-for-minors handling affects M6/M7 if a real client's data is involved

## Verification

Each milestone's "done when" line above is the acceptance check. For M1 specifically: run the CLI against the chosen sample WinForms app and manually review the JSON report against the `migration_reports` schema fields, then read the risk-flag list and confirm it would actually help a human reviewer, not just satisfy the shape.
