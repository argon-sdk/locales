import type { Plugin } from '@argon-sdk/core'

import type { FluentHelper } from './fluent.ts'

/**
 * Argon SDK plugin that injects a `FluentHelper` as `context.t` on every context.
 *
 * Register it once via `bot.plugin(locales(t))`. After that, `context.t` is
 * available in all event and command handlers — identical to the standalone `t`
 * function, so you can call `context.t('key')` or `context.t('key', { ...args })`.
 *
 * To enable `context.t` type inference, add this augmentation once anywhere in your project:
 *
 * ```ts
 * import type { FluentHelper } from '@argon-sdk/locales'
 *
 * declare module '@argon-sdk/core' {
 *   interface BaseContext { readonly t: FluentHelper }
 * }
 * ```
 *
 * @example
 * ```ts
 * const t = fluent({ directory: './locales', defaultLocale: 'en' })
 *
 * bot
 *   .plugin(locales(t))
 *   .on(message.create, async (context) => {
 *     await context.reply((context as any).t('welcome', { username: context.user.displayName }))
 *   })
 * ```
 */
export function locales(t: FluentHelper): Plugin {
  return { name: 't', build: () => t }
}
