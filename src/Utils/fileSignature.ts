// Validate uploaded files by inspecting their actual bytes (magic numbers),
// not just the declared `mimetype` from the client. Mirrors the allow-list in
// src/Routes/media.ts so a spoofed Content-Type cannot bypass the filter.

const SIGNATURES: ReadonlyArray<{
  mimeType: string;
  test: (buffer: Uint8Array) => boolean;
}> = [
  {
    mimeType: "image/jpeg",
    test: (buffer) =>
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff,
  },
  {
    mimeType: "image/png",
    test: (buffer) =>
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a,
  },
  {
    mimeType: "image/gif",
    test: (buffer) => {
      if (buffer.length < 6) {
        return false;
      }

      const header = String.fromCharCode(
        buffer[0],
        buffer[1],
        buffer[2],
        buffer[3],
        buffer[4],
        buffer[5],
      );

      return header === "GIF87a" || header === "GIF89a";
    },
  },
  {
    mimeType: "image/webp",
    test: (buffer) =>
      buffer.length >= 12 &&
      buffer[0] === 0x52 && // R
      buffer[1] === 0x49 && // I
      buffer[2] === 0x46 && // F
      buffer[3] === 0x46 && // F
      buffer[8] === 0x57 && // W
      buffer[9] === 0x45 && // E
      buffer[10] === 0x42 && // B
      buffer[11] === 0x50, // P
  },
  {
    mimeType: "video/mp4",
    test: (buffer) =>
      buffer.length >= 12 &&
      buffer[4] === 0x66 && // f
      buffer[5] === 0x74 && // t
      buffer[6] === 0x79 && // y
      buffer[7] === 0x70, // p
  },
  {
    mimeType: "application/pdf",
    test: (buffer) =>
      buffer.length >= 5 &&
      buffer[0] === 0x25 && // %
      buffer[1] === 0x50 && // P
      buffer[2] === 0x44 && // D
      buffer[3] === 0x46 && // F
      buffer[4] === 0x2d, // -
  },
];

export function detectMimeType(buffer: Uint8Array): string | null {
  for (const signature of SIGNATURES) {
    if (signature.test(buffer)) {
      return signature.mimeType;
    }
  }

  return null;
}
