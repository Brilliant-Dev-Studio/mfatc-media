import { presignPut, S3_UPLOAD_PREFIX, s3Configured } from "@/lib/s3";

const ALLOWED_SLOTS = new Set([
  "nrc-front",
  "nrc-back",
  "portrait-1",
  "portrait-2",
  "portrait-3",
  "portrait-4",
]);

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  if (!s3Configured()) {
    return Response.json({ error: "S3 not configured on server" }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as
    | { slot?: string; contentType?: string }
    | null;
  if (!body) return Response.json({ error: "Invalid body" }, { status: 400 });

  const slot = String(body.slot ?? "");
  const contentType = String(body.contentType ?? "");

  if (!ALLOWED_SLOTS.has(slot)) {
    return Response.json({ error: "Invalid slot" }, { status: 400 });
  }
  const ext = ALLOWED_TYPES[contentType];
  if (!ext) {
    return Response.json({ error: "Unsupported contentType" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const key = `${S3_UPLOAD_PREFIX}/${id}/${slot}.${ext}`;
  const { url, expiresIn } = await presignPut(key, contentType);

  return Response.json({ uploadUrl: url, key, expiresIn });
}
