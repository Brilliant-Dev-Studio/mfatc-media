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
      await sql`CREATE INDEX IF NOT EXISTS submissions_created_at_idx ON submissions (created_at DESC)`;
    })().catch((e) => {
      ensured = null;
      throw e;
    });
  }
  return ensured;
}
