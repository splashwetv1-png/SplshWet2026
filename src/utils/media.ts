function isEromeUrl(value: string) {
  try {
    const parsed = new URL(value)
    return parsed.hostname === 'erome.com' || parsed.hostname.endsWith('.erome.com')
  } catch {
    return false
  }
}

export function proxiedMediaUrl(value: string | null | undefined) {
  if (!value) {
    return undefined
  }

  return isEromeUrl(value) ? `/api/public/media-proxy?url=${encodeURIComponent(value)}` : value
}
