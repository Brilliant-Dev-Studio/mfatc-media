"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Submission, SubmissionListResponse } from "@/lib/types";

export function AdminDashboard({ username }: { username: string }) {
  const router = useRouter();
  const [data, setData] = useState<SubmissionListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams({
      page: String(page),
      pageSize: "10",
    });
    const res = await fetch(`/api/submissions?${sp.toString()}`, { cache: "no-store" });
    if (res.ok) {
      const json = (await res.json()) as SubmissionListResponse;
      setData(json);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onDeleteAll = async () => {
    if (total === 0) return;
    const ok = window.confirm(
      `Submissions ${total} ခုလုံးကို permanent ဖျက်ပါမည်။ ပြန် undo လို့ မရပါ။ ဆက်လုပ်မလား?`,
    );
    if (!ok) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/submissions", { method: "DELETE" });
      if (res.ok) {
        setPage(1);
        await fetchData();
      } else {
        window.alert("Delete failed");
      }
    } finally {
      setDeleting(false);
    }
  };

  const onLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  };

  const items = data?.items ?? [];
  const pageCount = data?.pageCount ?? 1;
  const total = data?.total ?? 0;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/" className="gf-link text-sm">
            ← Form
          </Link>
          <h1 className="mt-1 text-[22px] font-normal leading-tight">Submissions</h1>
          <p className="gf-helper">
            {loading ? "Loading…" : `${total} total · page ${data?.page ?? page} of ${pageCount}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">{username}</span>
          <button onClick={onLogout} className="gf-btn-outline">
            Sign out
          </button>
        </div>
      </header>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs text-muted">
          ဒီစာမျက်နှာ data တွေကိုပဲ PDF အဖြစ် download ဆွဲမယ်
        </span>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <button
            onClick={onDeleteAll}
            disabled={deleting || total === 0}
            className="gf-btn-outline inline-flex items-center justify-center whitespace-nowrap disabled:opacity-40"
            style={{ borderColor: "var(--gf-required)", color: "var(--gf-required)" }}
          >
            {deleting ? "Deleting…" : "Delete All"}
          </button>
          <a
            href={`/admin/print?${new URLSearchParams({ page: String(page), pageSize: "10" }).toString()}`}
            target="_blank"
            rel="noreferrer"
            className="gf-btn-outline inline-flex items-center justify-center whitespace-nowrap"
          >
            Download PDF
          </a>
        </div>
      </div>

      <section className="mt-3 overflow-hidden rounded-md border border-border bg-white">
        <div className="hidden grid-cols-[1fr_1.3fr_1.1fr_2fr_28px_28px] gap-3 border-b border-border bg-surface-alt px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-muted sm:grid">
          <span>Submitted</span>
          <span>Name</span>
          <span>Viber</span>
          <span>Statement</span>
          <span></span>
          <span></span>
        </div>
        <ul>
          {loading && items.length === 0 &&
            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          {items.map((s) => (
            <Row
              key={s.id}
              sub={s}
              open={expanded === s.id}
              onToggle={() => setExpanded((cur) => (cur === s.id ? null : s.id))}
              onDelete={async () => {
                const ok = window.confirm(
                  `${s.name} (${s.id}) ကို permanent ဖျက်ပါမည်။ ပြန် undo လို့ မရပါ။ ဆက်လုပ်မလား?`,
                );
                if (!ok) return;
                const res = await fetch(`/api/submissions/${s.id}`, { method: "DELETE" });
                if (res.ok) {
                  if (expanded === s.id) setExpanded(null);
                  await fetchData();
                } else {
                  window.alert("Delete failed");
                }
              }}
            />
          ))}
          {!loading && items.length === 0 && (
            <li className="px-4 py-10 text-center text-sm text-muted">No submissions match.</li>
          )}
        </ul>
      </section>

      <Pagination page={data?.page ?? page} pageCount={pageCount} onPage={setPage} />
    </main>
  );
}

function Row({
  sub,
  open,
  onToggle,
  onDelete,
}: {
  sub: Submission;
  open: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const created = new Date(sub.createdAt);
  const dateLabel = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}-${String(created.getDate()).padStart(2, "0")}`;
  const [busy, setBusy] = useState(false);
  return (
    <li className="border-b border-border last:border-b-0">
      <div className="grid w-full grid-cols-[1fr_28px_28px] items-center gap-3 px-4 py-3 transition hover:bg-(--gf-hover) sm:grid-cols-[1fr_1.3fr_1.1fr_2fr_28px_28px]">
        <button onClick={onToggle} className="text-left text-sm">
          <div className="text-foreground">{dateLabel}</div>
          <div className="text-xs text-muted">{sub.id}</div>
        </button>
        <button onClick={onToggle} className="hidden truncate text-left text-sm sm:block">
          <div>{sub.name}</div>
          <div className="text-xs text-muted">{sub.age} · {sub.birthday}</div>
        </button>
        <button onClick={onToggle} className="hidden text-left text-sm sm:block">
          {sub.viberNo}
        </button>
        <button onClick={onToggle} className="hidden truncate text-left text-sm text-muted sm:block">
          {sub.artStatement}
        </button>
        <button
          onClick={async () => {
            setBusy(true);
            try {
              await onDelete();
            } finally {
              setBusy(false);
            }
          }}
          disabled={busy}
          aria-label="Delete submission"
          title="Delete"
          className="text-base leading-none transition disabled:opacity-40"
          style={{ color: "var(--gf-required)" }}
        >
          {busy ? "…" : "✕"}
        </button>
        <button
          onClick={onToggle}
          aria-label="Toggle details"
          className="text-right text-muted"
        >
          <span
            className="inline-block transition-transform"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            aria-hidden
          >
            ⌄
          </span>
        </button>
      </div>
      {open && <Detail sub={sub} />}
    </li>
  );
}

