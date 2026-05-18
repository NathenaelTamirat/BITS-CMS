const iframeSourcePattern = /src=["']([^"']+)["']/i;

function extractVideoId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    return url.pathname.slice(1) || null;
  }

  if (
    host !== "youtube.com" &&
    host !== "m.youtube.com" &&
    host !== "youtube-nocookie.com"
  ) {
    return null;
  }

  if (url.pathname === "/watch") {
    return url.searchParams.get("v");
  }

  if (url.pathname.startsWith("/embed/")) {
    return url.pathname.split("/")[2] || null;
  }

  if (url.pathname.startsWith("/shorts/")) {
    return url.pathname.split("/")[2] || null;
  }

  return null;
}

export function normalizeYouTubeInput(input: string): string | null {
  const trimmed = input.trim();
  const iframeMatch = trimmed.match(iframeSourcePattern);
  const rawUrl = iframeMatch?.[1] ?? trimmed;

  try {
    const url = new URL(rawUrl);
    const videoId = extractVideoId(url);

    if (!videoId) {
      return null;
    }

    return `https://www.youtube.com/embed/${videoId}`;
  } catch {
    return null;
  }
}
