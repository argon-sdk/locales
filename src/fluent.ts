import * as fs from 'node:fs'
import * as path from 'node:path'

import { FluentBundle, FluentResource } from '@fluent/bundle'
import type { FluentVariable } from '@fluent/bundle'

import { compareLocaleKeys } from './locale-utils.ts'

/**
 * Augmentable registry for locale key types.
 *
 * Populate via the CLI (`argon-locales gen`) — it generates a `locale-keys.d.ts`
 * file that augments this interface with `keys` and `args` entries derived from
 * your `.ftl` files, enabling autocompletion and type-safe argument passing.
 *
 * @example
 * ```ts
 * // locale-keys.d.ts (auto-generated)
 * declare module '@argon-sdk/locales' {
 *   interface LocaleKeyRegistry {
 *     commands: 'ping' | 'greet'
 *     keys: 'ping-description' | 'greet-description' | 'greet-target-description'
 *     args: {
 *       'welcome': { username: string | number }
 *     }
 *   }
 * }
 * ```
 */
export interface LocaleKeyRegistry {}

type InferKeys = LocaleKeyRegistry extends { keys: infer K extends string } ? K : string

type KeysWithArgs = LocaleKeyRegistry extends { args: infer A extends Record<string, unknown> }
  ? keyof A & string
  : never

type KeysWithoutArgs = Exclude<InferKeys, KeysWithArgs>

type InferArgs<K extends string> = LocaleKeyRegistry extends { args: infer A extends Record<string, unknown> }
  ? K extends keyof A
    ? A[K]
    : Record<string, FluentVariable>
  : Record<string, FluentVariable>

/**
 * Per-locale validation result returned by `t.validate()`.
 * Each entry describes a non-default locale and its key discrepancies.
 */
export type LocaleValidationResult = {
  /** Locale code (e.g. `'ru'`, `'hy'`). */
  locale: string
  /** Keys present in the default locale but absent in this one. */
  missing: string[]
  /** Keys present in this locale but absent in the default one (unexpected extras). */
  extra: string[]
}[]

/**
 * Translation function returned by `fluent()`.
 *
 * - Keys that declare variables in the `.ftl` file **require** an `args` object.
 * - Keys without variables **do not** accept an `args` object.
 * - An optional `locale` argument overrides the default locale for a single call.
 * - Falls back to the raw key string if the message is not found.
 *
 * @example
 * ```ts
 * // Simple key
 * t('ping-description')               // → 'Check if the bot is alive'
 * t('ping-description', 'ru')         // → 'Проверить работу бота'
 *
 * // Key with variables (type-checked against LocaleKeyRegistry.args)
 * t('welcome', { username: 'Alice' })
 * t('welcome', { username: 'Alice' }, 'ru')
 * ```
 */
export interface FluentHelper {
  /** Translate a key that requires variables. */
  <K extends KeysWithArgs>(key: K, args: InferArgs<K>): string
  /** Translate a key that requires variables, using a specific locale. */
  <K extends KeysWithArgs>(key: K, args: InferArgs<K>, locale: string): string
  /** Translate a key with no variables. */
  (key: KeysWithoutArgs): string
  /** Translate a key with no variables, using a specific locale. */
  (key: KeysWithoutArgs, locale: string): string

  /**
   * Validate all non-default locales against the default locale's key set.
   *
   * Returns an array of results — one per locale — each listing keys that are
   * missing or unexpectedly present compared to the default locale.
   *
   * @example
   * ```ts
   * for (const { locale, missing } of t.validate()) {
   *   if (missing.length > 0) {
   *     console.warn(`${locale}: missing — ${missing.join(', ')}`)
   *   }
   * }
   * ```
   */
  validate(): LocaleValidationResult
}

/** Options accepted by the `fluent()` factory. */
export interface FluentOptions {
  /** Absolute or relative path to the directory containing `.ftl` locale files. */
  directory: string
  /**
   * Locale code of the default / fallback locale.
   * @default 'en'
   */
  defaultLocale?: string
}

function extractKeys(content: string): Set<string> {
  const keys = new Set<string>()
  const regex = /^([a-zA-Z][a-zA-Z0-9_-]*)\s*=/gm
  let match

  while ((match = regex.exec(content)) !== null) {
    const key = match[1]
    if (key) keys.add(key)
  }

  return keys
}

/**
 * Create a type-safe translation function (`t`) backed by Project Fluent.
 *
 * Reads all `.ftl` files from `opts.directory` at startup and builds a
 * `FluentBundle` per locale. Supports the full Fluent syntax: placeables,
 * selectors, multiline values, and term references.
 *
 * @example
 * ```ts
 * import { fluent } from '@argon-sdk/locales'
 *
 * const t = fluent({
 *   directory: path.join(import.meta.dirname, 'locales'),
 *   defaultLocale: 'en',
 * })
 *
 * // Use as a plain string in SDK tokens
 * command(
 *   name('ping'),
 *   describe(t('ping-description')),
 * ).run(async (context) => {
 *   await context.reply('Pong!')
 * })
 *
 * // Use at runtime with variables
 * t('welcome', { username: context.user.displayName })
 * ```
 */
export function fluent(opts: FluentOptions): FluentHelper {
  const defaultLocale = opts.defaultLocale ?? 'en'
  const bundles = new Map<string, FluentBundle>()
  const keySets = new Map<string, Set<string>>()
  const files = fs.readdirSync(opts.directory).filter((f) => f.endsWith('.ftl'))

  for (const file of files) {
    const locale = file.slice(0, -4)
    const content = fs.readFileSync(path.join(opts.directory, file), 'utf-8')

    const bundle = new FluentBundle(locale)
    bundle.addResource(new FluentResource(content))
    bundles.set(locale, bundle)

    keySets.set(locale, extractKeys(content))
  }

  const t = ((key: string, argsOrLocale?: Record<string, FluentVariable> | string, locale?: string): string => {
    let args: Record<string, FluentVariable> | undefined
    let resolvedLocale: string

    if (typeof argsOrLocale === 'string') {
      resolvedLocale = argsOrLocale
    } else {
      args = argsOrLocale
      resolvedLocale = locale ?? defaultLocale
    }

    const bundle = bundles.get(resolvedLocale)
    if (!bundle) return key

    const message = bundle.getMessage(key)
    if (!message?.value) return key

    return bundle.formatPattern(message.value, args)
  }) as FluentHelper

  t.validate = (): LocaleValidationResult => {
    const defaultKeys = keySets.get(defaultLocale) ?? new Set()
    const result: LocaleValidationResult = []

    for (const [locale, keys] of keySets) {
      if (locale === defaultLocale) continue

      const { missing, extra } = compareLocaleKeys(defaultKeys, keys)
      result.push({ locale, missing, extra })
    }

    return result
  }

  return t
}
