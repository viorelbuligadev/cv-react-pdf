import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import BlogNav from '../../src/components/Blog/BlogNav';
import { posts } from '../../src/blog/posts';
import styles from '../../styles/Blog.module.css';

const BlogIndex: NextPage = () => {
  const [query, setQuery] = useState('');

  const filtered = posts.filter(p =>
    p.title.toLowerCase().includes(query.toLowerCase()) ||
    p.description.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className={styles.page}>
      <Head>
        <title>Blog - Viorel Buliga</title>
        <meta name="description" content="Thoughts on AI, .NET, Azure, and cloud engineering by Viorel Buliga." />
        <link rel="canonical" href="https://viorelbuliga.com/blog" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://viorelbuliga.com/blog" />
        <meta property="og:title" content="Blog - Viorel Buliga" />
        <meta property="og:description" content="Thoughts on AI, .NET, Azure, and cloud engineering by Viorel Buliga." />
        <meta property="og:image" content="https://viorelbuliga.com/images/profile-photo-zoomed.jpg" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Blog - Viorel Buliga" />
        <meta name="twitter:description" content="Thoughts on AI, .NET, Azure, and cloud engineering by Viorel Buliga." />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2" />
      </Head>

      <BlogNav showSearch onSearch={setQuery} />

      <main className={styles.main}>
        <div className={styles.feed}>
          {filtered.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <a className={styles.card}>
                <img src={post.image} alt={post.title} className={styles.cardImage} />
                <div className={styles.cardContent}>
                  <h2 className={styles.cardTitle}>{post.title}</h2>
                  <p className={styles.cardDesc}>{post.description}</p>
                  <div className={styles.cardMeta}>
                    <span>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    <span className={styles.dot}>·</span>
                    <span>{post.readTime} min read</span>
                  </div>
                  <div className={styles.tags}>
                    {post.tags.map(tag => (
                      <span key={tag} className={styles.tag}>{tag}</span>
                    ))}
                  </div>
                </div>
              </a>
            </Link>
          ))}
          {filtered.length === 0 && (
            <p className={styles.empty}>No articles found for &quot;{query}&quot;.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default BlogIndex;