function Detail({ sub }: { sub: Submission }) {
  return (
    <div className="border-t border-border bg-surface-alt px-4 py-5">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <SectionLabel>Personal</SectionLabel>
          <div className="mt-2 flex flex-col gap-0.5 text-sm">
            <div><strong>{sub.name}</strong></div>
            {sub.stageName && <div className="text-muted">Stage name — {sub.stageName}</div>}
            {sub.fatherName && <div className="text-muted">ဖခင် — {sub.fatherName}</div>}
            {sub.motherName && <div className="text-muted">မိခင် — {sub.motherName}</div>}
            <div className="text-muted">Age {sub.age} · Born {sub.birthday}</div>
            {sub.address && <div className="text-muted">နေရပ် — {sub.address}</div>}
          </div>

          <SectionLabel className="mt-5">About</SectionLabel>
          <p className="mt-2 text-sm leading-relaxed">{sub.aboutYourself}</p>

          {sub.lifeGoal && (
            <>
              <SectionLabel className="mt-5">ဘဝရည်မှန်းချက်</SectionLabel>
              <p className="mt-2 text-sm leading-relaxed">{sub.lifeGoal}</p>
            </>
          )}

          {sub.admiredArtist && (
            <>
              <SectionLabel className="mt-5">အားကျသော အနုပညာရှင်</SectionLabel>
              <p className="mt-2 text-sm leading-relaxed">{sub.admiredArtist}</p>
            </>
          )}

          <SectionLabel className="mt-5">သင်တန်းပြီးဆုံးအောင် တက်ရောက်နိုင်မှု</SectionLabel>
          <p className="mt-2 text-sm leading-relaxed">{sub.canComplete ? "ရှိ" : "မရှိ"}</p>

          <SectionLabel className="mt-5">မိသားစုခွင့်ပြုမှု</SectionLabel>
          <p className="mt-2 text-sm leading-relaxed">{sub.familyApproval ? "ခွင့်ပြု" : "မပြု"}</p>

          <SectionLabel className="mt-5">Contact</SectionLabel>
          <div className="mt-2 flex flex-col gap-1 text-sm">
            <a href={sub.facebookLink} target="_blank" rel="noreferrer" className="gf-link">
              {sub.facebookLink}
            </a>
            {sub.phoneNo && <span>Phone — {sub.phoneNo}</span>}
            <span>Viber — {sub.viberNo}</span>
          </div>

          <SectionLabel className="mt-5">Statement</SectionLabel>
          <p className="mt-2 text-sm leading-relaxed">{sub.artStatement}</p>

          {sub.experience.length > 0 && (
            <>
              <SectionLabel className="mt-5">Experience</SectionLabel>
              <ul className="mt-2 flex flex-col gap-2">
                {sub.experience.map((e, i) => (
                  <li key={i} className="rounded-md border border-border bg-white p-3 text-sm">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium">{e.title || "—"}</span>
                      <span className="text-xs text-muted">{e.period}</span>
                    </div>
                    <div className="text-xs text-muted">{e.organization}</div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div>
          <SectionLabel>NRC</SectionLabel>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={sub.nrcFront} alt="NRC front" className="aspect-4/3 w-full rounded border border-border object-cover" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={sub.nrcBack} alt="NRC back" className="aspect-4/3 w-full rounded border border-border object-cover" />
          </div>

          <SectionLabel className="mt-5">Portraits</SectionLabel>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {sub.portraits.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={p} alt={`Portrait ${i + 1}`} className="aspect-3/4 w-full rounded border border-border object-cover" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <li className="border-b border-border last:border-b-0" aria-hidden>
      <div className="grid w-full grid-cols-[1fr_28px_28px] items-center gap-3 px-4 py-3 sm:grid-cols-[1fr_1.3fr_1.1fr_2fr_28px_28px]">
        <div className="flex flex-col gap-1.5">
          <div className="h-3.5 w-24 animate-pulse rounded bg-black/10" />
          <div className="h-3 w-32 animate-pulse rounded bg-black/10" />
        </div>
        <div className="hidden flex-col gap-1.5 sm:flex">
          <div className="h-3.5 w-28 animate-pulse rounded bg-black/10" />
          <div className="h-3 w-20 animate-pulse rounded bg-black/10" />
        </div>
        <div className="hidden sm:block">
          <div className="h-3.5 w-28 animate-pulse rounded bg-black/10" />
        </div>
        <div className="hidden sm:block">
          <div className="h-3.5 w-full animate-pulse rounded bg-black/10" />
        </div>
        <div className="h-3.5 w-3 animate-pulse rounded bg-black/10 justify-self-end" />
        <div className="h-3.5 w-3 animate-pulse rounded bg-black/10 justify-self-end" />
      </div>
    </li>
  );
}

function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`text-xs font-medium uppercase tracking-wider text-muted ${className}`}>
      {children}
    </div>
  );
}

function Pagination({
  page,
  pageCount,
  onPage,
}: {
  page: number;
  pageCount: number;
  onPage: (p: number) => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between">
      <button
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className="gf-btn-outline disabled:opacity-40"
      >
        ← Prev
      </button>
      <span className="text-sm text-muted">
        Page {page} of {pageCount}
      </span>
      <button
        disabled={page >= pageCount}
        onClick={() => onPage(page + 1)}
        className="gf-btn-outline disabled:opacity-40"
      >
        Next →
      </button>
    </div>
  );
}
