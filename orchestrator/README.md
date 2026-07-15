# Waypoint orchestrator — M3/M4 proof-of-concept

Node API + Postgres + BullMQ/Redis wrapping `engine/` (M1/M2) as an async,
queued job, with real zip/Git upload and adapter detection at upload time
(M4). No account mapping/build/deploy yet — see `../ROADMAP.md` for M6+.

Postgres and Redis run on the AWS dev box (`../infra/dev-box/`), reached
through an SSH tunnel — nothing is installed locally.

## Setup

1. Start the dev box and open the tunnel (see `../infra/dev-box/README.md`):
   ```
   cd ../infra/dev-box
   aws ec2 start-instances --instance-ids $(terraform output -raw instance_id)
   $(terraform output -raw ssh_tunnel_command)   # keep this terminal open
   ```
2. Back in `orchestrator/`:
   ```
   cp .env.example .env
   ```
   Set `DATABASE_URL` (get the password: `terraform output -raw database_url` in
   `../infra/dev-box`) and `ANTHROPIC_API_KEY` in `.env`.
3. From the **repo root** (npm workspaces): `npm install`
4. Apply the schema: `npm run migrate` (in `orchestrator/`) — safe to re-run,
   including against the M3 database (the `source_path` NOT NULL relaxation
   for M4 is applied idempotently)
5. Start the server: `npm start` (in `orchestrator/`)

## Uploading a project

`POST /projects` is always `multipart/form-data`: `name` plus **exactly
one** of:

| Field | What it does |
|---|---|
| `archive` | A `.zip` file — extracted into `storage/<project-id>/` |
| `gitUrl` | An `https://` Git URL — shallow-cloned into `storage/<project-id>/` |
| `sourcePath` | **Dev-only.** An absolute path already on the orchestrator's own disk, used as-is (nothing copied). Handy for re-running `engine/test-fixtures/*` without zipping them. |

Detection (spec §3 phase 1) runs immediately as part of this request —
the response already has `source_type` set if a known adapter matched, or
`status: "detection_failed"` if none did.

```bash
# Zip upload
cd ../engine/test-fixtures && zip -r /tmp/winforms.zip sample-winforms-app
curl -X POST localhost:3000/projects -F "name=Sample WinForms" -F "archive=@/tmp/winforms.zip"

# Git URL
curl -X POST localhost:3000/projects -F "name=Some repo" -F "gitUrl=https://github.com/owner/repo"

# Dev-only shortcut
curl -X POST localhost:3000/projects \
  -F "name=Sample VB6" \
  -F "sourcePath=$(cd ../engine/test-fixtures/sample-vb6-app && pwd)"
```

## Try the full pipeline

```bash
# 1. Upload (see above) — note the returned project id
# 2. Kick off analysis (replace <project-id>)
curl -X POST localhost:3000/projects/<project-id>/analyze
# → { "id": "<job-id>", "phase": "analyze", "status": "queued", ... }

# 3. Watch it happen live (replace <project-id> and <job-id>)
curl -N localhost:3000/projects/<project-id>/jobs/<job-id>/events

# 4. Or just poll the project once you're done watching
curl localhost:3000/projects/<project-id>
```

Step 2 runs the same Haiku 4.5 call from M1/M2 (~$0.05–0.20) — now driven
through the queue instead of the CLI.

## What's deliberately not here yet

- **Per-file checkpointing** (spec §4.4): BullMQ gives job-level retry for
  free (a crashed job is retried whole), but resuming mid-analysis from the
  last completed file is a bigger feature, deferred — see `../ROADMAP.md` M3.
- **Retention/deletion policy** (spec §5): `storage/<project-id>/` holds
  whatever was uploaded, indefinitely. No cleanup job exists yet.
- **Zip-slip defense in depth**: extraction relies on `extract-zip`'s own
  path-confinement guarantees rather than an explicit check of our own
  (unlike `engine/src/fileTools.js`, which does check explicitly). Worth
  revisiting if this ever handles untrusted uploads at real stakes.
- **SSH/private Git repos**: `gitUrl` only accepts `https://` for now.
- **Separate worker process**: API and worker share one Node process here.
  Splitting them is a small change (same job handler, its own entrypoint),
  not a redesign — not needed until there's a reason to.
