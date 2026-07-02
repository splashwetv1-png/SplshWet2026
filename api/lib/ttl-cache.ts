type CacheEntry<T> = {
  value: T
  expiresAt: number
}

export class TtlCache {
  private readonly store = new Map<string, CacheEntry<unknown>>()

  get<T>(key: string) {
    const entry = this.store.get(key)

    if (!entry) {
      return null
    }

    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key)
      return null
    }

    return entry.value as T
  }

  set<T>(key: string, value: T, ttlMs: number) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    })
  }

  delete(key: string) {
    this.store.delete(key)
  }

  clear() {
    this.store.clear()
  }
}
