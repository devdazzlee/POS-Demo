// No-op cache layer.
//
// Redis was removed from the project per product requirements. This module is
// intentionally kept (with its original signatures) so existing call sites in
// the website service compile without edits. Every "cache" call now just
// invokes the loader directly — the data is always live from Postgres.

export async function getCache<T>(_key: string): Promise<T | null> {
  return null;
}

export async function setCache<T>(_key: string, _value: T, _ttlSeconds: number): Promise<void> {
  return;
}

export async function withCache<T>(
  _key: string,
  _ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  return loader();
}

export async function invalidateCache(_keys: string[]): Promise<void> {
  return;
}

export async function invalidatePattern(_pattern: string): Promise<void> {
  return;
}

export const WEB_CACHE_TTL = {
  HOME: 0,
  CATEGORIES_LIST: 0,
  CATEGORY_DETAIL: 0,
  PRODUCT_LIST: 0,
  PRODUCT_DETAIL: 0,
  SEARCH_SUGGEST: 0,
  PRODUCT_COUNT: 0,
} as const;
