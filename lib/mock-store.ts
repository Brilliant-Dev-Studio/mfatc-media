import type { Submission, SubmissionInput } from "./types";

type Store = { v: number; byId: Map<string, Submission>; ordered: string[] };

const SEED_VERSION = 3;

const g = globalThis as unknown as { __mfatcStore?: Store };
function getStore(): Store {
  if (!g.__mfatcStore || g.__mfatcStore.v !== SEED_VERSION) {
    g.__mfatcStore = { v: SEED_VERSION, byId: new Map(), ordered: [] };
    seed(g.__mfatcStore);
  }
  return g.__mfatcStore;
}

function seedKey(idx: number, slot: string): string {
  // S3-style key for seed entries; matches the regex enforced server-side.
  // These objects do NOT exist in the bucket — signed GETs will 403 in the
  // admin UI for seed rows. Real submissions upload their own keys.
  return `submissions/seed-${String(idx).padStart(3, "0")}/${slot}.jpg`;
}

const FIRST_NAMES = ["Aye", "Hnin", "Khin", "May", "Nan", "Phyu", "Su", "Thiri", "Wai", "Yamin", "Zin", "Nora", "Lin", "Hsu", "Ei", "Cho", "Kay", "Pwint"];
const LAST_NAMES = ["Aung", "Min", "Hlaing", "Phyo", "Soe", "Win", "Htut", "Naing", "Zaw", "Oo", "Kyaw", "Tun", "Maung", "Latt", "Khant"];
const PHRASES = [
  "သီချင်းတေးရေး၊ ပန်းချီနဲ့ မိမိရဲ့ ခံစားချက်ကို ဖော်ပြခြင်း။",
  "Stage performance က ကျမအတွက် အသက်လေး။ Modern dance ကို ၃ နှစ်ကြာသင်ထားပါတယ်။",
  "Photography နဲ့ short film တို့ကို သီးခြားအနေနဲ့ စိတ်ပါဝင်စားပါတယ်။",
  "Acting workshop ၂ ခုတက်ပြီးပါပြီ၊ commercial shoot ၃ ခုလုပ်ဖူးပါတယ်။",
  "Fashion modeling နဲ့ runway walk training အပြည့်ရှိပါတယ်။",
  "MC, host, voice-over အလုပ်တွေကို တာဝန်ယူဖူးပါတယ်။",
  "Make-up artistry ကို professional level သင်ထားပြီးပါပြီ။",
  "ပိုစတာ၊ digital painting နဲ့ tattoo design တွေ လုပ်ဖူးပါတယ်။",
];

function seed(store: Store) {
  const now = Date.now();
  for (let i = 0; i < 32; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[(i * 3) % LAST_NAMES.length];
    const name = `${first} ${last}`;
    const id = `sub_${(now - i * 86_400_000).toString(36)}_${i}`;
    const age = 19 + (i % 18);
    const birthYear = new Date().getFullYear() - age;
    const birthMonth = String(1 + (i % 12)).padStart(2, "0");
    const birthDay = String(1 + (i % 28)).padStart(2, "0");
    const sub: Submission = {
      id,
      createdAt: new Date(now - i * 86_400_000 - i * 3_600_000).toISOString(),
      name,
      age,
      birthday: `${birthYear}-${birthMonth}-${birthDay}`,
      aboutYourself: `${first} လို့ခေါ်ပါတယ်။ Yangon မှာ နေပါတယ်။ ${age} နှစ်ပါ။ ${i % 2 === 0 ? "Performing arts ကို လေ့လာဖူးတယ်။" : "Visual arts ဘက်က ပိုစိတ်ဝင်စားတယ်။"} ${PHRASES[(i + 2) % PHRASES.length]}`,
      facebookLink: `https://facebook.com/${first.toLowerCase()}.${last.toLowerCase()}.${i}`,
      viberNo: `+9597${(100000 + i * 1234).toString().slice(0, 7)}`,
      nrcFront: seedKey(i, "nrc-front"),
      nrcBack: seedKey(i, "nrc-back"),
      portraits: [
        seedKey(i, "portrait-1"),
        seedKey(i, "portrait-2"),
        seedKey(i, "portrait-3"),
        seedKey(i, "portrait-4"),
      ],
      artStatement: PHRASES[i % PHRASES.length],
      experience: [
        {
          title: i % 2 === 0 ? "Lead Dancer" : "Featured Model",
          organization: i % 2 === 0 ? "Yangon Stage Collective" : "Mandalay Fashion Week",
          period: `202${3 - (i % 3)} — 202${4 - (i % 2)}`,
          description: "Live shows, brand collaborations, editorial shoots ပါဝင်ခဲ့သည်။",
        },
        ...(i % 3 === 0
          ? [
              {
                title: "Workshop Attendee",
                organization: "Open Studio MM",
                period: "2024",
                description: "Acting + improv ၈ ပတ်စာ workshop။",
              },
            ]
          : []),
      ],
    };
    store.byId.set(id, sub);
    store.ordered.push(id);
  }
}

export type ListField = "all" | "name" | "facebook" | "viber" | "art";

export function listSubmissions(opts: {
  page?: number;
  pageSize?: number;
  q?: string;
  field?: ListField;
}) {
  const store = getStore();
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, opts.pageSize ?? 10));
  const q = (opts.q ?? "").trim().toLowerCase();
  const field = opts.field ?? "all";

  const filtered = store.ordered
    .map((id) => store.byId.get(id)!)
    .filter((s) => {
      if (!q) return true;
      const haystack =
        field === "name"
          ? s.name
          : field === "facebook"
            ? s.facebookLink
            : field === "viber"
              ? s.viberNo
              : field === "art"
                ? `${s.artStatement} ${s.aboutYourself}`
                : `${s.name} ${s.facebookLink} ${s.viberNo} ${s.artStatement} ${s.aboutYourself} ${s.id}`;
      return haystack.toLowerCase().includes(q);
    });

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const items = filtered.slice((page - 1) * pageSize, page * pageSize);
  return { items, total, page, pageSize, pageCount };
}

export function createSubmission(input: SubmissionInput): Submission {
  const store = getStore();
  const id = `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const sub: Submission = { id, createdAt: new Date().toISOString(), ...input };
  store.byId.set(id, sub);
  store.ordered.unshift(id);
  return sub;
}
