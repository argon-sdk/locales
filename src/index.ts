/**
 * Localization plugin for Argon SDK.
 *
 * Brings [Project Fluent](https://projectfluent.org/) translations into your bot
 * with full type safety — key autocompletion, typed arguments, and missing-key
 * validation at startup.
 *
 * @example
 * ```ts
 * import { fluent, locales } from '@argon-sdk/locales'
 *
 * const t = fluent({ directory: './locales', defaultLocale: 'en' })
 *
 * const ping = command(
 *   name('ping'),
 *   describe(t('ping-description')),
 * ).run(async (context) => context.reply('Pong!'))
 *
 * bot.plugin(locales(t)).commands(ping)
 * ```
 *
 * @module
 */

export { Locale } from './locale.ts'

export { fluent } from './fluent.ts'

export type {
  FluentHelper,
  FluentOptions,
  LocaleValidationResult,
  LocaleKeyRegistry,
} from './fluent.ts'

export { locales } from './plugin.ts'

export { compareLocaleKeys } from './locale-utils.ts'
export type { LocaleKeyDiff } from './locale-utils.ts'
