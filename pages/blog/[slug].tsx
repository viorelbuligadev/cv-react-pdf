import type { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import BlogNav from '../../src/components/Blog/BlogNav';
import { posts, BlogPost } from '../../src/blog/posts';
import styles from '../../styles/BlogPost.module.css';

const contentMap: Record<string, React.ComponentType> = {
  'az-204-retirement-ai-200': dynamic(() => import('../../src/blog/content/az-204-retirement')),
  'sql-joins-inner-left-right': dynamic(() => import('../../src/blog/content/sql-joins')),
  'csharp-records-vs-classes': dynamic(() => import('../../src/blog/content/csharp-records-vs-classes')),
  'python-asyncio-async-await': dynamic(() => import('../../src/blog/content/python-asyncio-async-await')),
};

interface Props {
  post: BlogPost;
}

const BlogPostPage: NextPage<Props> = ({ post }) => {
  const Content = contentMap[post.slug];

  return (
    <div className={styles.page}>
      <Head>
        <title>{post.title} — Viorel Buliga</title>
        <meta name="description" content={post.description} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://viorelbuliga.com/blog/${post.slug}`} />
        <meta property="og:image" content={`https://viorelbuliga.com${post.image}`} />
        <meta property="article:published_time" content={post.date} />
        <meta property="article:author" content="Viorel Buliga" />
        {post.tags.map(tag => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.description} />
        <meta name="twitter:image" content={`https://viorelbuliga.com${post.image}`} />

        <link rel="canonical" href={`https://viorelbuliga.com/blog/${post.slug}`} />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2" />

        {/* JSON-LD BlogPosting schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BlogPosting',
              headline: post.title,
              description: post.description,
              image: `https://viorelbuliga.com${post.image}`,
              url: `https://viorelbuliga.com/blog/${post.slug}`,
              datePublished: post.date,
              dateModified: post.date,
              keywords: post.tags.join(', '),
              author: {
                '@type': 'Person',
                name: 'Viorel Buliga',
                url: 'https://viorelbuliga.com',
                sameAs: ['https://www.linkedin.com/in/viorel-buliga/', 'https://github.com/viorelbuligadev'],
              },
              publisher: {
                '@type': 'Person',
                name: 'Viorel Buliga',
                url: 'https://viorelbuliga.com',
              },
              mainEntityOfPage: `https://viorelbuliga.com/blog/${post.slug}`,
            }),
          }}
        />

        {/* JSON-LD FAQ schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: post.faq.map(({ q, a }) => ({
                '@type': 'Question',
                name: q,
                acceptedAnswer: { '@type': 'Answer', text: a },
              })),
            }),
          }}
        />
      </Head>

      <BlogNav />

      <main className={styles.main}>
        <article className={styles.article}>
          <Link href="/blog"><a className={styles.back}>← All articles</a></Link>

          <header className={styles.header}>
            <div className={styles.tags}>
              {post.tags.map(tag => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>
            <h1 className={styles.title}>{post.title}</h1>
            <div className={styles.meta}>
              <span>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span className={styles.dot}>·</span>
              <span>{post.readTime} min read</span>
            </div>
          </header>

          <div className={styles.content}>
            {Content && <Content />}
          </div>

          <div className={styles.share}>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://viorelbuliga.com/blog/${post.slug}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.shareBtn}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              Share on LinkedIn
            </a>
          </div>
        </article>
      </main>
    </div>
  );
};

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: posts.map(p => ({ params: { slug: p.slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const post = posts.find(p => p.slug === params?.slug);
  if (!post) return { notFound: true };
  return { props: { post } };
};

export default BlogPostPage;
