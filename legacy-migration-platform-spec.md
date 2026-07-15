# Waypoint — legacy application migration platform: technical specification

**Version:** 0.3 (planning draft)
**Prepared for:** GLCAC IT / independent product concept
**Scope of this draft:** MVP = legacy desktop app (.NET WinForms, VB6, or Java Swing/NetBeans) → web app. Android/iOS come after MVP validates. Architecture is designed to be language-agnostic long-term via a pluggable adapter pattern (see section 4.3).

---

## 1. Vision

**Waypoint** is a platform where a user uploads a legacy desktop application's source code, the platform's AI analyzes the front end, back end, and database, and produces a modernized, cloud-deployed application — provisioned on AWS via Terraform, deployed through Jenkins, with security hardening applied by default. Long-term, the same pipeline should also be able to target Android and iOS, not just web.

## 2. Guiding principles

- **AI-assisted, not AI-autonomous.** The AI drafts, analyzes, and generates; a human approves before anything touches production or an app store. This is the single most important change from the original all-automatic concept — it protects users from bad deploys and protects the product from app store rejections.
- **One output path for MVP, a small set of input languages.** Prove the pipeline end-to-end on Legacy desktop → Web before adding Android/iOS. The platform should be architected so new source languages are a plugin, not a rewrite — but the first release still ships with only a few languages actually supported, so each one gets tested properly instead of all being shallow.
- **Every phase is resumable and inspectable.** Long-running AI analysis and builds must survive a browser refresh, a crashed job, or a client wanting to review output mid-way.
- **Credentials are the crown jewels.** AWS keys, Git tokens, and (later) app store keys pass through this platform. Secrets handling gets first-class engineering attention, not an afterthought.

## 3. High-level pipeline (MVP)

| # | Phase | What happens | Output |
|---|-------|--------------|--------|
| 1 | Upload and scan | User uploads the legacy codebase (zip or Git repo link). Platform detects the source language/framework and routes the project to the matching adapter (.NET WinForms, VB6, or Java Swing for MVP). | Project record, file inventory, detected adapter |
| 2 | AI analysis | An agentic analysis process explores the codebase: UI structure, business logic, data access layer, database schema, third-party dependencies, hardcoded config, security red flags. | Migration report (architecture summary, complexity score, risk flags, effort estimate) |
| 3 | Account mapping | User connects/authorizes: AWS account (via IAM role or scoped access keys), Git provider (for the generated repo), and later, app store developer accounts. | Stored, encrypted connection profiles |
| 4 | Build and test | AI generates the new application (backend API + web frontend), provisions infrastructure-as-code, runs automated tests in an isolated sandbox, deploys to a staging environment. | Staging URL, test report, generated code diff |
| 5 | Human approval gate | User reviews the staging app and the AI-generated migration report side by side with the original. Approves or requests changes. | Go/no-go decision |
| 6 | Deploy | On approval: Terraform applies production infra, Jenkins pipeline deploys the app, DNS/URL is provisioned. | Live production URL |

This matches the two rendered diagrams above — the pipeline flow and the system architecture.

## 4. System architecture

### 4.1 Core components

**Orchestration layer (Node.js)**
- REST/GraphQL API for the frontend UI
- Job queue (BullMQ + Redis) — every phase above is a queued, resumable job, not a synchronous request. Analysis and builds can take minutes to hours.
- Job status/event stream (WebSocket or SSE) so the UI can show live progress per phase

**AI analysis engine**
- Agentic code-exploration process (similar pattern to an AI coding agent): walks the file tree, reads source files, maps UI components to business logic to data access, extracts DB schema (from SQL files, ORM models, or connection strings + live introspection if a DB dump is provided)
- Produces a structured migration report (JSON) that both the platform and the human reviewer consume
- Runs in an isolated environment — the legacy code should never touch the orchestrator's own filesystem or credentials

**Build/generation sandbox**
- Isolated Docker container per project/job — no shared state between clients
- Generates: backend API (Node.js/Express, matching your existing stack), frontend (React), Dockerfiles, Terraform modules
- Runs generated automated tests inside the sandbox before anything leaves it

