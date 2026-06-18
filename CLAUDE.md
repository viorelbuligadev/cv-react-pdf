# Blog Article Guidelines

## Language & Style
- B2 English — clear, natural, not overly formal
- Simple dash `-` everywhere, never em dash `—`
- Short sentences, no jargon
- First-person perspective where relevant (E-E-A-T signal)
- No unverified claims — if unsure, remove or link to official source

## Article Structure (required order)
1. **Quick answer block** — 2-3 sentences max, answers the main question immediately (featured snippet target)
2. **Lead paragraph** — personal context or why this topic matters
3. **H2 headings as questions** — "What is X?", "How does Y work?", "When should you use Z?"
4. **Content with examples** — tables, code blocks, step-by-step where relevant
5. **Callout box** — for tips, warnings, or important notes
6. **"When should you use each?" section** — comparison or decision guide
7. **FAQ section** (visible) — 4-6 short Q&A pairs
8. **Official resources** — only official links (Microsoft Learn, MDN, etc.)

## Content Rules
- Verify everything against official documentation before publishing
- Fetch the official doc page and compare line by line
- No percentages or statistics without an official source
- Link official sources inline where claims are made
- Keep results tables and code examples 100% accurate

## SEO / GEO / AEO Requirements
- Question-based H2 headings (AEO best practice)
- Quick answer block at top (featured snippet targeting)
- FAQ section visible in article + JSON-LD FAQPage schema (auto-generated from `posts.ts`)
- BlogPosting JSON-LD schema auto-generated (includes image, author, datePublished)
- Twitter Card auto-generated from post data
- OG tags auto-generated from post data

## Adding a New Article

### 1. Create content file
Path: `src/blog/content/<slug>.tsx`

```tsx
import React from 'react';
import styles from './Article.module.css';

const MyArticle = () => (
  <div className={styles.article}>
    <div className={styles.quickAnswer}>
      <strong>Quick answer:</strong> ...
    </div>
    <p className={styles.lead}>...</p>
    <h2>What is X?</h2>
    ...
    <h2>Frequently asked questions</h2>
    <div className={styles.faq}>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Question?</strong>
        <p className={styles.faqA}>Answer.</p>
      </div>
    </div>
    <h2>Official resources</h2>
    <ul>
      <li><a href="..." target="_blank" rel="noopener noreferrer" className={styles.link}>Title - Source</a></li>
    </ul>
  </div>
);

export default MyArticle;
```

### 2. Add to `src/blog/posts.ts`
```ts
{
  slug: 'your-slug-here',
  title: 'Article Title',
  description: 'Short description for meta and card preview.',
  date: 'YYYY-MM-DD',
  readTime: 5,
  tags: ['Tag1', 'Tag2'],
  image: '/images/your-image.png',
  faq: [
    { q: 'Question?', a: 'Answer.' },
  ],
},
```

### 3. Register in `pages/blog/[slug].tsx`
```ts
const contentMap = {
  'your-slug-here': dynamic(() => import('../../src/blog/content/your-article')),
};
```

### 4. Add to `public/sitemap.xml`
```xml
<url>
  <loc>https://viorelbuliga.com/blog/your-slug-here</loc>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
```

### 5. Add cover image
- Save to `public/images/your-image.png`
- Recommended size: 1200x630px
- Generate with Ideogram, Canva or similar AI tool
- Prompt style: minimalist, dark tech, flat design, navy background

## Pre-publish Checklist
- [ ] Content verified against official documentation
- [ ] All dashes are `-` not `—`
- [ ] No unverified statistics or percentages
- [ ] Official sources linked inline
- [ ] `readTime` is accurate (avg 200 wpm)
- [ ] Cover image saved in `public/images/`
- [ ] Slug added to `sitemap.xml`
- [ ] Article registered in `contentMap`
- [ ] FAQ items in `posts.ts` match visible FAQ in article
- [ ] After deploy: run LinkedIn Post Inspector to refresh OG cache

## Available CSS Classes (Article.module.css)
| Class | Usage |
|---|---|
| `.quickAnswer` | Blue left-border box at top |
| `.lead` | Larger intro paragraph |
| `.callout` | Highlighted tip/note box |
| `.faq` / `.faqItem` / `.faqQ` / `.faqA` | FAQ section |
| `.link` | Styled anchor with underline |
| `.code` | Code block (monospace, dark bg) |
| `.table` / `.tableWrapper` | Styled data table |
| `.blockquote` | Quoted text with left border |
