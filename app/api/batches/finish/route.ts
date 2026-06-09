import { getCurrentAdmin } from "@/lib/auth";
import { finishBatch } from "@/lib/mock-store";

export async function POST() {
  const admin = await getCurrentAdmin();
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const newBatch = await finishBatch();
  return Response.json({ newBatch });
}
