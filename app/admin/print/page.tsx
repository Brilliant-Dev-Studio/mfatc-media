import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { getCurrentBatch, getSubmissionById, listSubmissions, listSubmissionsForPrint } from "@/lib/mock-store";
import { presignGet, s3Configured } from "@/lib/s3";
import type { Submission } from "@/lib/types";
import { AutoPrint } from "./AutoPrint";

export const metadata = { title: "MFAPC Submissions — Export" };

type Search = {
  page?: string;
  pageSize?: string;
  q?: string;
  field?: string;
  id?: string;
  batchNumber?: string;
  batchScope?: string;
  selectedOnly?: string;
};

export default async function PrintPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const sp = await searchParams;

  let raw: Submission[];

  if (sp.id) {
    const single = await getSubmissionById(sp.id);
    raw = single ? [single] : [];
  } else if (sp.selectedOnly === "true") {
    let batchNumber: number | undefined;
    if (sp.batchScope !== "all") {
      const parsed = Number(sp.batchNumber);
      batchNumber = Number.isFinite(parsed) && sp.batchNumber ? parsed : await getCurrentBatch();
    }
    raw = await listSubmissionsForPrint({ batchNumber, selectedOnly: true });
  } else {
    const page = Math.max(1, Number(sp.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(sp.pageSize) || 10));
    const q = sp.q ?? "";
    const field = (sp.field as "all" | "facebook" | "viber" | "art") ?? "all";
    const data = await listSubmissions({ page, pageSize, q, field });
    raw = data.items;
  }

  const items: Submission[] = s3Configured()
    ? await Promise.all(
        raw.map(async (s) => ({
          ...s,
          nrcFront: await presignGet(s.nrcFront),
          nrcBack: await presignGet(s.nrcBack),
          portraits: await Promise.all(s.portraits.map((p) => presignGet(p))),
        })),
      )
    : raw;

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
            {sub.stageName ? <><span>Stage {sub.stageName}</span><span>·</span></> : null}
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
        {(sub.fatherName || sub.motherName) && (
          <div className="mag-section">
            <h3 className="mag-h3">Parents</h3>
            <p className="mag-p">
              {sub.fatherName ? `ဖခင် — ${sub.fatherName}` : ""}
              {sub.fatherName && sub.motherName ? " · " : ""}
              {sub.motherName ? `မိခင် — ${sub.motherName}` : ""}
            </p>
          </div>
        )}
        {sub.address && (
          <div className="mag-section">
            <h3 className="mag-h3">နေရပ်လိပ်စာ</h3>
            <p className="mag-p">{sub.address}</p>
          </div>
        )}
        <div className="mag-section">
          <h3 className="mag-h3">About</h3>
          <p className="mag-p">{sub.aboutYourself}</p>
        </div>
        {sub.lifeGoal && (
          <div className="mag-section">
            <h3 className="mag-h3">ဘဝရည်မှန်းချက်</h3>
            <p className="mag-p">{sub.lifeGoal}</p>
          </div>
        )}
        {sub.admiredArtist && (
          <div className="mag-section">
            <h3 className="mag-h3">အားကျသော အနုပညာရှင်</h3>
            <p className="mag-p">{sub.admiredArtist}</p>
          </div>
        )}
        <div className="mag-section">
          <h3 className="mag-h3">သင်တန်းပြီးဆုံးအောင် တက်ရောက်နိုင်မှု</h3>
          <p className="mag-p">{sub.canComplete ? "ရှိ" : "မရှိ"}</p>
        </div>
        <div className="mag-section">
          <h3 className="mag-h3">မိသားစုခွင့်ပြုမှု</h3>
          <p className="mag-p">{sub.familyApproval ? "ခွင့်ပြု" : "မပြု"}</p>
        </div>
        <div className="mag-section">
          <h3 className="mag-h3">Artist Statement</h3>
          <p className="mag-p">{sub.artStatement}</p>
        </div>
        <div className="mag-section">
          <h3 className="mag-h3">Contact</h3>
          <p className="mag-p mag-mono">{sub.facebookLink}</p>
          {sub.phoneNo && <p className="mag-p">Phone — {sub.phoneNo}</p>}
          <p className="mag-p">Viber — {sub.viberNo}</p>
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
