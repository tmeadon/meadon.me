import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    summary: z.string().optional(),
    draft: z.boolean().optional(),
    hideFromLists: z.boolean().optional(),
    seriesSlug: z.string().optional(),
    seriesTitle: z.string().optional(),
    seriesPart: z.number().int().positive().optional(),
    seriesDisclaimer: z.boolean().optional(),
  }),
});

export const collections = { blog };
