import { getCurrentAdmin } from "@/lib/auth";
import { ensureSchema, sql } from "@/lib/db";
import type { ExperienceEntry } from "@/lib/types";

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
  art_statement: string;
  experience: ExperienceEntry[];
};

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toIsoDate(v: string | Date): string {
  if (v instanceof Date) {
    const y = v.getUTCFullYear();
    const m = String(v.getUTCMonth() + 1).padStart(2, "0");
    const d = String(v.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(v).slice(0, 10);
}

const HEADERS = [
  "id",
  "created_at",
  "name",
  "father_name",
  "mother_name",
  "stage_name",
  "age",
  "birthday",
  "address",
  "phone_no",
  "viber_no",
  "facebook_link",
  "about_yourself",
  "life_goal",
  "admired_artist",
  "art_statement",
  "can_complete",
  "family_approval",
  "nrc_front",
  "nrc_back",
  "portraits",
  "experience",
];

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await ensureSchema();
  const rows = (await sql`SELECT * FROM submissions ORDER BY created_at DESC`) as Row[];

  const lines: string[] = [HEADERS.join(",")];

  for (const r of rows) {
    const portraitsValue = Array.isArray(r.portraits) ? r.portraits.join(" | ") : String(r.portraits ?? "");
    const experienceValue = Array.isArray(r.experience)
      ? r.experience
          .map((e) => `${e.title || ""}/${e.organization || ""}/${e.period || ""}`)
          .join(" | ")
      : String(r.experience ?? "");

    const cells = [
      r.id,
      new Date(r.created_at).toISOString(),
      r.name,
      r.father_name ?? "",
      r.mother_name ?? "",
      r.stage_name ?? "",
      r.age,
      toIsoDate(r.birthday),
      r.address ?? "",
      r.phone_no ?? "",
      r.viber_no,
      r.facebook_link,
      r.about_yourself,
      r.life_goal ?? "",
      r.admired_artist ?? "",
      r.art_statement,
      r.can_complete ? "Yes" : "No",
      r.family_approval ? "Yes" : "No",
      r.nrc_front,
      r.nrc_back,
      portraitsValue,
      experienceValue,
    ];

    lines.push(cells.map(csvCell).join(","));
  }

  const csv = lines.join("\r\n");
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="submissions-${date}.csv"`,
    },
  });
}
