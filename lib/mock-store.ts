import { ensureSchema, sql } from "./db";
import type { ExperienceEntry, Submission, SubmissionInput } from "./types";

export type ListField = "all" | "name" | "facebook" | "viber" | "art";

type Row = {
  id: string;
  created_at: string | Date;
  name: string;
  father_name: string;
  mother_name: string;
  stage_name: string;
  age: number;
  birthday: string | Date;
  address: string;
  about_yourself: string;
  facebook_link: string;
  phone_no: string;
  viber_no: string;
  life_goal: string;
  admired_artist: string;
  can_complete: boolean;
  family_approval: boolean;
  nrc_front: string;
  nrc_back: string;
  portraits: string[];
  gender: string | null;
  art_statement: string;
  experience: ExperienceEntry[];
  batch_number: number;
  is_selected: boolean;
};

function toIsoDate(v: string | Date): string {
  if (v instanceof Date) {
    const y = v.getUTCFullYear();
    const m = String(v.getUTCMonth() + 1).padStart(2, "0");
    const d = String(v.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return v.slice(0, 10);
}

function rowToSubmission(r: Row): Submission {
  return {
    id: r.id,
    createdAt: new Date(r.created_at).toISOString(),
    name: r.name,
    fatherName: r.father_name ?? "",
    motherName: r.mother_name ?? "",
    stageName: r.stage_name ?? "",
    age: r.age,
    birthday: toIsoDate(r.birthday),
    address: r.address ?? "",
    aboutYourself: r.about_yourself,
    facebookLink: r.facebook_link,
    phoneNo: r.phone_no ?? "",
    viberNo: r.viber_no,
    lifeGoal: r.life_goal ?? "",
    admiredArtist: r.admired_artist ?? "",
    canComplete: Boolean(r.can_complete),
    familyApproval: Boolean(r.family_approval),
    nrcFront: r.nrc_front,
    nrcBack: r.nrc_back,
    portraits: r.portraits,
    gender: (r.gender === "male" || r.gender === "female") ? r.gender : null,
    artStatement: r.art_statement,
    experience: r.experience,
    batchNumber: r.batch_number ?? 1,
    isSelected: Boolean(r.is_selected),
  };
}

export async function getCurrentBatch(): Promise<number> {
  await ensureSchema();
  const rows = (await sql`SELECT value FROM app_settings WHERE key = 'current_batch'`) as {
    value: string;
  }[];
  return Number(rows[0]?.value ?? 1);
}

export async function finishBatch(): Promise<number> {
  const current = await getCurrentBatch();
  const next = current + 1;
  await sql`UPDATE app_settings SET value = ${String(next)} WHERE key = 'current_batch'`;
  return next;
}

export async function setSelected(id: string, selected: boolean): Promise<boolean> {
  await ensureSchema();
  const rows = (await sql`
    UPDATE submissions SET is_selected = ${selected} WHERE id = ${id} RETURNING id
  `) as { id: string }[];
  return rows.length > 0;
}

async function searchRows(
  field: ListField,
  pattern: string,
  pageSize: number,
  offset: number,
  batchNumber: number,
  selectedOnly: boolean,
): Promise<{ items: Row[]; total: number }> {
  switch (field) {
    case "name": {
      const items = (await sql`
        SELECT * FROM submissions
        WHERE batch_number = ${batchNumber}
          AND (is_selected = TRUE OR NOT ${selectedOnly})
          AND LOWER(name) LIKE ${pattern}
        ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}
      `) as Row[];
      const t = (await sql`
        SELECT COUNT(*)::text AS count FROM submissions
        WHERE batch_number = ${batchNumber}
          AND (is_selected = TRUE OR NOT ${selectedOnly})
          AND LOWER(name) LIKE ${pattern}
      `) as { count: string }[];
      return { items, total: Number(t[0]?.count ?? 0) };
    }
    case "facebook": {
      const items = (await sql`
        SELECT * FROM submissions
        WHERE batch_number = ${batchNumber}
          AND (is_selected = TRUE OR NOT ${selectedOnly})
          AND LOWER(facebook_link) LIKE ${pattern}
        ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}
      `) as Row[];
      const t = (await sql`
        SELECT COUNT(*)::text AS count FROM submissions
        WHERE batch_number = ${batchNumber}
          AND (is_selected = TRUE OR NOT ${selectedOnly})
          AND LOWER(facebook_link) LIKE ${pattern}
      `) as { count: string }[];
      return { items, total: Number(t[0]?.count ?? 0) };
    }
    case "viber": {
      const items = (await sql`
        SELECT * FROM submissions
        WHERE batch_number = ${batchNumber}
          AND (is_selected = TRUE OR NOT ${selectedOnly})
          AND LOWER(viber_no) LIKE ${pattern}
        ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}
      `) as Row[];
      const t = (await sql`
        SELECT COUNT(*)::text AS count FROM submissions
        WHERE batch_number = ${batchNumber}
          AND (is_selected = TRUE OR NOT ${selectedOnly})
          AND LOWER(viber_no) LIKE ${pattern}
      `) as { count: string }[];
      return { items, total: Number(t[0]?.count ?? 0) };
    }
    case "art": {
      const items = (await sql`
        SELECT * FROM submissions
        WHERE batch_number = ${batchNumber}
          AND (is_selected = TRUE OR NOT ${selectedOnly})
          AND LOWER(art_statement || ' ' || about_yourself) LIKE ${pattern}
        ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}
      `) as Row[];
      const t = (await sql`
        SELECT COUNT(*)::text AS count FROM submissions
        WHERE batch_number = ${batchNumber}
          AND (is_selected = TRUE OR NOT ${selectedOnly})
          AND LOWER(art_statement || ' ' || about_yourself) LIKE ${pattern}
      `) as { count: string }[];
      return { items, total: Number(t[0]?.count ?? 0) };
    }
    case "all":
    default: {
      const items = (await sql`
        SELECT * FROM submissions
        WHERE batch_number = ${batchNumber}
          AND (is_selected = TRUE OR NOT ${selectedOnly})
          AND LOWER(name || ' ' || facebook_link || ' ' || viber_no || ' ' || art_statement || ' ' || about_yourself || ' ' || id) LIKE ${pattern}
        ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}
      `) as Row[];
      const t = (await sql`
        SELECT COUNT(*)::text AS count FROM submissions
        WHERE batch_number = ${batchNumber}
          AND (is_selected = TRUE OR NOT ${selectedOnly})
          AND LOWER(name || ' ' || facebook_link || ' ' || viber_no || ' ' || art_statement || ' ' || about_yourself || ' ' || id) LIKE ${pattern}
      `) as { count: string }[];
      return { items, total: Number(t[0]?.count ?? 0) };
    }
  }
}

export async function listSubmissions(opts: {
  page?: number;
  pageSize?: number;
  q?: string;
  field?: ListField;
  batchNumber?: number;
  selectedOnly?: boolean;
}) {
  await ensureSchema();

  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, opts.pageSize ?? 10));
  const q = (opts.q ?? "").trim();
  const field = opts.field ?? "all";
  const offset = (page - 1) * pageSize;
  const bn = opts.batchNumber ?? (await getCurrentBatch());
  const selectedOnly = opts.selectedOnly ?? false;

  let items: Row[];
  let total: number;

  if (q) {
    const pattern = `%${q.toLowerCase()}%`;
    const r = await searchRows(field, pattern, pageSize, offset, bn, selectedOnly);
    items = r.items;
    total = r.total;
  } else {
    items = (await sql`
      SELECT * FROM submissions
      WHERE batch_number = ${bn}
        AND (is_selected = TRUE OR NOT ${selectedOnly})
      ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}
    `) as Row[];
    const t = (await sql`
      SELECT COUNT(*)::text AS count FROM submissions
      WHERE batch_number = ${bn}
        AND (is_selected = TRUE OR NOT ${selectedOnly})
    `) as { count: string }[];
    total = Number(t[0]?.count ?? 0);
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return {
    items: items.map(rowToSubmission),
    total,
    page,
    pageSize,
    pageCount,
  };
}

export async function deleteSubmission(id: string): Promise<boolean> {
  await ensureSchema();
  const rows = (await sql`
    DELETE FROM submissions WHERE id = ${id} RETURNING id
  `) as { id: string }[];
  return rows.length > 0;
}

export async function deleteAllSubmissions(): Promise<number> {
  await ensureSchema();
  const rows = (await sql`
    WITH deleted AS (DELETE FROM submissions RETURNING id)
    SELECT COUNT(*)::text AS count FROM deleted
  `) as { count: string }[];
  return Number(rows[0]?.count ?? 0);
}

export async function createSubmission(input: SubmissionInput): Promise<Submission> {
  await ensureSchema();

  const id = `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const portraitsJson = JSON.stringify(input.portraits);
  const experienceJson = JSON.stringify(input.experience);
  const batchNumber = await getCurrentBatch();

  const rows = (await sql`
    INSERT INTO submissions (
      id, name, father_name, mother_name, stage_name,
      age, birthday, address, about_yourself, facebook_link,
      phone_no, viber_no, life_goal, admired_artist, can_complete, family_approval,
      nrc_front, nrc_back, portraits, art_statement, experience, batch_number, gender
    ) VALUES (
      ${id}, ${input.name}, ${input.fatherName}, ${input.motherName}, ${input.stageName},
      ${input.age}, ${input.birthday}, ${input.address}, ${input.aboutYourself},
      ${input.facebookLink}, ${input.phoneNo}, ${input.viberNo},
      ${input.lifeGoal}, ${input.admiredArtist}, ${input.canComplete}, ${input.familyApproval},
      ${input.nrcFront}, ${input.nrcBack},
      ${portraitsJson}::jsonb, ${input.artStatement}, ${experienceJson}::jsonb, ${batchNumber}, ${input.gender ?? null}
    )
    RETURNING *
  `) as Row[];

  return rowToSubmission(rows[0]);
}
