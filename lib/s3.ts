import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION ?? "ap-southeast-1";
const bucket = process.env.S3_BUCKET ?? "";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID ?? "";
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY ?? "";
const prefix = process.env.S3_UPLOAD_PREFIX ?? "submissions";
const putTtl = Number(process.env.S3_PUT_TTL_SECONDS) || 300;
const getTtl = Number(process.env.S3_GET_TTL_SECONDS) || 900;

const g = globalThis as unknown as { __mfatcS3?: S3Client };
function client(): S3Client {
  if (!g.__mfatcS3) {
    g.__mfatcS3 = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return g.__mfatcS3;
}

export const S3_BUCKET = bucket;
export const S3_UPLOAD_PREFIX = prefix;

export function s3Configured(): boolean {
  return Boolean(bucket && accessKeyId && secretAccessKey);
}

export async function presignPut(key: string, contentType: string): Promise<{ url: string; expiresIn: number }> {
  const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  const url = await getSignedUrl(client(), cmd, { expiresIn: putTtl });
  return { url, expiresIn: putTtl };
}

export async function presignGet(key: string): Promise<string> {
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client(), cmd, { expiresIn: getTtl });
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    await client().send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}
