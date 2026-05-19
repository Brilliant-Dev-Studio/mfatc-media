"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { fileToThumbnailBlob } from "@/lib/image";
import type { ExperienceEntry } from "@/lib/types";

type PhotoSlot = "nrc-front" | "nrc-back" | "portrait-1" | "portrait-2" | "portrait-3" | "portrait-4";

type PhotoState =
  | null
  | { status: "uploading"; preview: string }
  | { status: "ready"; key: string; preview: string }
  | { status: "error"; preview: string; message: string };


const EMPTY_EXP: ExperienceEntry = { title: "", organization: "", period: "", description: "" };

export default function FormPage() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [birthday, setBirthday] = useState("");
  const [aboutYourself, setAboutYourself] = useState("");
  const [facebookLink, setFacebookLink] = useState("");
  const [viberNo, setViberNo] = useState("");
  const [nrcFront, setNrcFront] = useState<PhotoState>(null);
  const [nrcBack, setNrcBack] = useState<PhotoState>(null);
  const [portraits, setPortraits] = useState<PhotoState[]>([null, null, null, null]);
  const [artStatement, setArtStatement] = useState("");
  const [experience, setExperience] = useState<ExperienceEntry[]>([{ ...EMPTY_EXP }]);

  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const setPortrait = useCallback((idx: number, value: PhotoState) => {
    setPortraits((prev) => prev.map((p, i) => (i === idx ? value : p)));
  }, []);

  const updateExp = useCallback((idx: number, patch: Partial<ExperienceEntry>) => {
    setExperience((prev) => prev.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  }, []);

  async function handlePhoto(
    file: File | undefined,
    slot: PhotoSlot,
    set: (v: PhotoState) => void,
  ) {
    if (!file) return;
    let preview: string | null = null;
    try {
      const { blob, contentType } = await fileToThumbnailBlob(file);
      preview = URL.createObjectURL(blob);
      set({ status: "uploading", preview });

      const presign = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot, contentType }),
      });
      if (!presign.ok) throw new Error("presign failed");
      const { uploadUrl, key } = (await presign.json()) as { uploadUrl: string; key: string };

      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: blob,
      });
      if (!put.ok) throw new Error(`upload failed (${put.status})`);

      set({ status: "ready", key, preview });
    } catch (err) {
      const message = err instanceof Error ? err.message : "upload error";
      set({ status: "error", preview: preview ?? "", message });
    }
  }

  function revokePreview(p: PhotoState) {
    if (p && p.preview) URL.revokeObjectURL(p.preview);
  }

  function resetForm() {
    setName("");
    setAge("");
    setBirthday("");
    setAboutYourself("");
    setFacebookLink("");
    setViberNo("");
    setNrcFront((prev) => { revokePreview(prev); return null; });
    setNrcBack((prev) => { revokePreview(prev); return null; });
    setPortraits((prev) => { prev.forEach(revokePreview); return [null, null, null, null]; });
    setArtStatement("");
    setExperience([{ ...EMPTY_EXP }]);
    setErrors([]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);

    const keyOf = (p: PhotoState): string | null => (p && p.status === "ready" ? p.key : null);
    const nrcFrontKey = keyOf(nrcFront);
    const nrcBackKey = keyOf(nrcBack);
    const portraitKeys = portraits.map(keyOf);
    if (!nrcFrontKey || !nrcBackKey || portraitKeys.some((k) => !k)) {
      setErrors(["ပုံ အကုန် upload ပြီးအောင် စောင့်ပါ — ထပ်စမ်းပါ။"]);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setBusy(true);
    const payload = {
      name: name.trim(),
      age: Number(age),
      birthday,
      aboutYourself: aboutYourself.trim(),
      facebookLink: facebookLink.trim(),
      viberNo: viberNo.trim(),
      nrcFront: nrcFrontKey,
      nrcBack: nrcBackKey,
      portraits: portraitKeys as string[],
      artStatement: artStatement.trim(),
      experience: experience.filter((x) => x.title || x.organization || x.description),
    };
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { errors?: string[]; error?: string };
        setErrors(data.errors ?? [data.error ?? "တင်ရာတွင် အမှားရှိနေသည်။"]);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setDone(true);
        resetForm();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      setErrors(["Network error. ပြန်ကြိုးစားပါ။"]);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="stage-page">
        <div className="stage-bg" aria-hidden />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Gemini_Generated_Image_kxdflakxdflakxdf-removebg-preview.png"
          alt=""
          aria-hidden
          className="stage-curtain stage-curtain-left"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Gemini_Generated_Image_1oiujm1oiujm1oiu-removebg-preview.png"
          alt=""
          aria-hidden
          className="stage-curtain stage-curtain-right"
        />
        <main className="mx-auto w-full max-w-160 px-4 py-6 sm:py-10">
          <div className="gf-card gf-stripe-top">
          <h1 className="text-[28px] font-normal leading-tight">MFATC — Artist &amp; Talent Application</h1>
          <p className="mt-3 gf-helper">
            Submit လုပ်ပေးတာ ကျေးဇူးပါ။
          </p>
          <div className="mt-5">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setDone(false);
              }}
              className="gf-link text-sm"
            >
              Submit another response
            </button>
          </div>
        </div>
        <footer className="text-on-stage mt-4 px-2 text-center text-xs">
          MFATC Studio · Yangon ·{" "}
          <Link href="/admin/login" className="gf-link">
            Admin
          </Link>
        </footer>
        </main>
      </div>
    );
  }

  return (
    <div className="stage-page">
      <div className="stage-bg" aria-hidden />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/Gemini_Generated_Image_kxdflakxdflakxdf-removebg-preview.png"
        alt=""
        aria-hidden
        className="stage-curtain stage-curtain-left"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/Gemini_Generated_Image_1oiujm1oiujm1oiu-removebg-preview.png"
        alt=""
        aria-hidden
        className="stage-curtain stage-curtain-right"
      />
      <main className="mx-auto w-full max-w-160 px-4 py-6 sm:py-10">
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <header className="gf-card gf-stripe-top">
          <h1 className="text-[28px] font-normal leading-tight">MFATC — Artist &amp; Talent Application</h1>
          <div className="mt-4 gf-divider" />
          <p className="mt-3 text-sm">
            <span className="required-mark">*</span>
            <span className="ml-1">Indicates required question</span>
          </p>
        </header>

        {errors.length > 0 && (
          <div className="gf-card border-l-4" style={{ borderLeftColor: "var(--gf-required)" }}>
            <p className="text-sm font-medium" style={{ color: "var(--gf-required)" }}>
              ပြန်စစ်ပါ —
            </p>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted">
              {errors.map((er, i) => (
                <li key={i}>{er}</li>
              ))}
            </ul>
          </div>
        )}

        <Question label="Full name" required>
          <input
            type="text"
            required
            autoComplete="name"
            placeholder="Aye Aung"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="gf-input"
          />
        </Question>

        <Question label="Age နဲ့ Birthday" required helper="Age က ၁၀–၉၉ ထဲက ဖြစ်ရမယ်။">
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col">
              <span className="gf-helper mb-1">Age</span>
              <input
                type="number"
                required
                inputMode="numeric"
                min={10}
                max={99}
                placeholder="22"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="gf-input"
              />
            </label>
            <label className="flex flex-col">
              <span className="gf-helper mb-1">Birthday</span>
              <input
                type="date"
                required
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                className="gf-input"
              />
            </label>
          </div>
        </Question>

        <Question label="About yourself" required helper="သင်ဘယ်သူဖြစ်လဲ၊ ဘယ်က၊ ဘာတွေ ဖြစ်ချင်လဲ။">
          <textarea
            required
            rows={4}
            placeholder="ဥပမာ — Yangon က Aye Aung ပါ။ ၂၂ နှစ်ပါ။ ..."
            value={aboutYourself}
            onChange={(e) => setAboutYourself(e.target.value)}
            className="gf-textarea"
          />
        </Question>

        <Question label="Facebook profile link" required>
          <input
            type="url"
            required
            inputMode="url"
            placeholder="https://facebook.com/your.name"
            value={facebookLink}
            onChange={(e) => setFacebookLink(e.target.value)}
            className="gf-input"
          />
        </Question>

        <Question label="Viber number" required helper="Country code နဲ့ ထည့်ပါ — e.g. +95 9...">
          <input
            type="tel"
            required
            inputMode="tel"
            placeholder="+95 9..."
            value={viberNo}
            onChange={(e) => setViberNo(e.target.value)}
            className="gf-input"
          />
        </Question>

        <Question label="မှတ်ပုံတင် (NRC) ပုံ" required helper="ရှေ့ဘက် + နောက်ဘက် နှစ်ပုံ တင်ပါ။">
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <PhotoField
              label="ရှေ့ဘက်"
              value={nrcFront}
              onPick={(f) => handlePhoto(f, "nrc-front", setNrcFront)}
              onClear={() => setNrcFront(null)}
            />
            <PhotoField
              label="နောက်ဘက်"
              value={nrcBack}
              onPick={(f) => handlePhoto(f, "nrc-back", setNrcBack)}
              onClear={() => setNrcBack(null)}
            />
          </div>
        </Question>

        <Question label="အလှပုံ ၄ ပုံ" required helper="Portrait ၄ ပုံ တိတိကျကျ တင်ပါ။">
          <div className="mt-3 grid grid-cols-2 gap-3">
            {portraits.map((p, i) => (
              <PhotoField
                key={i}
                label={`Portrait ${i + 1}`}
                value={p}
                onPick={(f) => handlePhoto(f, `portrait-${i + 1}` as PhotoSlot, (v) => setPortrait(i, v))}
                onClear={() => setPortrait(i, null)}
              />
            ))}
          </div>
        </Question>

        <Question label="အနုပညာ လုပ်ဆောင်ချက် — short statement" required>
          <textarea
            required
            rows={5}
            placeholder="သင်ဘယ်လို artist မျိုးလဲ၊ ဘာတွေ လုပ်ဖူးလဲ။"
            value={artStatement}
            onChange={(e) => setArtStatement(e.target.value)}
            className="gf-textarea"
          />
        </Question>

        <Question label="Experience (optional)" helper="ရှိရင်သာ ထည့်ပါ — entry အများကြီး ထည့်လို့ရတယ်။">
          <div className="mt-3 flex flex-col gap-3">
            {experience.map((exp, idx) => (
              <div key={idx} className="rounded-md border border-border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-muted">
                    Entry {idx + 1}
                  </span>
                  {experience.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setExperience((prev) => prev.filter((_, i) => i !== idx))}
                      className="gf-btn-text"
                      style={{ height: 28, padding: "0 8px" }}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input
                    placeholder="Role / title"
                    value={exp.title}
                    onChange={(e) => updateExp(idx, { title: e.target.value })}
                    className="gf-input"
                  />
                  <input
                    placeholder="Organization / event"
                    value={exp.organization}
                    onChange={(e) => updateExp(idx, { organization: e.target.value })}
                    className="gf-input"
                  />
                  <input
                    placeholder="Period (e.g. 2024 — 2025)"
                    value={exp.period}
                    onChange={(e) => updateExp(idx, { period: e.target.value })}
                    className="gf-input sm:col-span-2"
                  />
                  <textarea
                    placeholder="ဘာတွေ လုပ်ခဲ့လဲ"
                    rows={2}
                    value={exp.description}
                    onChange={(e) => updateExp(idx, { description: e.target.value })}
                    className="gf-textarea sm:col-span-2"
                  />
                </div>
              </div>
            ))}
            <div>
              <button
                type="button"
                onClick={() => setExperience((prev) => [...prev, { ...EMPTY_EXP }])}
                className="gf-btn-outline"
              >
                + Add entry
              </button>
            </div>
          </div>
        </Question>

        <div className="mt-1 flex items-center justify-between px-1">
          <button type="submit" disabled={busy} className="gf-btn-primary">
            {busy ? "Submitting…" : "Submit"}
          </button>
          <button type="button" onClick={resetForm} className="gf-btn-text">
            Clear form
          </button>
        </div>

        <p className="text-on-stage mt-1 px-1 text-xs">
          Never submit passwords through this form.
        </p>
      </form>

      <footer className="text-on-stage mt-6 px-2 text-center text-xs">
        MFATC Studio · Yangon ·{" "}
        <Link href="/admin/login" className="gf-link">
          Admin
        </Link>
      </footer>
      </main>
    </div>
  );
}

