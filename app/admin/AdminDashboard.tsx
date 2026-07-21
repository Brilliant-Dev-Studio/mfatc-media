"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Submission, SubmissionListResponse } from "@/lib/types";

function UserSearchBox({
  value,
  onChange,
}: {
  value: string;
  onChange: (q: string) => void;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200"
      style={{
        background: focused
          ? "#fff"
          : "linear-gradient(135deg, #fff 0%, #fdf8ef 100%)",
        border: focused
          ? "1.5px solid #FDC83A"
          : "1.5px solid rgba(111,63,7,0.18)",
        boxShadow: focused
          ? "0 0 0 3px rgba(253,200,58,0.18), 0 2px 12px rgba(111,63,7,0.10)"
          : "0 2px 8px rgba(111,63,7,0.08)",
        width: "100%",
        maxWidth: "440px",
      }}
    >
      {/* Search icon */}
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors duration-200"
        style={{
          background: focused
            ? "linear-gradient(135deg, #FDC83A 0%, #e6a800 100%)"
            : "rgba(111,63,7,0.07)",
        }}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="none"
          style={{ color: focused ? "#6F3F07" : "var(--gf-text-muted)" }}
          aria-hidden
        >
          <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M10.8 10.8L14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => { if (e.key === "Escape") onChange(""); }}
        placeholder="နာမည်ဖြင့် ရှာပါ…"
        className="flex-1 bg-transparent outline-none"
        style={{
          color: "var(--gf-text)",
          fontSize: "15px",
          fontWeight: 500,
          minWidth: 0,
        }}
      />

      {value && (
        <button
          onClick={() => onChange("")}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-black/8"
          style={{ color: "var(--gf-text-muted)", fontSize: "11px" }}
          aria-label="Clear"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export function AdminDashboard({ username }: { username: string }) {
  const router = useRouter();
  const [data, setData] = useState<SubmissionListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentBatch, setCurrentBatch] = useState<number | null>(null);
  const [allBatches, setAllBatches] = useState<number[]>([]);
  const [viewedBatch, setViewedBatch] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "selected">("all");
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [inputQuery, setInputQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/batches/current")
      .then((r) => r.json())
      .then((d: { batch: number }) => {
        setCurrentBatch(d.batch);
        setViewedBatch(d.batch);
      })
      .catch(() => {
        setCurrentBatch(1);
        setViewedBatch(1);
      });
    fetch("/api/batches")
      .then((r) => r.json())
      .then((d: { batches: number[] }) => setAllBatches(d.batches))
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    if (viewedBatch === null) return;
    setLoading(true);
    const sp = new URLSearchParams({
      page: String(page),
      pageSize: "15",
      batchNumber: String(viewedBatch),
    });
    if (activeTab === "selected") sp.set("selectedOnly", "true");
    if (searchQuery.trim()) {
      sp.set("q", searchQuery.trim());
      sp.set("field", "name");
    }
    const res = await fetch(`/api/submissions?${sp.toString()}`, { cache: "no-store" });
    if (res.ok) {
      const json = (await res.json()) as SubmissionListResponse;
      setData(json);
    }
    setLoading(false);
  }, [page, viewedBatch, activeTab, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSearchChange = (q: string) => {
    setInputQuery(q);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearchQuery(q);
      setPage(1);
      setExpanded(null);
    }, 350);
  };

  const onBatchViewChange = (b: number) => {
    setViewedBatch(b);
    setPage(1);
    setExpanded(null);
    setData(null);
    setInputQuery("");
    setSearchQuery("");
  };

  const onTabChange = (tab: "all" | "selected") => {
    setActiveTab(tab);
    setPage(1);
    setExpanded(null);
    setData(null);
    setInputQuery("");
    setSearchQuery("");
  };

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

  const onSelect = async (id: string, selected: boolean) => {
    const res = await fetch(`/api/submissions/${id}/select`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected }),
    });
    if (res.ok) {
      await fetchData();
    } else {
      window.alert("Select action failed");
    }
  };

  const onFinishBatch = async () => {
    setFinishing(true);
    try {
      const res = await fetch("/api/batches/finish", { method: "POST" });
      if (res.ok) {
        window.location.reload();
      } else {
        window.alert("Failed to finish batch");
      }
    } finally {
      setFinishing(false);
    }
  };

  const items = data?.items ?? [];
  const pageCount = data?.pageCount ?? 1;
  const total = data?.total ?? 0;

  return (
    <>
      {/* ── Top navigation bar ── */}
      <nav
        className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6"
        style={{
          background: "#fff",
          borderBottom: "1px solid var(--gf-border)",
          boxShadow: "0 1px 4px rgba(111,63,7,0.07)",
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="gf-link text-sm"
          >
            ← Form
          </Link>
          <span style={{ color: "var(--gf-border)", fontSize: "16px" }}>|</span>
          <h1
            className="text-[16px] font-semibold tracking-tight"
            style={{ color: "var(--gf-primary-dark)" }}
          >
            Submissions
          </h1>
          {viewedBatch !== null && (
            <select
              value={viewedBatch}
              onChange={(e) => onBatchViewChange(Number(e.target.value))}
              aria-label="View batch"
              className="rounded-full px-3 py-0.5 text-xs font-bold outline-none"
              style={{
                background: "var(--gf-primary)",
                color: "var(--gf-primary-dark)",
                letterSpacing: "0.04em",
                border: "none",
                cursor: "pointer",
              }}
            >
              {allBatches.map((b) => (
                <option key={b} value={b}>
                  Batch {b}{b === currentBatch ? " (current)" : ""}
                </option>
              ))}
            </select>
          )}
          {viewedBatch !== null && currentBatch !== null && viewedBatch !== currentBatch && (
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
              style={{ background: "rgba(111,63,7,0.08)", color: "var(--gf-text-muted)" }}
            >
              Viewing history — read only
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span
            className="hidden text-sm sm:block"
            style={{ color: "var(--gf-text-muted)" }}
          >
            {username}
          </span>
          <button onClick={onLogout} className="gf-btn-outline text-sm">
            Sign out
          </button>
        </div>
      </nav>

      {/* ── Main content ── */}
      <main
        className="flex-1 px-4 py-6 sm:px-8"
        style={{ background: "linear-gradient(160deg, #f5efe4 0%, #ede3d0 40%, #e8dcc8 70%, #f0e8d8 100%)" }}
      >
        <div className="mx-auto w-full max-w-7xl">

          {/* Stats + action row */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p
              className="text-sm"
              style={{ color: "var(--gf-primary-dark)", fontWeight: 500, opacity: 0.7 }}
            >
              {loading
                ? "Loading…"
                : `${total} total · page ${data?.page ?? page} of ${pageCount}`}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => { window.location.href = "/api/submissions/export"; }}
                className="gf-btn-outline h-7.5 px-3 text-xs"
              >
                Export CSV
              </button>
              <a
                href={`/admin/print?${new URLSearchParams({ page: String(page), pageSize: "15" }).toString()}`}
                target="_blank"
                rel="noreferrer"
                className="gf-btn-outline inline-flex h-7.5 items-center px-3 text-xs"
              >
                Download PDF
              </a>
            </div>
          </div>

          {/* Name search */}
          <div className="mb-5">
            <UserSearchBox value={inputQuery} onChange={onSearchChange} />
          </div>

          {/* Card wrapper */}
          <div
            className="overflow-hidden rounded-2xl"
            style={{
              background: "#fff",
              border: "1px solid rgba(111,63,7,0.18)",
              boxShadow: "0 4px 32px rgba(111,63,7,0.12), 0 1px 4px rgba(111,63,7,0.08)",
            }}
          >
            {/* Tabs */}
            <div
              className="flex items-center justify-between border-b px-3"
              style={{ borderColor: "rgba(111,63,7,0.14)", background: "#fdfaf5" }}
            >
              <div className="flex">
                <TabButton
                  active={activeTab === "all"}
                  onClick={() => onTabChange("all")}
                  activeColor="#16a34a"
                  activeTextColor="#14532d"
                >
                  All Candidates
                </TabButton>
                <TabButton
                  active={activeTab === "selected"}
                  onClick={() => onTabChange("selected")}
                  activeColor="#16a34a"
                  activeTextColor="#14532d"
                >
                  Selected
                </TabButton>
              </div>

              {viewedBatch === currentBatch && (
                <button
                  onClick={() => setShowFinishModal(true)}
                  disabled={currentBatch === null}
                  className="my-1.5 mr-1 rounded-lg px-4 text-sm font-semibold transition-all disabled:opacity-40"
                  style={{
                    height: "34px",
                    background: "linear-gradient(135deg, var(--gf-primary) 0%, #e6a800 100%)",
                    color: "var(--gf-primary-dark)",
                    border: "none",
                    boxShadow: "0 2px 8px rgba(111,63,7,0.3)",
                    letterSpacing: "0.01em",
                  }}
                >
                  ✓ Batch {currentBatch} Finished
                </button>
              )}
            </div>

            {/* Table header */}
            <div
              className="hidden grid-cols-[40px_140px_1.4fr_1fr_2.5fr_auto_36px] gap-4 border-b px-5 py-3 text-[10.5px] font-bold uppercase tracking-widest sm:grid"
              style={{
                background: "linear-gradient(90deg, #3a1f04 0%, #5c3208 100%)",
                borderColor: "rgba(253,200,58,0.2)",
                color: "rgba(253,200,58,0.9)",
              }}
            >
              <span className="text-right">No.</span>
              <span>Submitted</span>
              <span>Name</span>
              <span>Viber</span>
              <span>Statement</span>
              <span>Status</span>
              <span></span>
            </div>

            {/* Rows */}
            <ul>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : items.length === 0
                ? (
                  <li
                    className="px-4 py-14 text-center text-sm"
                    style={{ color: "var(--gf-text-muted)" }}
                  >
                    No submissions match.
                  </li>
                )
                : items.map((s, idx) => (
                  <Row
                    key={s.id}
                    sub={s}
                    rowNumber={((data?.page ?? page) - 1) * (data?.pageSize ?? 15) + idx + 1}
                    open={expanded === s.id}
                    inSelectedTab={activeTab === "selected"}
                    readOnly={viewedBatch !== currentBatch}
                    onToggle={() => setExpanded((cur) => (cur === s.id ? null : s.id))}
                    onSelect={async (selected) => { await onSelect(s.id, selected); }}
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
                ))
              }
            </ul>
          </div>

          <Pagination page={data?.page ?? page} pageCount={pageCount} onPage={setPage} />
        </div>
      </main>

      {/* ── Batch Finished Modal ── */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(74,41,4,0.55)" }}>
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl"
            style={{
              background: "#fff",
              boxShadow: "0 24px 64px rgba(111,63,7,0.3), 0 8px 24px rgba(111,63,7,0.15)",
            }}
          >
            {/* Modal golden header */}
            <div
              className="px-6 py-4"
              style={{ background: "var(--gf-primary)", borderBottom: "1px solid rgba(111,63,7,0.15)" }}
            >
              <h2
                className="text-base font-bold"
                style={{ color: "var(--gf-primary-dark)" }}
              >
                Batch {currentBatch} ပြီးဆုံးမည်
              </h2>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm leading-relaxed" style={{ color: "var(--gf-text-muted)" }}>
                Batch {currentBatch} ကို ပြီးဆုံးသည်ဟု သတ်မှတ်မည်။ Selected candidates နှင့်
                submissions အားလုံးကို data ထဲမှာ သိမ်းထားပြီး Batch{" "}
                <strong style={{ color: "var(--gf-primary-dark)" }}>
                  {(currentBatch ?? 0) + 1}
                </strong>{" "}
                ကို စတင်မည်။ ဆက်လုပ်မလား?
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowFinishModal(false)}
                  disabled={finishing}
                  className="gf-btn-outline disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  onClick={onFinishBatch}
                  disabled={finishing}
                  className="gf-btn-primary disabled:opacity-40"
                >
                  {finishing ? "Processing…" : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TabButton({
  active,
  onClick,
  activeColor = "var(--gf-primary)",
  activeTextColor = "var(--gf-primary-dark)",
  children,
}: {
  active: boolean;
  onClick: () => void;
  activeColor?: string;
  activeTextColor?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="-mb-px border-b-2 px-5 py-3 text-sm font-medium transition-colors"
      style={
        active
          ? { borderBottomColor: activeColor, color: activeTextColor, background: activeColor + "18" }
          : { borderBottomColor: "transparent", color: "var(--gf-text-muted)", background: "transparent" }
      }
    >
      {children}
    </button>
  );
}

function Row({
  sub,
  rowNumber,
  open,
  inSelectedTab,
  readOnly,
  onToggle,
  onDelete,
  onSelect,
}: {
  sub: Submission;
  rowNumber: number;
  open: boolean;
  inSelectedTab: boolean;
  readOnly?: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onSelect: (selected: boolean) => Promise<void>;
}) {
  const created = new Date(sub.createdAt);
  const dateLabel = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}-${String(created.getDate()).padStart(2, "0")}`;
  const [busy, setBusy] = useState(false);
  const [selectBusy, setSelectBusy] = useState(false);

  return (
    <li
      className="border-b last:border-b-0"
      style={{ borderColor: "var(--gf-border)" }}
    >
      <div
        className="grid w-full grid-cols-[auto_1fr_auto_36px] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-amber-50/40 sm:grid-cols-[40px_140px_1.4fr_1fr_2.5fr_auto_36px]"
      >
        {/* Row number */}
        <span
          className="hidden w-10 shrink-0 text-right text-[13px] font-bold tabular-nums sm:block"
          style={{ color: "var(--gf-primary)", opacity: 0.7 }}
        >
          {rowNumber}
        </span>

        {/* Submitted date + ID */}
        <button onClick={onToggle} className="min-w-0 text-left">
          <div className="text-[13px] font-semibold" style={{ color: "var(--gf-text)" }}>{dateLabel}</div>
          <div className="mt-0.5 truncate text-[11px]" style={{ color: "var(--gf-text-faint)", fontFamily: "var(--font-mono)" }}>
            {sub.id}
          </div>
        </button>

        {/* Name */}
        <button onClick={onToggle} className="hidden min-w-0 truncate text-left sm:block">
          <div className="text-[13px] font-medium" style={{ color: "var(--gf-text)" }}>{sub.name}</div>
          <div className="mt-0.5 text-[11px]" style={{ color: "var(--gf-text-muted)" }}>
            {sub.age} · {sub.birthday}{sub.gender ? ` · ${sub.gender === "male" ? "M" : "F"}` : ""}
          </div>
        </button>

        {/* Viber */}
        <button
          onClick={onToggle}
          className="hidden text-left text-[13px] sm:block"
          style={{ color: "var(--gf-text)" }}
        >
          {sub.viberNo}
        </button>

        {/* Statement */}
        <button
          onClick={onToggle}
          className="hidden text-left text-[12px] leading-snug sm:block"
          style={{ color: "var(--gf-text-muted)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}
        >
          {sub.artStatement}
        </button>

        {/* Select / Deselect button */}
        <button
          onClick={async () => {
            if (readOnly) return;
            setSelectBusy(true);
            try {
              await onSelect(!sub.isSelected);
            } finally {
              setSelectBusy(false);
            }
          }}
          disabled={selectBusy || readOnly}
          title={readOnly ? "Viewing past batch — read only" : undefined}
          className="whitespace-nowrap rounded-full px-3.5 py-1 text-[11px] font-bold tracking-wide transition-all disabled:opacity-40"
          style={
            inSelectedTab && sub.isSelected
              ? { background: "#dc2626", color: "#fff", boxShadow: "0 1px 4px rgba(220,38,38,0.35)" }
              : sub.isSelected
              ? { background: "#16a34a", color: "#fff", boxShadow: "0 1px 4px rgba(22,163,74,0.35)" }
              : { background: "rgba(111,63,7,0.06)", color: "var(--gf-text-muted)", border: "1px solid rgba(111,63,7,0.18)" }
          }
        >
          {selectBusy ? "…" : inSelectedTab && sub.isSelected ? "Unselect" : sub.isSelected ? "✓ Selected" : "Select"}
        </button>

        {/* Delete — hidden */}
        <span className="hidden" />

        {/* Toggle expand */}
        <button
          onClick={onToggle}
          aria-label="Toggle details"
          className="flex h-7 w-7 items-center justify-center rounded-full transition-all hover:bg-black/5"
          style={{ color: "var(--gf-text-muted)" }}
        >
          <span
            className="inline-block text-[16px] leading-none transition-transform"
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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
    <div
      className="border-t px-4 py-5"
      style={{
        borderColor: "var(--gf-border)",
        background: "var(--gf-surface-alt)",
        opacity: 0.97,
      }}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <SectionLabel>Personal</SectionLabel>
          <div className="mt-2 flex flex-col gap-0.5 text-sm">
            <div><strong>{sub.name}</strong></div>
            {sub.stageName && <div className="text-muted">Stage name — {sub.stageName}</div>}
            {sub.fatherName && <div className="text-muted">ဖခင် — {sub.fatherName}</div>}
            {sub.motherName && <div className="text-muted">မိခင် — {sub.motherName}</div>}
            <div className="text-muted">Age {sub.age} · Born {sub.birthday}{sub.gender ? ` · ${sub.gender === "male" ? "Male (ကျား)" : "Female (မ)"}` : ""}</div>
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
                  <li
                    key={i}
                    className="rounded-lg border p-3 text-sm"
                    style={{ background: "#fff", borderColor: "var(--gf-border)" }}
                  >
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
            <img
              src={sub.nrcFront}
              alt="NRC front"
              className="aspect-4/3 w-full rounded-lg object-cover"
              style={{ border: "1px solid var(--gf-border)" }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sub.nrcBack}
              alt="NRC back"
              className="aspect-4/3 w-full rounded-lg object-cover"
              style={{ border: "1px solid var(--gf-border)" }}
            />
          </div>

          <SectionLabel className="mt-5">Portraits</SectionLabel>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {sub.portraits.map((p, i) => (
              <button
                key={i}
                onClick={() => setLightboxIndex(i)}
                className="overflow-hidden rounded-lg transition-transform hover:scale-[1.04] active:scale-[0.97]"
                style={{ border: "1px solid var(--gf-border)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p}
                  alt={`Portrait ${i + 1}`}
                  className="aspect-3/4 w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>

    {lightboxIndex !== null && (
      <Lightbox
        images={sub.portraits}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
      />
    )}
    </>
  );
}

function Lightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);

  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setIndex((i) => (i + 1) % images.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length, onClose]);

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.93)" }}
      onClick={onClose}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const diff = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(diff) > 48) { if (diff < 0) next(); else prev(); }
        touchStartX.current = null;
      }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15"
        style={{ fontSize: "18px" }}
        aria-label="Close"
      >
        ✕
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs font-medium text-white/60"
        style={{ background: "rgba(255,255,255,0.08)" }}>
        {index + 1} / {images.length}
      </div>

      {/* Prev */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="absolute left-3 flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15"
          style={{ fontSize: "28px", lineHeight: 1 }}
          aria-label="Previous"
        >
          ‹
        </button>
      )}

      {/* Image */}
      <div
        className="flex items-center justify-center"
        style={{ maxHeight: "92vh", maxWidth: "min(92vw, 720px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={index}
          src={images[index]}
          alt={`Portrait ${index + 1}`}
          className="max-h-[92vh] max-w-full rounded-xl object-contain"
          style={{ boxShadow: "0 12px 60px rgba(0,0,0,0.7)" }}
        />
      </div>

      {/* Next */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="absolute right-3 flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15"
          style={{ fontSize: "28px", lineHeight: 1 }}
          aria-label="Next"
        >
          ›
        </button>
      )}

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setIndex(i); }}
              className="rounded-full transition-all"
              style={{
                height: "6px",
                width: i === index ? "22px" : "6px",
                background: i === index ? "#fff" : "rgba(255,255,255,0.35)",
              }}
              aria-label={`Go to ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SkeletonRow() {
  return (
    <li
      className="border-b last:border-b-0"
      aria-hidden
      style={{ borderColor: "var(--gf-border)" }}
    >
      <div className="grid w-full grid-cols-[auto_1fr_auto_36px_36px] items-center gap-4 px-5 py-3.5 sm:grid-cols-[40px_140px_1.4fr_1fr_2.5fr_auto_36px_36px]">
        <div className="hidden sm:flex justify-end">
          <div className="h-3.5 w-5 animate-pulse rounded bg-black/8" />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="h-3.5 w-24 animate-pulse rounded bg-black/8" />
          <div className="h-3 w-32 animate-pulse rounded bg-black/6" />
        </div>
        <div className="hidden flex-col gap-1.5 sm:flex">
          <div className="h-3.5 w-28 animate-pulse rounded bg-black/8" />
          <div className="h-3 w-20 animate-pulse rounded bg-black/6" />
        </div>
        <div className="hidden sm:block">
          <div className="h-3.5 w-24 animate-pulse rounded bg-black/8" />
        </div>
        <div className="hidden sm:block">
          <div className="h-3.5 w-full animate-pulse rounded bg-black/8" />
        </div>
        <div className="h-6 w-16 animate-pulse rounded-full bg-black/8" />
        <span className="hidden" />
        <div className="h-7 w-7 animate-pulse rounded-full bg-black/6 justify-self-center" />
      </div>
    </li>
  );
}

function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`text-[10px] font-semibold uppercase tracking-widest ${className}`}
      style={{ color: "var(--gf-primary-dark)", opacity: 0.6 }}
    >
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
      <span className="text-sm" style={{ color: "var(--gf-text-muted)" }}>
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
