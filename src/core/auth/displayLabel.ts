type DisplayLabelInput = {
  primary?: string | null
  secondary?: string | null
  fallback: string
  rawId?: string | null
  allowRawId?: boolean
}

function sanitizeLabel(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function resolveDisplayLabel(input: DisplayLabelInput): string {
  const primary = sanitizeLabel(input.primary)
  if (primary) {
    return primary
  }

  const secondary = sanitizeLabel(input.secondary)
  if (secondary) {
    return secondary
  }

  if (input.allowRawId) {
    const rawId = sanitizeLabel(input.rawId)
    if (rawId) {
      return rawId
    }
  }

  return input.fallback
}
