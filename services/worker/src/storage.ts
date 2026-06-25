import { createClient } from "@supabase/supabase-js";

export function createStorageClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function downloadImage(
  sourcePath: string,
  sourceBucket: string
): Promise<Buffer> {
  const supabase = createStorageClient();
  const { data, error } = await supabase.storage
    .from(sourceBucket)
    .download(sourcePath);

  if (error || !data) throw new Error(`Download failed: ${error?.message}`);

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function uploadImage(
  buffer: Buffer,
  targetPath: string,
  targetBucket: string,
  mimeType: string
): Promise<string> {
  const supabase = createStorageClient();
  const { error } = await supabase.storage
    .from(targetBucket)
    .upload(targetPath, buffer, { contentType: mimeType, upsert: true });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(targetBucket).getPublicUrl(targetPath);
  return data.publicUrl;
}