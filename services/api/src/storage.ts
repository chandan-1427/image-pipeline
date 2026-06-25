import { createClient } from "@supabase/supabase-js";

function createStorageClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function uploadSourceImage(
  buffer: Buffer,
  path: string,
  mimeType: string
): Promise<string> {
  const supabase = createStorageClient();
  const { error } = await supabase.storage
    .from(process.env.SOURCE_BUCKET!)
    .upload(path, buffer, { contentType: mimeType, upsert: true });

  if (error) throw new Error(`Source upload failed: ${error.message}`);

  return path;
}