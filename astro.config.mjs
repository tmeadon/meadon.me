import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://meadon.net',
  integrations: [mdx(), sitemap()],
  output: 'static',
  redirects: {
    '/posts/[...slug]': '/blog/[...slug]'
  },
  markdown: {
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, {
        behavior: 'append', content: [{ type: 'text', value: '🔗' }]
      }]
    ]
  }
});