**Cloud provisioning layer**
- Terraform modules, templated per target (a "web app module" with VPC, EC2 or ECS, RDS, ALB, Route53) rather than fully free-form AI-generated infra config. Template-first, AI fills in parameters — this bounds the blast radius of a bad AI output.
- Jenkins pipeline triggers the actual apply/deploy steps, so there's an audit trail separate from the AI

**Secrets management**
- AWS Secrets Manager or HashiCorp Vault — never plaintext in the database
- Per-client/per-project isolation of credentials
- Short-lived, scoped credentials where possible (e.g., IAM roles with a trust policy scoped to that client's resources, instead of long-lived access keys)

**Data store**
- PostgreSQL for platform metadata: projects, jobs, migration reports, credential references (pointers to the secrets manager, not the secrets themselves), deployment history

### 4.2 Suggested database schema (starting point)

```
projects
  id, owner_id, name, source_type (netbeans_java | dotnet_winforms), status, created_at

migration_jobs
  id, project_id, phase (upload | analyze | map | build | test | deploy),
  status (queued | running | needs_review | approved | failed | done),
  started_at, completed_at

migration_reports
  id, job_id, architecture_summary (jsonb), complexity_score,
  risk_flags (jsonb), effort_estimate_hours

cloud_connections
  id, project_id, provider (aws), secret_ref, region, created_at

git_connections
  id, project_id, provider (github|gitlab), secret_ref, repo_url

deployments
  id, project_id, environment (staging|production), target (web),
  url, deployed_at, approved_by
```

### 4.3 Language adapter layer

The core pipeline (orchestration, account mapping, build sandbox, deploy, approval gate) is language-agnostic and does not change based on what source language comes in. What changes is a pluggable **adapter** per source technology, so new languages can be added later without redesigning the platform.

Each adapter is responsible for:
- **Detection** — recognizing project structure/file signatures (e.g. `.vbp`/`.frm` for VB6, `.sln`/`.csproj` + `System.Windows.Forms` references for .NET WinForms, `.form`/NetBeans project metadata or `javax.swing` imports for Java Swing)
- **Structural extraction rules** — where UI event handlers live, how forms/screens are defined, common patterns for database connections in that ecosystem (ADO/DAO for VB6, ADO.NET/Entity Framework for .NET, JDBC for Java)
- **Known quirks/gotchas** — things specific to that stack the AI should watch for (e.g. VB6's implicit variant typing and `On Error Resume Next` swallowing errors silently; WinForms designer-generated code mixed with hand-written code; Swing's listener-heavy event model)

MVP adapters:

| Adapter | Typical signatures | Known challenges |
|---|---|---|
| .NET WinForms | `.csproj`/`.vbproj`, `System.Windows.Forms`, `.Designer.cs` | Designer-generated code vs. hand-written code separation; ADO.NET direct SQL is common |
| VB6 | `.vbp`, `.frm`, `.bas`, `.cls` | Oldest/riskiest target — no modern tooling, implicit error handling, COM dependencies (e.g. Crystal Reports, third-party OCX controls) are common blockers |
| Java Swing / NetBeans | `.form` (NetBeans GUI builder), `javax.swing.*` imports, `build.xml` or Maven/Gradle | Business logic frequently embedded directly in UI event listener classes rather than separated |

The AI analysis engine (below) uses the matched adapter's extraction rules as context, rather than trying to understand every language from scratch on every run.

### 4.4 AI analysis engine — detailed flow

This is the highest-risk, highest-value component, so it deserves its own breakdown.

**Step 1 — Structural pass (cheap, deterministic, not AI).** Before any LLM calls, run static tooling: walk the file tree, count files by extension, parse manifest/project files (`.csproj`, `.vbp`, NetBeans `project.xml`) to get an initial inventory. This gives the AI a map to work from instead of dumping the entire codebase into a prompt.

**Step 2 — Agentic exploration (AI-driven).** Using the matched adapter's rules as guidance, an agent-style process (tool-calling LLM, similar pattern to an AI coding assistant) works through the codebase in passes:
- *UI layer pass* — identify screens/forms, what each one displays, what user actions it handles
- *Business logic pass* — trace what each UI action actually does: validation rules, calculations, workflows
- *Data access pass* — find every place the app talks to a database: connection strings, raw SQL, stored procedure calls, ORM usage; reconstruct the schema (tables, columns, relationships) from this plus any `.sql` files or DB backups if provided
- *Dependency pass* — external libraries, OS-specific calls (file system paths, registry access, COM objects), anything that has no direct web equivalent and will need a design decision

**Step 3 — Risk flagging.** The agent explicitly flags anything it's not confident about, rather than silently guessing: ambiguous business rules, error handling that hides failures (common in VB6), undocumented "magic" logic, third-party dependencies with no modern equivalent. This list is what a human reviewer should look at first.

**Step 4 — Structured report generation.** Output is a structured JSON report (matching the `migration_reports` table) containing: architecture summary, entity/schema map, screen-by-screen inventory, complexity score, effort estimate, and the risk flag list. This report is what both the platform's build step and the human reviewer consume — not free-form prose.

**Step 5 — Human-readable summary.** A separate, shorter natural-language summary is generated from the structured report specifically for the client to read in the UI, since the full structured report is dense and technical.

**Design note:** Steps 1 and 2 should be cached/checkpointed per file, since re-analyzing an entire large legacy codebase from scratch on every retry is slow and expensive. If step 2 fails partway, resume from the last completed file/module rather than restarting.

## 5. Security checklist

- [ ] All credentials stored via secrets manager, referenced by ID only in the app database
- [ ] Per-project Docker isolation for both analysis and build phases
- [ ] Legacy code never persisted longer than needed; define a retention/deletion policy
- [ ] Clear data-handling disclosure to clients if legacy code is sent to a third-party LLM API for analysis; consider a private/on-prem model option for enterprise clients with sensitive codebases
- [ ] IAM roles scoped to least privilege per client, not one shared AWS credential for the whole platform
- [ ] Staging environment is mandatory before production — no direct-to-production deploys
- [ ] Audit log of every Terraform apply and Jenkins deploy, tied to the human who approved it

## 6. Why "auto-deploy, zero human check" was adjusted

The original idea was: analyze → build → if no errors, deploy straight to Play Store/App Store/web. Two problems with that as stated:

1. **AI-generated migrations will have gaps**, even when tests pass — legacy business logic often has undocumented edge cases that only show up as behavioral differences, not test failures. A staging review step catches what automated tests miss.
2. **App stores require human review on their end regardless.** Google Play and Apple App Store both have their own review process (Apple's especially can reject for policy reasons unrelated to bugs). So "auto-deploy" to app stores isn't fully achievable even if you wanted it — the platform can automate the *submission*, not the *approval*.

Web deployment is the one target where near-full automation is realistic, which is another reason it's the right MVP scope.

## 7. Roadmap

**Phase 1 — MVP (this spec's focus)**
- Input: three adapters — .NET WinForms, VB6, and Java Swing/NetBeans
- Recommend building and validating the .NET WinForms adapter first (most modern tooling, easiest to isolate business logic), then Java Swing, then VB6 last (oldest ecosystem, most likely to hit COM/third-party control blockers)
- Output: web app only
- Manual approval gate before deploy
- Core pipeline: upload → detect adapter → analyze → map accounts → build/test → approve → deploy

**Phase 2 — Harden and expand input types**
- Refine all three MVP adapters based on real migration attempts
- Add further adapters as demand justifies (e.g. Delphi, PowerBuilder, older Python desktop apps) using the same adapter pattern

**Phase 3 — Add Android**
- Integrate Google Play Developer API for automated submission (post human approval)
- Mobile-specific build target in the generation layer (React Native, aligned with your existing React experience)

**Phase 4 — Add iOS**
- Integrate App Store Connect API (JWT-based, not password-based auth)
- Budget extra time for Apple's review cycle in client expectations

**Phase 5 — Platform hardening**
- Multi-tenant scaling, usage-based billing, client dashboard, SOC2-style compliance work if targeting enterprise clients

## 8. UI/UX design

Core screens follow the pipeline phases directly, so the interface never surprises the user with a step they didn't know was coming.

**Project dashboard** — a horizontal stepper across the top (Upload → Analyze → Map accounts → Build/test → Deploy) with the current phase highlighted, so the user always knows where they are. Below it, a summary card for whatever phase just completed (e.g. after analysis: screens found, tables mapped, risk flag count) with a clear next action.

**Migration report (detail view)** — reached from "View full report" on the dashboard. Shows the full risk flag list, color-coded by severity (high/medium/low), each tied to a specific file so the user or their developer can go verify it directly. A screen-by-screen inventory below that. Two exits: drill into a specific risk flag, or proceed to the next phase.

**Account mapping** — simple connect/connected list (AWS, Git, later app store accounts), gated: build and deploy phases stay locked until required connections are made.

**Approval/staging review** (not yet mocked up) — this is the most important screen in the whole product, since it's the human gate before production. It needs: the staging URL to click through and test live, a summary of what the AI generated vs. what it flagged as uncertain, and an explicit approve/reject action — not just an implicit "looks fine, close the tab."

**Design principle carried through all screens:** never let the interface imply full automation happened when a human hasn't looked at it yet. Status labels should say "needs review" rather than "complete" until a human has actually signed off.

**Clickable prototype:** `migration-platform-ui-prototype.html` (delivered alongside this document) is a static HTML/CSS/JS mockup covering all four screens above — dashboard, migration report, account mapping, and staging review — navigable via the left sidebar. It uses a generic example project (a fictional clinic's VB6 patient records system) rather than a real GLCAC system, so it stays usable as a general demo. Open it directly in a browser. It uses placeholder data and `alert()` calls in place of real actions, but the layout, states, and information hierarchy are meant to be a real starting point for a frontend build, not just a reference image.

## 9. Gaps and additional considerations

A few things came up while designing the pipeline and screens that the spec didn't originally cover. Worth deciding on before building starts.

**Error handling and retries.** What happens when the AI analysis phase fails partway through a large codebase, or a Terraform apply fails halfway? Section 4.4 already calls for checkpointing analysis per file — the same needs to apply to build and deploy: know exactly what succeeded before a failure, and let the user resume rather than restart from zero.

**Rollback and versioning.** If a production deploy introduces a regression the staging review missed, there needs to be a fast path back to the previous working version — not just "redo the whole migration." Keep the previous deployment's infrastructure state and build artifact until the new one is confirmed stable.

**Data privacy compliance.** Given the GLCAC context specifically — school systems often hold data on minors. If any legacy system being migrated touches student records, this platform needs to handle that data in line with the Philippine Data Privacy Act, on top of the general secrets/code-handling concerns in section 5. Worth flagging explicitly per project at intake time ("does this system handle personal data of minors?") so the platform can apply stricter handling automatically.

**Monitoring and observability.** Once an app is deployed, the platform's job isn't done — clients will expect to know if their newly migrated app goes down. A lightweight monitoring stack (e.g. the Prometheus/Grafana pattern already familiar from your AWS work) per deployed project, or at minimum uptime alerting, should be part of the deploy phase output, not a separate ask later.

**Cost guardrails.** AI-generated Terraform provisioning real AWS infrastructure on a client's account is a place where a mistake gets expensive fast. Consider a cost estimate shown before the human approval gate, and budget alarms (AWS Budgets) set up automatically as part of provisioning.

**Multi-tenancy and access control.** Once more than one client or more than one internal user touches the platform, role-based access becomes necessary — who can approve a production deploy, who can only view reports, who owns which project's credentials. Worth designing the data model for this early (even if enforcement comes later) since retrofitting access control into an existing schema is painful.

**Notifications.** Long-running phases (analysis, build) mean the user won't sit and watch. Email or similar notification when a phase completes or needs review avoids the platform feeling like it stalled.

## 10. Open questions to resolve before building

- Which LLM/AI provider for the analysis engine, and what's the data handling agreement for client code sent to it?
- Pricing model — per-migration flat fee, subscription, or usage-based on AWS spend?
- Target first customer — will GLCAC's own legacy tools be the first real test case, or an external client?
- How much of the generated code should be editable by the client's own developers post-migration, and in what format is it handed over (Git repo access, zip export)?
