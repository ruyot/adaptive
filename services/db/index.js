const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS repository_analyses (
      id SERIAL PRIMARY KEY,
      owner TEXT NOT NULL,
      repo TEXT NOT NULL,
      branch TEXT NOT NULL DEFAULT 'main',
      commit_sha TEXT NOT NULL,
      analysis JSONB NOT NULL,
      analyzed_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(owner, repo, branch, commit_sha)
    );
    CREATE INDEX IF NOT EXISTS idx_repo_key ON repository_analyses(owner, repo, branch);
    CREATE TABLE IF NOT EXISTS file_analyses (
      id SERIAL PRIMARY KEY,
      repo_owner TEXT NOT NULL,
      repo_name TEXT NOT NULL,
      branch TEXT NOT NULL DEFAULT 'main',
      commit_sha TEXT NOT NULL,
      path TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      preview TEXT,
      ai_analysis JSONB NOT NULL,
      analyzed_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(repo_owner, repo_name, branch, path, content_hash)
    );
    CREATE INDEX IF NOT EXISTS idx_file_lookup ON file_analyses(repo_owner, repo_name, branch, path);
  `);
  console.log("Database initialized");
}

module.exports = { pool, init };
