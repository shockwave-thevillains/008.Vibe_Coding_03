import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Satu file Markdown per era per bahasa:
 *   src/content/eras/id/<slug>.md
 *   src/content/eras/en/<slug>.md
 * ID entri menjadi "<lang>/<slug>"; slug harus sama di kedua bahasa.
 */
const eras = defineCollection({
  loader: glob({ base: './src/content/eras', pattern: '**/*.md' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().min(1),
        order: z.number().int().min(1),
        startLabel: z.string().min(1),
        endLabel: z.string().min(1),
        /** Tahun lalu, relatif terhadap REFERENCE_YEAR (lihat src/lib/time.ts). */
        startYearsAgo: z.number().nonnegative(),
        endYearsAgo: z.number().nonnegative(),
        summary: z.string().min(1).max(320),
        keyEvents: z
          .array(
            z.object({
              when: z.string().min(1),
              title: z.string().min(1),
              description: z.string().min(1),
            }),
          )
          .min(3)
          .max(6),
        accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'accentColor harus hex #RRGGBB'),
        image: z
          .object({
            src: image(),
            alt: z.string().min(1),
            credit: z.string().min(1),
            license: z.string().min(1),
            sourceUrl: z.url(),
          })
          .optional(),
        sources: z
          .array(z.object({ title: z.string().min(1), url: z.url() }))
          .min(2),
        needsReview: z.boolean(),
      })
      .refine((d) => d.startYearsAgo >= d.endYearsAgo, {
        message: 'startYearsAgo harus ≥ endYearsAgo',
      }),
});

export const collections = { eras };
