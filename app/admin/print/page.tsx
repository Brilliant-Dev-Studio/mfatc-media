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

  const data = await listSubmissions({ page, pageSize, q, field });
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

  return (
    <div className="mag-root">
      <AutoPrint />
      {items.length === 0 ? (
        <div className="print-empty">No submissions match the current filter.</div>
      ) : (
        items.map((s) => <TalentPage key={s.id} sub={s} />)
      )}
    </div>
  );
}

function TalentPage({ sub }: { sub: Submission }) {
  return (
    <section className="mag-page">
      <header className="mag-bar">
        <div>
          <div className="mag-bar-name">{sub.name}</div>
          <div className="mag-bar-meta">
            <span>Age {sub.age}</span>
            <span>·</span>
            <span>Born {sub.birthday}</span>
            <span>·</span>
            <span>Viber {sub.viberNo}</span>
          </div>
        </div>
        <div className="mag-bar-id">{sub.id}</div>
      </header>

      <div className="mag-text">
        <div className="mag-section">
          <h3 className="mag-h3">About</h3>
          <p className="mag-p">{sub.aboutYourself}</p>
        </div>
        <div className="mag-section">
          <h3 className="mag-h3">Artist Statement</h3>
          <p className="mag-p">{sub.artStatement}</p>
        </div>
        <div className="mag-section">
          <h3 className="mag-h3">Contact</h3>
          <p className="mag-p mag-mono">{sub.facebookLink}</p>
        </div>
        {sub.experience.length > 0 && (
          <div className="mag-section">
            <h3 className="mag-h3">Experience</h3>
            <ul className="mag-exp">
              {sub.experience.map((e, i) => (
                <li key={i}>
                  <span className="mag-exp-title">{e.title || "—"}</span>
                  {e.organization ? <> · {e.organization}</> : null}
                  {e.period ? <span className="mag-exp-period"> · {e.period}</span> : null}
                  {e.description && <div className="mag-exp-desc">{e.description}</div>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <section className="mag-photo-section">
        <h3 className="mag-h3">Portraits</h3>
        <div className="mag-row mag-row-4">
          {sub.portraits.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={p} alt={`${sub.name} — portrait ${i + 1}`} />
          ))}
        </div>
      </section>

      <section className="mag-photo-section">
        <h3 className="mag-h3">NRC</h3>
        <div className="mag-row mag-row-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sub.nrcFront} alt="NRC front" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sub.nrcBack} alt="NRC back" />
        </div>
      </section>
    </section>
  );
}
