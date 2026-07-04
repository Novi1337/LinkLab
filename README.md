This is a [Next.js](https://nextjs.org) project.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Automatic DE -> EN Localization

This project includes an automated localization pipeline for `messages/de.json` -> `messages/en.json`.

What happens automatically:

1. Missing EN keys are generated from DE.
2. Keys that were auto-generated and changed in DE are retranslated.
3. A review list is generated in `messages/en.review.json`.
4. Translation state is tracked in `messages/.translation-state.json`.

Hooks already enabled:

1. `npm run dev` runs i18n sync automatically first.
2. `npm run build` runs i18n sync automatically first.

Manual commands:

```bash
npm run i18n:sync
npm run i18n:check
npm run i18n:watch
```

Provider priority for automatic translation quality:

1. DeepL (`DEEPL_API_KEY`)
2. OpenAI (`OPENAI_API_KEY`, optional `OPENAI_MODEL`)
3. Fallback marker text (`[AUTO_UNTRANSLATED] ...`) if no API key is set

Example env setup:

```bash
export DEEPL_API_KEY="..."
# or
export OPENAI_API_KEY="..."
export OPENAI_MODEL="gpt-4.1-mini"
```

Review workflow:

1. Run dev/build or `npm run i18n:sync`.
2. Check `messages/en.review.json` for `needs-review` keys.
3. Edit `messages/en.json` to finalize wording.
4. Run `npm run i18n:check` for CI-style validation.

You can start editing the page in `src/app` and related components.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
