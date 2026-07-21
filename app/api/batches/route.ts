import { getCurrentAdmin } from "@/lib/auth";
import { listBatchNumbers } from "@/lib/mock-store";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const batches = await listBatchNumbers();
  return Response.json({ batches });
}
