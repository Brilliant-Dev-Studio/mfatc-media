import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { listSubmissions } from "@/lib/mock-store";
import { presignGet, s3Configured } from "@/lib/s3";
import type { Submission } from "@/lib/types";
import { AutoPrint } from "./AutoPrint";

export const metadata = { title: "MFATC Submissions — Export" };

type Search = {
  page?: string;
  pageSize?: string;
  q?: string;
  field?: string;
};

export default async function PrintPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(sp.pageSize) || 10));
  const q = sp.q ?? "";
  const field = (sp.field as "all" | "facebook" | "viber" | "art") ?? "all";

  const data = listSubmissions({ page, pageSize, q, field });
  const items: Submission[] = s3Configured()
    ? await Promise.all(
        data.items.map(async (s) => ({
          ...s,
          nrcFront: await presignGet(s.nrcFront),
          nrcBack: await presignGet(s.nrcBack),
          portraits: await Promise.all(s.portraits.map((p) => presignGet(p))),
        })),
      )
    : data.items;
  const generatedAt = new Date();

  const filterSummary =
    q.trim().length > 0 ? `“${q}” in ${field}` : "no filter";

  return (
    <div className="print-root">
      <AutoPrint />
      <header className="print-header">
        <div>
          <div className="print-brand">MFATC — Submissions Export</div>
          <div className="print-meta">
            Page {data.page} of {data.pageCount} · {data.items.length} item(s) on this page · {data.total} total · {filterSummary}
          </div>
        </div>
        <div className="print-meta">
          {generatedAt.toLocaleString()} · by {admin.username}
        </div>
      </header>

      {items.length === 0 ? (
        <div className="print-empty">No submissions match the current filter.</div>
      ) : (
        items.map((s) => <SubmissionBlock key={s.id} sub={s} />)
      )}
    </div>
  );
}

function SubmissionBlock({ sub }: { sub: Submission }) {
  const created = new Date(sub.createdAt);
  return (
    <article className="print-sub">
      <div className="print-sub-head">
        <span className="print-sub-id">{sub.id}</span>
        <span>{created.toLocaleString()}</span>
      </div>
      <div className="print-grid">
        <div>
          <h3>Personal</h3>
          <p>
            <strong>{sub.name}</strong> · Age {sub.age} · Born {sub.birthday}
          </p>

          <h3>About</h3>
          <p>{sub.aboutYourself}</p>

          <h3>Contact</h3>
          <p>
            <strong>Facebook: </strong>
            {sub.facebookLink}
          </p>
          <p>
            <strong>Viber: </strong>
            {sub.viberNo}
          </p>

          <h3>Statement</h3>
          <p>{sub.artStatement}</p>

          {sub.experience.length > 0 && (
            <>
              <h3>Experience</h3>
              <ul>
                {sub.experience.map((e, i) => (
                  <li key={i}>
                    <strong>{e.title || "—"}</strong>
                    {e.organization ? ` · ${e.organization}` : ""}
                    {e.period ? ` · ${e.period}` : ""}
                    {e.description && (
                      <div className="print-exp-desc">{e.description}</div>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div>
          <h3>NRC</h3>
          <div className="print-photos print-photos-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={sub.nrcFront} alt="NRC front" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={sub.nrcBack} alt="NRC back" />
          </div>

          <h3>Portraits</h3>
          <div className="print-photos print-photos-4">
            {sub.portraits.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={p} alt={`Portrait ${i + 1}`} />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
