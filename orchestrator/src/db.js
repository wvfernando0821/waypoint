import pg from "pg";

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export async function createProject({ name, sourcePath }) {
  const { rows } = await pool.query(
    `INSERT INTO projects (name, source_path, status)
     VALUES ($1, $2, 'created')
     RETURNING id, name, source_type, source_path, status, created_at`,
    [name, sourcePath],
  );
  return rows[0];
}

export async function getProject(id) {
  const { rows } = await pool.query(`SELECT * FROM projects WHERE id = $1`, [id]);
  return rows[0] || null;
}

export async function updateProjectSourceType(projectId, sourceType) {
  await pool.query(`UPDATE projects SET source_type = $1 WHERE id = $2`, [sourceType, projectId]);
}

export async function createJob({ projectId, phase }) {
  const { rows } = await pool.query(
    `INSERT INTO migration_jobs (project_id, phase, status)
     VALUES ($1, $2, 'queued')
     RETURNING *`,
    [projectId, phase],
  );
  return rows[0];
}

export async function updateJob(id, fields) {
  const sets = [];
  const values = [];
  let i = 1;
  for (const [key, value] of Object.entries(fields)) {
    sets.push(`${key} = $${i}`);
    values.push(value);
    i += 1;
  }
  values.push(id);
  const { rows } = await pool.query(
    `UPDATE migration_jobs SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
    values,
  );
  return rows[0];
}

export async function getJob(id) {
  const { rows } = await pool.query(`SELECT * FROM migration_jobs WHERE id = $1`, [id]);
  return rows[0] || null;
}

export async function getLatestJobForProject(projectId) {
  const { rows } = await pool.query(
    `SELECT * FROM migration_jobs WHERE project_id = $1 ORDER BY started_at DESC NULLS LAST LIMIT 1`,
    [projectId],
  );
  return rows[0] || null;
}

export async function saveReport({ jobId, report }) {
  const { rows } = await pool.query(
    `INSERT INTO migration_reports (job_id, architecture_summary, complexity_score, risk_flags, effort_estimate_hours)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      jobId,
      JSON.stringify({
        summary: report.architecture_summary,
        screens: report.screens,
        entity_schema: report.entity_schema,
      }),
      report.complexity_score,
      JSON.stringify(report.risk_flags),
      report.effort_estimate_hours,
    ],
  );
  return rows[0];
}

/** Reconstructs the engine's original report shape from the DB row. */
export async function getReportForJob(jobId) {
  const { rows } = await pool.query(`SELECT * FROM migration_reports WHERE job_id = $1`, [jobId]);
  const row = rows[0];
  if (!row) return null;
  return {
    architecture_summary: row.architecture_summary.summary,
    screens: row.architecture_summary.screens,
    entity_schema: row.architecture_summary.entity_schema,
    complexity_score: row.complexity_score,
    risk_flags: row.risk_flags,
    effort_estimate_hours: row.effort_estimate_hours,
  };
}
