import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

export const sql = neon(connectionString);

let ensured: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!ensured) {
    ensured = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS submissions (
          id              TEXT PRIMARY KEY,
          created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          name            TEXT NOT NULL,
          father_name     TEXT NOT NULL DEFAULT '',
          mother_name     TEXT NOT NULL DEFAULT '',
          stage_name      TEXT NOT NULL DEFAULT '',
          age             INTEGER NOT NULL,
          birthday        DATE NOT NULL,
          about_yourself  TEXT NOT NULL,
          facebook_link   TEXT NOT NULL,
          viber_no        TEXT NOT NULL,
          nrc_front       TEXT NOT NULL,
          nrc_back        TEXT NOT NULL,
          portraits       JSONB NOT NULL,
          art_statement   TEXT NOT NULL,
          experience      JSONB NOT NULL
        )
      `;
      await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS father_name TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS mother_name TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS stage_name TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS address TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS phone_no TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS life_goal TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS admired_artist TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS can_complete BOOLEAN NOT NULL DEFAULT FALSE`;
      await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS family_approval BOOLEAN NOT NULL DEFAULT FALSE`;
      await sql`CREATE INDEX IF NOT EXISTS submissions_created_at_idx ON submissions (created_at DESC)`;
      await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS gender TEXT`;
      await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS batch_number INTEGER NOT NULL DEFAULT 1`;
      await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS is_selected BOOLEAN NOT NULL DEFAULT FALSE`;
      await sql`
        CREATE TABLE IF NOT EXISTS app_settings (
          key   TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `;
      await sql`INSERT INTO app_settings (key, value) VALUES ('current_batch', '1') ON CONFLICT DO NOTHING`;
    })().catch((e) => {
      ensured = null;
      throw e;
    });
  }
  return ensured;
}
