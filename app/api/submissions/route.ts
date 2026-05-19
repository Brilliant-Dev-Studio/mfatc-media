import type { NextRequest } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { createSubmission, deleteAllSubmissions, listSubmissions, type ListField } from "@/lib/mock-store";
import { objectExists, presignGet, s3Configured } from "@/lib/s3";
import type { Submission, SubmissionInput } from "@/lib/types";

const S3_KEY_RE = /^submissions\/[\w-]+\/(nrc-(front|back)|portrait-[1-4])\.(jpe?g|png|webp)$/i;

function isS3Key(v: unknown): v is string {
  return typeof v === "string" && S3_KEY_RE.test(v);
}

async function signSubmission(sub: Submission): Promise<Submission> {
  if (!s3Configured()) return sub;
  const [nrcFront, nrcBack, ...portraits] = await Promise.all([
    presignGet(sub.nrcFront),
    presignGet(sub.nrcBack),
    ...sub.portraits.map((p) => presignGet(p)),
  ]);
  return { ...sub, nrcFront, nrcBack, portraits };
}

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const data = await listSubmissions({
    page: Number(sp.get("page")) || 1,
    pageSize: Number(sp.get("pageSize")) || 10,
    q: sp.get("q") ?? "",
    field: (sp.get("field") as ListField) ?? "all",
  });

  const items = await Promise.all(data.items.map(signSubmission));
  return Response.json({ ...data, items });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Partial<SubmissionInput> | null;
  if (!body) return Response.json({ error: "Invalid body" }, { status: 400 });

  const errors: string[] = [];

  if (typeof body.name !== "string" || body.name.trim().length < 2) {
    errors.push("Name အပြည့်အစုံ ထည့်ပါ။");
  }
  if (typeof body.fatherName !== "string" || body.fatherName.trim().length < 1) {
    errors.push("အဖေနာမည် ထည့်ပါ။");
  }
  if (typeof body.motherName !== "string" || body.motherName.trim().length < 1) {
    errors.push("အမေနာမည် ထည့်ပါ။");
  }
  if (typeof body.stageName !== "string" || body.stageName.trim().length < 1) {
    errors.push("အနုပညာ လုပ်ရှားမှု အမည် ထည့်ပါ။");
  }
  const ageNum = Number(body.age);
  if (!Number.isFinite(ageNum) || ageNum < 18 || ageNum > 28) {
    errors.push("Age (18–28) မှန်ကန်စွာ ထည့်ပါ။");
  }
  if (typeof body.birthday !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.birthday)) {
    errors.push("Birthday (YYYY-MM-DD) မှန်ကန်စွာ ထည့်ပါ။");
  } else {
    const bd = new Date(body.birthday);
    if (Number.isNaN(bd.getTime()) || bd.getTime() > Date.now()) {
      errors.push("Birthday မှန်ကန်စွာ ထည့်ပါ။");
    }
  }
  if (typeof body.address !== "string" || body.address.trim().length < 2) {
    errors.push("နေရပ်လိပ်စာ ထည့်ပါ။");
  }
  if (typeof body.aboutYourself !== "string" || body.aboutYourself.trim().length < 10) {
    errors.push("About yourself စာပိုဒ်တို ထည့်ပါ။");
  }
  if (typeof body.facebookLink !== "string" || !/^https?:\/\//i.test(body.facebookLink)) {
    errors.push("Facebook link မှန်ကန်စွာ ထည့်ပါ။");
  }
  if (typeof body.phoneNo !== "string" || body.phoneNo.trim().length < 5) {
    errors.push("ဆက်သွယ်ရန် ဖုန်းနံပါတ် ထည့်ပါ။");
  }
  if (typeof body.viberNo !== "string" || body.viberNo.trim().length < 5) {
    errors.push("Viber number ထည့်ပါ။");
  }
  if (typeof body.lifeGoal !== "string" || body.lifeGoal.trim().length < 2) {
    errors.push("သင့်ဘဝရည်မှန်းချက် ထည့်ပါ။");
  }
  if (typeof body.admiredArtist !== "string" || body.admiredArtist.trim().length < 1) {
    errors.push("အားကျသော အနုပညာရှင်အမည် ထည့်ပါ။");
  }
  if (typeof body.canComplete !== "boolean") {
    errors.push("သင်တန်းကာလ ပြီးဆုံးအောင် တက်ရောက်နိုင်မှု ဖြေပါ။");
  }
  if (typeof body.familyApproval !== "boolean") {
    errors.push("မိသားစုမှ ခွင့်ပြုမှု ဖြေပါ။");
  }
  if (!isS3Key(body.nrcFront) || !isS3Key(body.nrcBack)) {
    errors.push("မှတ်ပုံတင် ရှေ့+နောက် ပုံ ၂ ပုံ တင်ပါ။");
  }
  if (!Array.isArray(body.portraits) || body.portraits.length !== 4 || !body.portraits.every((p) => isS3Key(p))) {
    errors.push("အလှပုံ ၄ ပုံ တိတိကျကျ တင်ပါ။");
  }
  if (typeof body.artStatement !== "string" || body.artStatement.trim().length < 10) {
    errors.push("အနုပညာ လုပ်ဆောင်ချက် စာပိုဒ်တို ထည့်ပါ။");
  }
  if (!Array.isArray(body.experience)) {
    errors.push("Experience entry အနည်းဆုံး ၁ ခု ထည့်ပါ။");
  }

  if (errors.length) return Response.json({ errors }, { status: 422 });

  // Defense in depth: verify each declared key actually exists on S3 before
  // persisting the submission. Prevents fake-key payloads from polluting the store.
  if (s3Configured()) {
    const keys = [body.nrcFront!, body.nrcBack!, ...(body.portraits as string[])];
    const checks = await Promise.all(keys.map(objectExists));
    if (checks.some((ok) => !ok)) {
      return Response.json(
        { errors: ["တင်ထားသော ပုံတွေ S3 ပေါ်မှာ မတွေ့ပါ။ ပြန်တင်ပြီး ထပ်ကြိုးစားပါ။"] },
        { status: 422 },
      );
    }
  }

  const created = await createSubmission({
    name: body.name!.trim(),
    fatherName: body.fatherName!.trim(),
    motherName: body.motherName!.trim(),
    stageName: body.stageName!.trim(),
    age: ageNum,
    birthday: body.birthday!,
    address: body.address!.trim(),
    aboutYourself: body.aboutYourself!.trim(),
    facebookLink: body.facebookLink!,
    phoneNo: body.phoneNo!.trim(),
    viberNo: body.viberNo!.trim(),
    lifeGoal: body.lifeGoal!.trim(),
    admiredArtist: body.admiredArtist!.trim(),
    canComplete: body.canComplete as boolean,
    familyApproval: body.familyApproval as boolean,
    nrcFront: body.nrcFront!,
    nrcBack: body.nrcBack!,
    portraits: body.portraits as string[],
    artStatement: body.artStatement!.trim(),
    experience: (body.experience ?? []).map((e) => ({
      title: String(e?.title ?? "").trim(),
      organization: String(e?.organization ?? "").trim(),
      period: String(e?.period ?? "").trim(),
      description: String(e?.description ?? "").trim(),
    })),
  });

  return Response.json({ submission: created }, { status: 201 });
}

export async function DELETE() {
  const admin = await getCurrentAdmin();
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const deleted = await deleteAllSubmissions();
  return Response.json({ deleted });
}
