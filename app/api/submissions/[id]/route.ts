import { getCurrentAdmin } from "@/lib/auth";
import { deleteSubmission } from "@/lib/mock-store";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  const ok = await deleteSubmission(id);
  if (!ok) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({ deleted: id });
}
