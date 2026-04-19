/** Difference between a default locale's key set and another locale's key set. */
export interface LocaleKeyDiff {
  /** Keys present in the default locale but missing in the compared locale. */
  missing: string[]
  /** Keys present in the compared locale but absent in the default locale. */
  extra: string[]
}

/**
 * Compare two locale key sets and return their symmetric difference.
 *
 * @param defaultKeys - Key set of the authoritative (default) locale.
 * @param localeKeys  - Key set of the locale being compared.
 * @returns An object with `missing` (in locale but not default) and `extra` (in locale but not default) arrays.
 */
export function compareLocaleKeys(defaultKeys: Set<string>, localeKeys: Set<string>): LocaleKeyDiff {
  const missing: string[] = []
  const extra: string[] = []

  for (const key of defaultKeys) {
    if (!localeKeys.has(key)) {
      missing.push(key)
    }
  }

  for (const key of localeKeys) {
    if (!defaultKeys.has(key)) {
      extra.push(key)
    }
  }

  return { missing, extra }
}
