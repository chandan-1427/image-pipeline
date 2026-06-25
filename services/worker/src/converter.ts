import sharp from "sharp";

export type ProgressCallback = (percent: number) => void;

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export function getMimeType(format: string): string {
  return MIME_TYPES[format] ?? "image/jpeg";
}

export async function convertImage(
  inputBuffer: Buffer,
  targetFormat: string,
  onProgress: ProgressCallback
): Promise<Buffer> {
  // sharp doesn't emit real progress so we simulate meaningful steps
  onProgress(10);

  const image = sharp(inputBuffer);

  onProgress(40);

  let outputBuffer: Buffer;

  switch (targetFormat) {
    case "jpg":
    case "jpeg":
      outputBuffer = await image.jpeg({ quality: 90 }).toBuffer();
      break;
    case "png":
      outputBuffer = await image.png().toBuffer();
      break;
    case "webp":
      outputBuffer = await image.webp({ quality: 90 }).toBuffer();
      break;
    case "gif":
      outputBuffer = await image.gif().toBuffer();
      break;
    case "bmp":
      throw new Error("BMP output is not supported by sharp. Please choose another format.");
    default:
      throw new Error(`Unsupported target format: ${targetFormat}`);
  }

  onProgress(90);

  return outputBuffer;
}