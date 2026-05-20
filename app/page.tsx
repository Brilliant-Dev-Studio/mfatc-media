"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { fileToThumbnailBlob } from "@/lib/image";
import type { ExperienceEntry } from "@/lib/types";

const STAGE_BG_BLUR =
  "data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADQAQCdASoQAA0ABABoJbACdAENUuVkAAD+lgt9O3jRVAQM26/xZH/W3T+PdjsfTNc5rggA";

const CURTAIN_LEFT_BLUR =
  "data:image/webp;base64,UklGRgQBAABXRUJQVlA4WAoAAAAQAAAACwAADgAAQUxQSIQAAAABgFvb1rLo/t+/FqnThUbuEFMAdWgVUgANkBGReQF8Ge5k4+7zcce+qSEiJmD0Nqnlg4Xu/RmLkoq/FZfOMT8+1fvrOy+jkFQ8ncihB0Lyk3f1as6EgOQbWxAwBCCpngKwmMAvlmDizzEbEPh704aAdteBqVtsLTB0Z9Z/HJsQ0KbcMHRWUDggWgAAAHACAJ0BKgwADwAEAGglsAJ0MEAIisvznHrmZQAA8KBxPAjy0tBmpImie1X2zFj9pxUIJHDHZ/S1eSghF9D8lQS37fnBmQOrvC837Y4etF/MWOXfbiH7MCAAAA==";

const CURTAIN_RIGHT_BLUR =
  "data:image/webp;base64,UklGRgABAABXRUJQVlA4WAoAAAAQAAAACwAADgAAQUxQSIMAAAABgFvbtqpqP0EyYgYZgzpogkELVEBGA2Se04C7NaCRuzvEDvdtvtYQEeGaVVtei9Fkjwyi1hM1XqYnCnbh1HgXpHiwI8NxpkahCfYgw+wpNe/8gSxBQpJPdgFIigq7eP0CIMNHdn5LMGbZ/g0JamX1ByrC+78Smqu/wGL2V0Li8J/NDQBWUDggVgAAAPABAJ0BKgwADwAEAGglsAJ0MEWAraESGADL9NRym/P7SS62XRf9XbH5sKxGLsMLnS+7lhNVJlxNGVhpiJIzGvouN/vG0/BdzPWy/t0N52DilWACfAAA";

function StageBackground() {
  return (
    <div className="stage-bg" aria-hidden>
      <Image
        src="/mfatc_background.png"
        alt=""
        fill
        priority
        sizes="100vw"
        placeholder="blur"
        blurDataURL={STAGE_BG_BLUR}
        className="stage-bg-img"
      />
    </div>
  );
}

function StageCurtains() {
  return (
    <>
      <Image
        src="/Gemini_Generated_Image_kxdflakxdflakxdf-removebg-preview.png"
        alt=""
        aria-hidden
        width={191}
        height={243}
        priority
        placeholder="blur"
        blurDataURL={CURTAIN_LEFT_BLUR}
        sizes="(max-width: 480px) 36vw, 32vw"
        className="stage-curtain stage-curtain-left"
      />
      <Image
        src="/Gemini_Generated_Image_1oiujm1oiujm1oiu-removebg-preview.png"
        alt=""
        aria-hidden
        width={191}
        height={236}
        priority
        placeholder="blur"
        blurDataURL={CURTAIN_RIGHT_BLUR}
        sizes="(max-width: 480px) 36vw, 32vw"
        className="stage-curtain stage-curtain-right"
      />
    </>
  );
}

type PhotoSlot = "nrc-front" | "nrc-back" | "portrait-1" | "portrait-2" | "portrait-3" | "portrait-4";

type PhotoState =
  | null
  | { status: "uploading"; preview: string }
  | { status: "ready"; key: string; preview: string }
  | { status: "error"; preview: string; message: string };


const EMPTY_EXP: ExperienceEntry = { title: "", organization: "", period: "" };

