export async function fileToThumbnail(file: File, maxDim = 480, quality = 0.78): Promise<string> {
  const canvas = await drawResized(file, maxDim);
  return canvas.toDataURL("image/jpeg", quality);
}

export async function fileToThumbnailBlob(
  file: File,
  maxDim = 480,
  quality = 0.78,
): Promise<{ blob: Blob; contentType: "image/jpeg" }> {
  const canvas = await drawResized(file, maxDim);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) throw new Error("canvas.toBlob returned null");
  return { blob, contentType: "image/jpeg" };
}

async function drawResized(file: File, maxDim: number): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return canvas;
}
