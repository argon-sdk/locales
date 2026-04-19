/**
 * Built-in locale codes supported out of the box.
 *
 * Use the string values directly or reference them via `Locale.EN`, etc.
 * The type `Locale` is the union of all values: `'en' | 'ru' | 'hy'`.
 */
export const Locale = {
  EN: 'en',
  RU: 'ru',
  HY: 'hy',
} as const

export type Locale = (typeof Locale)[keyof typeof Locale]
