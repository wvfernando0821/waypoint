# Waypoint orchestrator — M3 proof-of-concept

Node API + Postgres + BullMQ/Redis wrapping `engine/` (M1/M2) as an async,
queued job. No upload handling or account mapping yet — see `../ROADMAP.md`
for M4+.

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
4. Apply the schema: `npm run migrate` (in `orchestrator/`)
5. Start the server: `npm start` (in `orchestrator/`)

## Try it

Using the same WinForms fixture already validated in M1/M2:

```bash
# 1. Create a project (sourcePath stands in for a real upload — that's M4)
curl -X POST localhost:3000/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Sample WinForms","sourcePath":"'"$(cd ../engine/test-fixtures/sample-winforms-app && pwd)"'"}'
# → { "id": "...", "name": "Sample WinForms", "source_type": null, ... }

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
- **Real upload handling**: `sourcePath` must already exist on disk where
  the orchestrator runs. Zip/Git-URL upload is M4.
- **Separate worker process**: API and worker share one Node process here.
  Splitting them is a small change (same job handler, its own entrypoint),
  not a redesign — not needed until there's a reason to.
