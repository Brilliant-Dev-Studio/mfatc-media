import { cookies } from "next/headers";
import { checkCredentials, SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { username?: string; password?: string }
    | null;

  if (!body?.username || !body?.password) {
    return Response.json({ error: "Username နဲ့ password ထည့်ပါ။" }, { status: 400 });
  }

  const user = checkCredentials(body.username, body.password);
  if (!user) {
    return Response.json({ error: "Username သို့မဟုတ် password မှား။" }, { status: 401 });
  }

  const token = await signSession(user);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, sessionCookieOptions);

  return Response.json({ user });
}