export default function FormPage() {
  const [name, setName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [stageName, setStageName] = useState("");
  const [age, setAge] = useState("");
  const [birthday, setBirthday] = useState("");
  const [address, setAddress] = useState("");
  const [aboutYourself, setAboutYourself] = useState("");
  const [facebookLink, setFacebookLink] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [viberNo, setViberNo] = useState("");
  const [lifeGoal, setLifeGoal] = useState("");
  const [admiredArtist, setAdmiredArtist] = useState("");
  const [canComplete, setCanComplete] = useState<boolean | null>(null);
  const [familyApproval, setFamilyApproval] = useState<boolean | null>(null);
  const [nrcFront, setNrcFront] = useState<PhotoState>(null);
  const [nrcBack, setNrcBack] = useState<PhotoState>(null);
  const [portraits, setPortraits] = useState<PhotoState[]>([null, null, null, null]);
  const [artStatement, setArtStatement] = useState("");
  const [experience, setExperience] = useState<ExperienceEntry[]>(() => [{ ...EMPTY_EXP }]);

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
    setFatherName("");
    setMotherName("");
    setStageName("");
    setAge("");
    setBirthday("");
    setAddress("");
    setAboutYourself("");
    setFacebookLink("");
    setPhoneNo("");
    setViberNo("");
    setLifeGoal("");
    setAdmiredArtist("");
    setCanComplete(null);
    setFamilyApproval(null);
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
    if (canComplete === null) {
      setErrors(["သင်တန်းကာလ ပြီးဆုံးအောင် တက်ရောက်နိုင်ခြင်း ရှိ/မရှိ ရွေးပါ။"]);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (familyApproval === null) {
      setErrors(["မိသားစုမှ ခွင့်ပြု/မပြု ရွေးပါ။"]);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setBusy(true);
    const payload = {
      name: name.trim(),
      fatherName: fatherName.trim(),
      motherName: motherName.trim(),
      stageName: stageName.trim(),
      age: Number(age),
      birthday,
      address: address.trim(),
      aboutYourself: aboutYourself.trim(),
      facebookLink: facebookLink.trim(),
      phoneNo: phoneNo.trim(),
      viberNo: viberNo.trim(),
      lifeGoal: lifeGoal.trim(),
      admiredArtist: admiredArtist.trim(),
      canComplete: canComplete === true,
      familyApproval: familyApproval === true,
      nrcFront: nrcFrontKey,
      nrcBack: nrcBackKey,
      portraits: portraitKeys as string[],
      artStatement: artStatement.trim(),
      experience: experience.filter((x) => x.title || x.period),
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
        <StageBackground />
        <StageCurtains />
        <main className="mx-auto w-full max-w-160 px-4 py-6 sm:py-10">
          <div className="gf-card gf-stripe-top">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/IMG_4294.png"
            alt="MFATC"
            className="mb-3 h-12 w-auto sm:h-14"
          />
          <h1 className="whitespace-nowrap text-[13px] font-normal leading-tight sm:text-[22px]">
            မြန်မာ့ရှပ်ရှင်သရုပ်ဆောင်မြှင့်တင်ရေးသင်တန်း
          </h1>
          <p className="mt-1 text-xs text-muted sm:text-sm">Myanmar Film Acting Promotion Course</p>
          <p className="mt-3 gf-helper">
            လျှောက်လွှာ တင်ပေးတဲ့အတွက် ကျေးဇူးတင်ပါတယ်။ MFATC team က
            မကြာခင် ဆက်သွယ်ပါမယ်။
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
              နောက်တစ်ခု ထပ်တင်မယ်
            </button>
          </div>
        </div>
        <footer className="text-on-stage mt-4 px-2 text-center text-xs leading-relaxed">
          <div className="font-medium">
            MFATC — မြန်မာ့ရှပ်ရှင်သရုပ်ဆောင်မြှင့်တင်ရေးသင်တန်း
          </div>
          <div>Myanmar Film Acting Promotion Course</div>
          <div className="mt-1">MFATC Studio · Yangon, Myanmar</div>
          <div className="mt-1">
            <a href="viber://add?number=95936536562" className="underline">
              Viber — 0936536562
            </a>
          </div>
          <div className="mt-1">
            <a href="mailto:myanmar.mfatc@gmail.com" className="underline">
              myanmar.mfatc@gmail.com
            </a>
          </div>
          <div className="mt-2 opacity-80">© 2026 MFATC. All rights reserved.</div>
        </footer>
        </main>
      </div>
    );
  }

  return (
    <div className="stage-page">
      <StageBackground />
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/IMG_4294.png"
            alt="MFATC"
            className="mb-3 h-12 w-auto sm:h-14"
          />
          <h1 className="whitespace-nowrap text-[13px] font-normal leading-tight sm:text-[22px]">
            မြန်မာ့ရှပ်ရှင်သရုပ်ဆောင်မြှင့်တင်ရေးသင်တန်း
          </h1>
          <p className="mt-1 text-xs text-muted sm:text-sm">Myanmar Film Acting Promotion Course</p>
          <div className="mt-4 gf-divider" />
          <div className="mt-3 flex flex-col gap-1.5 text-sm leading-relaxed">
            <p>
              MFATC (Myanmar Film Acting Promotion Course) သည် Yangon, Myanmar
              အခြေစိုက် ရုပ်ရှင် သရုပ်ဆောင် သင်တန်းတစ်ခု ဖြစ်ပါသည်။
              ဤစာမျက်နှာသည် သင်တန်းသား လျှောက်လွှာ form ဖြစ်ပါသည်။
            </p>
            <p className="gf-helper">
              လျှောက်ထားသူသည် မြန်မာနိုင်ငံသား အသက် ၁၈–၂၈ ကြား
              ဖြစ်ရန် လိုအပ်သဖြင့် မှတ်ပုံတင် (NRC) ပုံ ၂ ပုံကို
              <strong> သက်တမ်း + ပုဂ္ဂိုလ်ရေး စိစစ်ရေး အတွက်သာ </strong>
              ယူပါသည်။ ပြင်ပ မထုတ်ပါ။
            </p>
            <p className="gf-helper">
              သင့်ရဲ့ data များကို သင်တန်းသား စိစစ်ရေး / ဆက်သွယ်ရေး
              အတွက်သာ သုံးပါမည်။ စီးပွားရေး ရောင်းချမှု မရှိပါ။
            </p>
            <p className="gf-helper">
              ဆက်သွယ်ရန် —{" "}
              <a href="viber://add?number=95936536562" className="gf-link">
                Viber 0936536562
              </a>{" "}
              · MFATC Studio, Yangon, Myanmar
            </p>
          </div>
          <div className="mt-4 gf-divider" />
          <p className="mt-3 text-sm text-muted">
            <span className="required-mark">လိုအပ်*</span>
            <span className="ml-2">ပါတဲ့ အချက်တွေ ဖြည့်ပေးပါ။</span>
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

        <Question label="ဖခင်အမည်" required>
          <input
            type="text"
            required
            placeholder="ဥပမာ — ဦးအောင်"
            value={fatherName}
            onChange={(e) => setFatherName(e.target.value)}
            className="gf-input"
          />
        </Question>

        <Question label="မိခင်အမည်" required>
          <input
            type="text"
            required
            placeholder="ဥပမာ — ဒေါ်မြ"
            value={motherName}
            onChange={(e) => setMotherName(e.target.value)}
            className="gf-input"
          />
        </Question>

        <Question label="အနုပညာ လုပ်ရှားမှု အမည် (Stage name)" required>
          <input
            type="text"
            required
            placeholder="ဥပမာ — Aye Aye"
            value={stageName}
            onChange={(e) => setStageName(e.target.value)}
            className="gf-input"
          />
        </Question>

        <Question label="Age နဲ့ Birthday" required helper="Age က ၁၈–၂၈ ထဲက ဖြစ်ရမယ်။">
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col">
              <span className="gf-helper mb-1">Age</span>
              <input
                type="number"
                required
                inputMode="numeric"
                min={18}
                max={28}
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

        <Question
          label="နေရပ်လိပ်စာ"
          required
          helper="သင်တန်း ဆက်သွယ်ရေး / စာရွက်စာတမ်း ပို့ရန်သာ။"
        >
          <textarea
            required
            rows={2}
            placeholder="အိမ်အမှတ်၊ လမ်း၊ ရပ်ကွက်၊ မြို့နယ်၊ မြို့"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="gf-textarea"
          />
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

        <Question
          label="မှတ်ပုံတင် (NRC) ပုံ"
          required
          helper="သက်တမ်း (၁၈+) + သရုပ်ဆောင် စိစစ်ရေး အတွက်သာ — ပြင်ပ မထုတ်ပါ။ ရှေ့ဘက် + နောက်ဘက် နှစ်ပုံ တင်ပါ။"
        >
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

        <Question label="ဆက်သွယ်ရန် ဖုန်းနံပါတ်" required helper="Country code နဲ့ ထည့်ပါ — e.g. +95 9...">
          <input
            type="tel"
            required
            inputMode="tel"
            placeholder="+95 9..."
            value={phoneNo}
            onChange={(e) => setPhoneNo(e.target.value)}
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

        <Question label="သင့်ဘဝရည်မှန်းချက်" required>
          <textarea
            required
            rows={3}
            placeholder="သင်ဘယ်လို ဖြစ်ချင်လဲ၊ ဘယ်လို ရည်ရွယ်ချက် ရှိလဲ"
            value={lifeGoal}
            onChange={(e) => setLifeGoal(e.target.value)}
            className="gf-textarea"
          />
        </Question>

        <Question label="သင်အားကျလေးစားရသော အနုပညာရှင်အမည်" required>
          <input
            type="text"
            required
            placeholder="ဥပမာ — ..."
            value={admiredArtist}
            onChange={(e) => setAdmiredArtist(e.target.value)}
            className="gf-input"
          />
        </Question>

        <Question label="သင်တန်းကာလ ပြီးဆုံးအောင် တက်ရောက်နိုင်ခြင်း ရှိ/မရှိ" required>
          <div className="mt-2 flex flex-col gap-2 text-sm sm:flex-row sm:gap-6">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="canComplete"
                checked={canComplete === true}
                onChange={() => setCanComplete(true)}
                required
              />
              <span>ရှိ</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="canComplete"
                checked={canComplete === false}
                onChange={() => setCanComplete(false)}
              />
              <span>မရှိ</span>
            </label>
          </div>
        </Question>

        <Question
          label="မိသားစုမှ ခွင့်ပြု/မပြု"
          required
          helper="ကိုယ်တိုင် ဖြေဆိုခြင်း ဖြစ်ပါသည် — မိသားစုကို ဆက်သွယ်မှု မရှိပါ။"
        >
          <div className="mt-2 flex flex-col gap-2 text-sm sm:flex-row sm:gap-6">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="familyApproval"
                checked={familyApproval === true}
                onChange={() => setFamilyApproval(true)}
                required
              />
              <span>ခွင့်ပြု</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="familyApproval"
                checked={familyApproval === false}
                onChange={() => setFamilyApproval(false)}
              />
              <span>မပြု</span>
            </label>
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

        <Question label="တက်ရောက် ခဲ့သော သင်တန်းများ (optional)" helper="ရှိရင်သာ ထည့်ပါ — ၅ ခုအထိ ထည့်လို့ရတယ်။">
          <div className="mt-3 flex flex-col gap-3">
            {experience.map((exp, idx) => (
              <div key={idx} className="px-1 pt-2 pb-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-muted">
                    Entry {idx + 1} (optional)
                  </span>
                  {experience.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setExperience((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="gf-btn-text"
                    >
                      ဖျက်မယ်
                    </button>
                  )}
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input
                    placeholder="သင်တန်းတက်ခဲ့သော ခုနှစ်"
                    value={exp.period}
                    onChange={(e) => updateExp(idx, { period: e.target.value })}
                    className="gf-input"
                  />
                  <input
                    placeholder="သင်တန်း နာမည်"
                    value={exp.title}
                    onChange={(e) => updateExp(idx, { title: e.target.value })}
                    className="gf-input"
                  />
                </div>
              </div>
            ))}
            {experience.length < 5 && (
              <button
                type="button"
                onClick={() => setExperience((prev) => [...prev, { ...EMPTY_EXP }])}
                className="gf-btn-outline self-start"
              >
                + သင်တန်း ထပ်ထည့်မယ်
              </button>
            )}
          </div>
        </Question>

        <div className="mt-1 flex items-center justify-between px-1">
          <button type="submit" disabled={busy} className="gf-btn-primary">
            {busy ? "Submitting…" : "Submit"}
          </button>
          <button type="button" onClick={resetForm} className="gf-btn-text">
            ပြန်ရှင်းမယ်
          </button>
        </div>
      </form>

      <footer className="text-on-stage mt-6 px-2 text-center text-xs leading-relaxed">
        <div className="font-medium">
          MFATC — မြန်မာ့ရှပ်ရှင်သရုပ်ဆောင်မြှင့်တင်ရေးသင်တန်း
        </div>
        <div>Myanmar Film Acting Promotion Course</div>
        <div className="mt-1">MFATC Studio · Yangon, Myanmar</div>
        <div className="mt-1">
          <a href="viber://add?number=95936536562" className="underline">
            Viber — 0936536562
          </a>
        </div>
        <div className="mt-1">
          <a href="mailto:myanmar.mfatc@gmail.com" className="underline">
            myanmar.mfatc@gmail.com
          </a>
        </div>
        <div className="mt-2 opacity-80">© 2026 MFATC. All rights reserved.</div>
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
        {required && <span className="required-mark">လိုအပ်*</span>}
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
