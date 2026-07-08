import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import CvHtml from '../src/components/CvHtml/CvHtml';
import styles from '../styles/CvPage.module.css';

const SITE_URL = 'https://viorelbuliga.com';
const TITLE = 'CV - Viorel Buliga - Senior AI · .NET · Cloud Engineer';
const DESCRIPTION =
  'Full CV of Viorel Buliga - Senior Software Engineer specializing in AI, .NET, and Cloud. 9+ years of experience, certified in AWS, Azure, and Terraform. Available for remote work across the US and EU.';

const CvPage: NextPage = () => {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className={styles.page}>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href={`${SITE_URL}/cv`} />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2" />

        {/* Open Graph */}
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={`${SITE_URL}/cv`} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:image" content={`${SITE_URL}/images/profile-photo-zoomed.jpg`} />
        <meta property="og:image:alt" content="Viorel Buliga" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content={`${SITE_URL}/images/profile-photo-zoomed.jpg`} />

        {/* JSON-LD ProfilePage schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ProfilePage',
              url: `${SITE_URL}/cv`,
              mainEntity: {
                '@type': 'Person',
                name: 'Viorel Buliga',
                url: SITE_URL,
                image: `${SITE_URL}/images/profile-photo-zoomed.jpg`,
                jobTitle: 'Senior AI / .NET / Cloud Engineer',
                sameAs: [
                  'https://www.linkedin.com/in/viorel-buliga/',
                  'https://github.com/viorelbuligadev',
                ],
              },
            }),
          }}
        />
      </Head>

      <div className={styles.toolbar}>
        <Link href="/">
          <a className={styles.backLink}>← Back to home</a>
        </Link>
        <button type="button" className={styles.printButton} onClick={handlePrint}>
          Print / Save as PDF
        </button>
      </div>

      <CvHtml />
    </div>
  );
};

export default CvPage;
