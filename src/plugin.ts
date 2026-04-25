import { definePlugin, type Plugin } from '@argon-sdk/core'

import type { FluentHelper } from './fluent.ts'

/**
 * Argon SDK plugin that injects a `FluentHelper` as `context.t` on every context.
 *
 * Register via `bot.plugin(locales(t))`. After registration, `context.t` is
 * available — and typed automatically via the bot's accumulated decorators.
 * No `declare module` augmentation is needed.
 *
 * @example
 * ```ts
 * const t = fluent({ directory: './locales', defaultLocale: 'en' })
 *
 * bot
 *   .plugin(locales(t))
 *   .on(message.create, async (context) => {
 *     await context.reply(context.t('welcome', { username: context.user.displayName }))
 *   })
 * ```
 */
export function locales(t: FluentHelper): Plugin<'t', FluentHelper> {
  return definePlugin('t', () => t)
}
