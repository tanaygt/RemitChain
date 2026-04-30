const CACHE_PREFIX = "remitchain_cache_";

export function setCache<T>(key: string, data: T, ttlSeconds = 60) {
  if (typeof window === "undefined") {
    return;
  }

  const entry = {
    data,
    expiry: Date.now() + ttlSeconds * 1000,
  };

  window.localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
}

export function getCache<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(CACHE_PREFIX + key);
  if (!stored) {
    return null;
  }

  try {
    const entry = JSON.parse(stored);
    if (Date.now() > entry.expiry) {
      window.localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return entry.data as T;
  } catch {
    return null;
  }
}

export function clearCache(key: string) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(CACHE_PREFIX + key);
}
