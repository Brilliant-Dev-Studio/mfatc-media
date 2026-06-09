import { getCurrentAdmin } from "@/lib/auth";
import { getCurrentBatch } from "@/lib/mock-store";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const batch = await getCurrentBatch();
  return Response.json({ batch });
}