function Question({
  label,
  helper,
  required,
  children,
}: {
  label: string;
  helper?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="gf-card">
      <div className="gf-question">
        {label}
        {required && <span className="required-mark">*</span>}
      </div>
      {helper && <p className="mt-1 gf-helper">{helper}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function PhotoField({
  label,
  value,
  onPick,
  onClear,
}: {
  label: string;
  value: PhotoState;
  onPick: (file: File | undefined) => void;
  onClear: () => void;
}) {
  if (value && (value.status === "uploading" || value.status === "ready" || value.status === "error")) {
    return (
      <div>
        <div className="mb-1.5 text-xs text-muted">{label}</div>
        <div className="flex items-center gap-3 rounded-md border border-border p-2">
          {value.preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value.preview} alt={label} className="size-14 flex-none rounded object-cover" />
          ) : (
            <div className="size-14 flex-none rounded bg-surface-alt" aria-hidden />
          )}
          <div className="flex-1 text-xs">
            {value.status === "uploading" && <span className="text-muted">Uploading…</span>}
            {value.status === "ready" && <span className="text-muted">Uploaded</span>}
            {value.status === "error" && (
              <span style={{ color: "var(--gf-required)" }}>Failed — {value.message}</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClear}
            disabled={value.status === "uploading"}
            className="gf-btn-text"
            style={{ height: 28, padding: "0 8px" }}
          >
            {value.status === "error" ? "Retry" : "Remove"}
          </button>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="mb-1.5 text-xs text-muted">{label}</div>
      <label className="flex h-13 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-(--gf-border-strong) px-3 text-sm text-primary transition hover:bg-(--gf-primary-tint)">
        <span aria-hidden>＋</span>
        <span>Add file</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0])}
        />
      </label>
    </div>
  );
}
