import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import sitemap from '@astrojs/sitemap';
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  site: 'https://meadon.net',
  integrations: [mdx(), sitemap()],
  output: 'server',
  redirects: {
    '/': '/blog',
    '/posts/[...slug]': '/blog/[...slug]'
  },
  markdown: {
    rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, {
      behavior: 'append',
      content: [{
        type: 'text',
        value: '🔗'
      }]
    }]]
  },
  adapter: node({
    mode: "middleware",
  })
});
