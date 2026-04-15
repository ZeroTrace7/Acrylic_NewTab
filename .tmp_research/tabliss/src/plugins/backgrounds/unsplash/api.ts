import { Data, Image } from "./types";

export const officialCollection = 1053828;

type Config = Pick<
  Data,
  "by" | "collections" | "featured" | "search" | "topics"
>;

interface UnsplashItem {
  urls: {
    raw: string;
  };
  links: {
    html: string;
  };
  user: {
    name: string;
    links: {
      html: string;
    };
  };
  location?: {
    name?: string | null;
  } | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

function isValidUnsplashItem(item: unknown): item is UnsplashItem {
  if (!isRecord(item)) return false;
  if (!isRecord(item.urls) || typeof item.urls.raw !== "string") return false;
  if (!isRecord(item.links) || typeof item.links.html !== "string") return false;
  if (!isRecord(item.user)) return false;
  if (typeof item.user.name !== "string") return false;
  if (!isRecord(item.user.links) || typeof item.user.links.html !== "string")
    return false;

  if (item.location !== undefined && item.location !== null) {
    if (!isRecord(item.location)) return false;
    const locationName = item.location.name;
    if (
      locationName !== undefined &&
      locationName !== null &&
      typeof locationName !== "string"
    )
      return false;
  }

  return true;
}

export const fetchImages = async ({
  by,
  collections,
  topics,
  featured,
  search,
}: Config): Promise<Image[]> => {
  const url = "https://api.unsplash.com/photos/random";
  const params = new URLSearchParams();
  const headers = new Headers({
    Authorization: `Client-ID ${UNSPLASH_API_KEY}`,
  });

  params.set("count", "10");

  switch (by) {
    case "collections":
      params.set("collections", collections);
      break;

    case "topics":
      params.set("topics", topics);
      params.set("orientation", "landscape");
      break;

    case "search":
      params.set("orientation", "landscape");
      if (featured) params.set("featured", "true");
      if (search) params.set("query", search);
      break;

    default:
      params.set("collections", String(officialCollection));
  }

  const res = await fetch(`${url}?${params}`, { headers, cache: "no-cache" });
  if (!res.ok) {
    throw new Error(`Unsplash request failed with status ${res.status}`);
  }

  const body: unknown = await res.json();
  if (!Array.isArray(body)) {
    throw new Error("Unsplash API response is not an array");
  }

  const validItems = body.filter((item, index): item is UnsplashItem => {
    if (isValidUnsplashItem(item)) return true;
    console.warn(`Invalid Unsplash item dropped at index ${index}`, item);
    return false;
  });

  if (validItems.length === 0) {
    throw new Error("No valid Unsplash images found in response.");
  }

  return validItems.map((item) => ({
    src: item.urls.raw,
    credit: {
      imageLink: item.links.html,
      location: item.location?.name ?? undefined,
      userName: item.user.name,
      userLink: item.user.links.html,
    },
  }));
};

/**
 * Build image link from raw
 * TODO: allow quality to be adjustable, possibly in combination with size
 */
export const buildLink = (src: string): string => {
  const url = new URL(src);
  url.searchParams.set("q", "85");
  url.searchParams.set(
    "w",
    String(calculateWidth(window.innerWidth, window.devicePixelRatio)),
  );
  return String(url);
};

/**
 * Calculate width to fetch image, tuned for Unsplash cache performance.
 */
export function calculateWidth(screenWidth = 1920, pixelRatio = 1): number {
  // Consider a minimum resolution too
  screenWidth = screenWidth * pixelRatio; // Find true resolution
  screenWidth = Math.max(screenWidth, 1920); // Lower limit at 1920
  screenWidth = Math.min(screenWidth, 3840); // Upper limit at 4K
  screenWidth = Math.ceil(screenWidth / 240) * 240; // Snap up to nearest 240px for improved caching
  return screenWidth;
}
