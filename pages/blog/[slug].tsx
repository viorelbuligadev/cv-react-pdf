import type { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import BlogNav from '../../src/components/Blog/BlogNav';
import { posts, BlogPost } from '../../src/blog/posts';
import styles from '../../styles/BlogPost.module.css';

const contentMap: Record<string, React.ComponentType> = {
  'az-204-retirement-ai-200': dynamic(() => import('../../src/blog/content/az-204-retirement')),
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
        <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2" />
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
