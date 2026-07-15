-- Waypoint orchestrator schema (M3) — only the tables this milestone
-- reads/writes, from spec §4.2. cloud_connections, git_connections, and
-- deployments are added later (M6, M9) when those milestones need them.

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID, -- no auth/users table yet; populated once multi-tenancy lands
  name TEXT NOT NULL,
  -- Nullable: detection (M4) runs after the project row exists, once the
  -- source has actually landed on disk (zip/git/dev sourcePath).
  source_type TEXT CHECK (source_type IN ('dotnet_winforms', 'vb6', 'java_swing')),
  source_path TEXT, -- set once ingestion (zip/git/dev sourcePath, M4) finishes
  status TEXT NOT NULL DEFAULT 'created',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- M4: source_path used to be required at creation time (M3 stand-in for
-- real upload); idempotent for pre-M4 databases that already have the
-- NOT NULL constraint, a no-op otherwise.
ALTER TABLE projects ALTER COLUMN source_path DROP NOT NULL;

CREATE TABLE IF NOT EXISTS migration_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('upload', 'analyze', 'map', 'build', 'test', 'deploy')),
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'needs_review', 'approved', 'failed', 'done')),
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS migration_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES migration_jobs(id) ON DELETE CASCADE,
  -- { summary, screens, entity_schema } — engine's report shape, nested
  -- under one jsonb column per spec's own typing of this field.
  architecture_summary JSONB NOT NULL,
  complexity_score INTEGER NOT NULL,
  risk_flags JSONB NOT NULL,
  effort_estimate_hours INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_migration_jobs_project_id ON migration_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_migration_reports_job_id ON migration_reports(job_id);
