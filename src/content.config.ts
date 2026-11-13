import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const CATEGORIES = ['分析', '資格', 'ランニング', 'その他'] as const;
export type Category = (typeof CATEGORIES)[number];

const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			category: z.enum(CATEGORIES).default('その他'),
			heroImage: z.optional(image()),
			draft: z.boolean().default(false),
		}),
});

export const collections = { blog };
