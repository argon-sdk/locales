# @argon-sdk/locales

Localization plugin for [Argon SDK](https://github.com/argon-sdk/core). Brings [Project Fluent](https://projectfluent.org/) translations into your bot with full type safety — key autocompletion, typed arguments, and missing-key validation at startup.

## Features

- **Project Fluent** — full `.ftl` syntax: placeables, selectors, multiline values, term references
- **Type-safe keys** — IDE autocompletion for every translation key via generated `.d.ts`
- **Typed arguments** — variables (`{ $name }`) inferred per-key, wrong args are a compile error
- **Plugin integration** — `context.t` available in every handler after a one-line setup
- **CLI** — `gen` to generate types, `check` to validate completeness, `--watch` to do it live
- **Zero runtime dependencies** — `@fluent/bundle` is bundled in `dist/`, nothing to install at runtime

## Installation

```sh
npm install @argon-sdk/locales
# or
bun add @argon-sdk/locales
```

## Quick Start

### 1. Write your `.ftl` files

```fluent
# locales/en.ftl
ping-description = Check if the bot is alive
welcome = Welcome, { $username }!
```

```fluent
# locales/ru.ftl
ping-name = пинг
ping-description = Проверить работу бота
welcome = Добро пожаловать, { $username }!
```

### 2. Generate types

```sh
npx argon-locales gen --dir ./locales
```

This creates `locales/locale-keys.d.ts` — import it anywhere in your project (e.g. via `tsconfig.json` `include`) and your IDE will autocomplete every key.

### 3. Set up the `t` function

```ts
import * as path from 'node:path'
import { fluent } from '@argon-sdk/locales'

const t = fluent({
  directory: path.join(import.meta.dirname, 'locales'),
  defaultLocale: 'en',
})
```

### 4. Define commands

Pass `t('key')` directly into SDK tokens — no wrappers, no magic:

```ts
import { command, name, describe, option, user } from '@argon-sdk/core'

const ping = command(
  name('ping'),
  describe(t('ping-description')),
).run(async (context) => {
  await context.reply('Pong!')
})

const greet = command(
  name('greet'),
  describe(t('greet-description')),
  option(user(), name('target'), describe(t('greet-target-description'))),
).run(async (context, opts) => {
  await context.reply(`Hello, ${opts.target.displayName}!`)
})
```

### 5. Register the plugin

`context.t` is typed automatically via the bot's accumulated decorators — no `types.d.ts` boilerplate, no `tsconfig.json` `include` tweaks.

```ts
import { Bot, Intent } from '@argon-sdk/core'
import { locales } from '@argon-sdk/locales'

const bot = new Bot(process.env.BOT_TOKEN!, {
  intents: Intent.Messages | Intent.Commands,
  hooks: {
    onStart: () => {
      for (const { locale, missing } of t.validate()) {
        if (missing.length > 0) {
          console.warn(`[locales] ${locale}: missing — ${missing.join(', ')}`)
        }
      }
    },
  },
})

bot
  .plugin(locales(t))
  .commands(ping, greet)
  .on(message.create, async (context) => {
    // context.t is identical to the standalone t — same function, injected by the plugin
    await context.reply(context.t('welcome', { username: context.user.displayName }))
  })
```

## CLI

```
argon-locales <command> [flags]

Commands:
  gen    Generate TypeScript type definitions from .ftl files
  check  Check locale files for missing or extra keys

Shared flags:
  --dir            Directory containing .ftl files
  --defaultLocale  Default locale code (default: en)
  -w, --watch      Re-run on file changes

gen flags:
  --out     Output path for the generated .d.ts (default: <dir>/locale-keys.d.ts)
  --module  Module name for augmentation (default: @argon-sdk/locales)
```

```sh
# Generate types
argon-locales gen --dir ./locales

# Check for missing / extra keys
argon-locales check --dir ./locales

# Watch mode
argon-locales gen --dir ./locales --watch
```

## Type Safety

After running `gen`, your IDE autocompletes every key:

```ts
t('')  // → IDE shows: 'ping-description' | 'welcome' | ...
```

Keys with Fluent variables require typed arguments — missing or wrong args are a compile error:

```ts
t('welcome', { username: 'Alice' })  // ✓
t('welcome')                         // ✗ — args required
t('welcome', { name: 'Alice' })      // ✗ — 'name' is not 'username'
t('ping-description', { foo: 1 })    // ✗ — this key takes no args
```

## Fluent Syntax

Any valid `.ftl` syntax works — the full `@fluent/bundle` runtime is bundled:

```fluent
# Simple placeable
greeting = Hello, { $name }!

# Plural selector
inbox = { $count ->
    [one]   You have one message.
   *[other] You have { $count } messages.
}

# Gender selector
shared = { $actor } shared { $photoCount ->
    [one]   a photo
   *[other] { $photoCount } photos
} to { $gender ->
    [male]   his stream.
    [female] her stream.
   *[other]  their stream.
}

# Multiline
terms =
    By continuing you agree to our
    Terms of Service and Privacy Policy.
```

## API Reference

| Export | Kind | Description |
|---|---|---|
| `fluent(opts)` | function | Creates a `FluentHelper` (`t`) from a directory of `.ftl` files |
| `locales(t)` | function | Argon SDK plugin — injects `t` as `context.t` |
| `compareLocaleKeys(a, b)` | function | Compares two key sets, returns `{ missing, extra }` |
| `FluentHelper` | interface | The callable `t` function type |
| `FluentOptions` | interface | Options for `fluent()` |
| `LocaleKeyRegistry` | interface | Augmentable registry — populated by the CLI |
| `LocaleValidationResult` | type | Return type of `t.validate()` |
| `LocaleKeyDiff` | interface | Return type of `compareLocaleKeys()` |
| `Locale` | const + type | Built-in locale codes (`'en'`, `'ru'`, `'hy'`) |

## License

MIT
