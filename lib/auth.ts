import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./auth-constants";
import type { AdminUser } from "./types";

export { SESSION_COOKIE };
const SESSION_MAX_AGE = 60 * 60 * 8;

const ADMIN_USER = process.env.ADMIN_USER ?? "admin";
const ADMIN_PASS = process.env.ADMIN_PASS ?? "admin123";
const SESSION_SECRET = process.env.SESSION_SECRET ?? "mfatc-dev-secret-change-me";

function b64url(bytes: Uint8Array | ArrayBuffer): string {
  const buf = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < buf.byteLength; i++) s += String.fromCharCode(buf[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out;
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return b64url(sig);
}

export async function signSession(user: AdminUser): Promise<string> {
  const payload = b64url(
    new TextEncoder().encode(JSON.stringify({ u: user.username, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE })),
  );
  const sig = await hmac(payload);
  return `${payload}.${sig}`;
}

export async function verifySession(token: string | undefined): Promise<AdminUser | null> {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = await hmac(payload);
  if (expected !== sig) return null;
  try {
    const data = JSON.parse(new TextDecoder().decode(b64urlDecode(payload))) as {
      u: string;
      exp: number;
    };
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    return { username: data.u };
  } catch {
    return null;
  }
}

export function checkCredentials(username: string, password: string): AdminUser | null {
  if (username === ADMIN_USER && password === ADMIN_PASS) return { username };
  return null;
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  return verifySession(token);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
  secure: process.env.NODE_ENV === "production",
};
