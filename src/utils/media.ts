const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function isEromeUrl(value: string) {
  try {
    const parsed = new URL(value)
    return parsed.hostname === 'erome.com' || parsed.hostname.endsWith('.erome.com')
  } catch {
    return false
  }
}

/**
 * Returns the media-proxy URL for Erome media (using the absolute backend URL),
 * or the original URL for any other host.
 * The originalUrl is also stored so components can use it as a fallback if the
 * proxy request fails (e.g. via onError handlers on <img> / <video>).
 */
export function proxiedMediaUrl(value: string | null | undefined): string | undefined {
  if (!value) {
    return undefined
  }

  if (isEromeUrl(value)) {
    return `${API_BASE_URL}/api/public/media-proxy?url=${encodeURIComponent(value)}`
  }

  return value
}

/** The original (unproxied) URL — use this as a fallback if the proxy fails. */
export function originalMediaUrl(value: string | null | undefined): string | undefined {
  return value ?? undefined
}
