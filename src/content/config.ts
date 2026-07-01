import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	type: 'content',
	// Type-check frontmatter using a schema
		schema: z.object({
			title: z.string(),
			description: z.string().optional(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			summary: z.string().optional(),
			draft: z.boolean().optional(),
			seriesSlug: z.string().optional(),
			seriesTitle: z.string().optional(),
			seriesPart: z.number().int().positive().optional(),
			seriesDisclaimer: z.boolean().optional(),
		}),
});

export const collections = { blog };
