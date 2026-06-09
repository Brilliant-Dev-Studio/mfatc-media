import { getCurrentAdmin } from "@/lib/auth";
import { setSelected } from "@/lib/mock-store";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  const body = (await request.json().catch(() => null)) as { selected?: boolean } | null;
  if (body == null || typeof body.selected !== "boolean") {
    return Response.json({ error: "Body must include { selected: boolean }" }, { status: 400 });
  }

  const ok = await setSelected(id, body.selected);
  if (!ok) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({ id, selected: body.selected });
}
