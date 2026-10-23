// Link page: the authored links, the add/remove rules and the browser-local store of the edited list.
import { browserStorage, createLocalStore } from "@/lib/local-store";

export type LinkItem = { id: string; label: string; url: string };

export const STORAGE_KEY = "linktree-v2";
export const DEFAULT_LINKS: LinkItem[] = [
  { id: "1", label: "Portfolio / bookchaowalit.com", url: "https://bookchaowalit.com" },
  { id: "2", label: "Code / github", url: "https://github.com/bookchaowalit" },
  { id: "3", label: "Writing / knowledge hub", url: "https://knowledgehub.bookchaowalit.com" },
];

/** The normalised http(s) URL, or null for anything else (javascript:, data:, mailto:, typos). */
export function normalizeUrl(raw: string): string | null {
  try {
    const parsed = new URL(raw.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

/** Appends a link; a blank label or a URL that is not http(s) changes nothing (same array back). */
export function addLink(links: LinkItem[], label: string, url: string, id: string): LinkItem[] {
  const cleanLabel = label.trim();
  const cleanUrl = normalizeUrl(url);
  if (!cleanLabel || !cleanUrl) return links;
  return [...links, { id, label: cleanLabel, url: cleanUrl }];
}

export function removeLink(links: LinkItem[], id: string): LinkItem[] {
  return links.filter((link) => link.id !== id);
}

function isLink(value: unknown): value is LinkItem {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return typeof entry.id === "string" && typeof entry.label === "string" && typeof entry.url === "string" && normalizeUrl(entry.url) !== null;
}

/** Saved list, or null when nothing usable is saved. Entries of the wrong shape or with a non-http(s) URL are dropped. */
export function parseLinks(raw: string | null): LinkItem[] | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter(isLink) : null;
  } catch {
    return null;
  }
}

export const linkStore = createLocalStore<LinkItem[]>({
  key: STORAGE_KEY,
  fallback: DEFAULT_LINKS,
  parse: parseLinks,
  serialize: (links) => JSON.stringify(links),
  getStorage: browserStorage,
});
