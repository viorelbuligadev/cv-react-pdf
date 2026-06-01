import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { PDFViewer } from "@react-pdf/renderer";
import styles from '../styles/Home.module.css'
import CvDocument from "../src/components/CvDocument";
import React, { useMemo, useState } from "react";
import CvDocumentOnePage from "../src/components/CvDocument/CvDocumentOnePage";

const certifications = [
  { name: 'Terraform Associate', url: 'https://www.credly.com/badges/4d4cfa8c-cb0d-4360-8087-d7668cf1b804/linked_in_profile', img: '/images/terraform.png' },
  { name: 'AWS Cloud Practitioner', url: 'https://www.credly.com/badges/5d5be781-eb69-45fe-aa9e-bc6b2b7d7dfd/linked_in_profile', img: '/images/aws.png' },
  { name: 'Azure Fundamentals', url: 'https://www.credly.com/badges/65512ecd-a940-4bd7-88b0-baad1369a24f/linked_in', img: '/images/azure-fundamentals.png' },
  { name: 'Azure Developer Associate', url: 'https://learn.microsoft.com/en-us/users/viorelbuliga-5942/credentials/cd7e9ac0196ba99c', img: '/images/azure-developer.png' },
];

const countries = [
  { code: 'us', name: 'US' },
  { code: 'de', name: 'Germany' },
  { code: 'ch', name: 'Switzerland' },
  { code: 'gb', name: 'UK' },
  { code: 'es', name: 'Spain' },
  { code: 'it', name: 'Italy' },
  { code: 'be', name: 'Belgium' },
];

const SITE_URL = 'https://viorelbuliga.com';

const Home: NextPage = () => {
  const [showFullPdf, setShowFullPdf] = useState(false);
  const [showOnePagePdf, setShowOnePagePdf] = useState(false);

  const cvDocumentElement = useMemo(() => {
    if (showFullPdf) return <CvDocument />;
    if (showOnePagePdf) return <CvDocumentOnePage />;
    return null;
  }, [showFullPdf, showOnePagePdf]);

  const handleCloseClick = () => {
    setShowFullPdf(false);
    setShowOnePagePdf(false);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Viorel Buliga - Senior AI · .NET · Cloud Engineer</title>
        <meta name="description" content="Senior Software Engineer specializing in AI, .NET, and Cloud. Certified in AWS, Azure, and Terraform. Available for remote opportunities across the US and EU." />
        <link rel="canonical" href={SITE_URL} />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2" />

        {/* Open Graph */}
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:title" content="Viorel Buliga - Senior AI · .NET · Cloud Engineer" />
        <meta property="og:description" content="Senior Software Engineer specializing in AI, .NET, and Cloud. Certified in AWS, Azure, and Terraform. Available for remote opportunities across the US and EU." />
        <meta property="og:image" content={`${SITE_URL}/images/profile-photo-zoomed.jpg`} />
        <meta property="og:image:width" content="140" />
        <meta property="og:image:height" content="140" />
        <meta property="og:image:alt" content="Viorel Buliga" />
        <meta property="og:locale" content="en_US" />
        <meta property="profile:first_name" content="Viorel" />
        <meta property="profile:last_name" content="Buliga" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Viorel Buliga - Senior AI · .NET · Cloud Engineer" />
        <meta name="twitter:description" content="Senior Software Engineer specializing in AI, .NET, and Cloud. Certified in AWS, Azure, and Terraform." />
        <meta name="twitter:image" content={`${SITE_URL}/images/profile-photo-zoomed.jpg`} />

        {/* JSON-LD Person schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Person',
              name: 'Viorel Buliga',
              url: SITE_URL,
              image: `${SITE_URL}/images/profile-photo-zoomed.jpg`,
              jobTitle: 'Senior AI / .NET / Cloud Engineer',
              knowsAbout: ['Artificial Intelligence', '.NET', 'Azure', 'AWS', 'Terraform', 'Angular', 'React', 'Cloud Engineering'],
              hasCredential: [
                { '@type': 'EducationalOccupationalCredential', name: 'AWS Cloud Practitioner' },
                { '@type': 'EducationalOccupationalCredential', name: 'Azure Fundamentals' },
                { '@type': 'EducationalOccupationalCredential', name: 'Azure Developer Associate' },
                { '@type': 'EducationalOccupationalCredential', name: 'Terraform Associate' },
              ],
              sameAs: [
                'https://www.linkedin.com/in/viorel-buliga/',
                'https://github.com/viorelbuligadev',
              ],
            }),
          }}
        />
      </Head>

      <main className={styles.main}>
        {!!cvDocumentElement && (
          <div style={{ position: 'fixed', width: '100vw', height: '100vh', top: 0, left: 0, zIndex: 100 }}>
            <PDFViewer style={{ position: 'absolute', width: '100vw', height: '100vh' }}>
              {cvDocumentElement}
            </PDFViewer>
            <button
              className={styles.closeButton}
              onClick={handleCloseClick}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        )}

        <div className={styles.hero}>
          <div className={styles.avatarWrapper}>
            <Image
              src="/images/profile-photo-zoomed.jpg"
              alt="Viorel Buliga"
              width={140}
              height={140}
              className={styles.avatar}
            />
          </div>

          <h1 className={styles.name}>Viorel Buliga</h1>
          <p className={styles.title}>Senior AI <span className={styles.dot}>·</span> .NET <span className={styles.dot}>·</span> Cloud Engineer</p>

          <div className={styles.socialLinks}>
            <a href="https://www.linkedin.com/in/viorel-buliga/details/recommendations/" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </a>
            <a href="https://github.com/viorelbuligadev" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
              GitHub
            </a>
          </div>

          <div className={styles.certifications}>
            {certifications.map(cert => (
              <a key={cert.name} href={cert.url} target="_blank" rel="noopener noreferrer" className={styles.badge}>
                <Image src={cert.img} alt={cert.name} width={80} height={80} className={styles.badgeImg} />
                <span>{cert.name}</span>
              </a>
            ))}
          </div>

          <div className={styles.collaboration}>
            <p className={styles.collaborationText}>
              Successful collaborations with clients across the{' '}
              <strong>US</strong> and <strong>EU</strong>
            </p>
            <div className={styles.collaborationCountries}>
              {countries.map((c, i) => (
                <span key={c.code} className={styles.countryItem}>
                  <img
                    src={`https://flagcdn.com/w20/${c.code}.png`}
                    alt={c.name}
                    width={20}
                    height={14}
                    className={styles.flag}
                  />
                  {c.name}
                  {i < countries.length - 1 && <span className={styles.dot}>·</span>}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.actions}>
            <button className={styles.btnPrimary} onClick={() => setShowFullPdf(true)}>
              Full CV
            </button>
            <button className={styles.btnSecondary} onClick={() => setShowOnePagePdf(true)}>
              One Page CV
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home
