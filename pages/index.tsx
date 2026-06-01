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

const recommendations = [
  {
    name: 'Gaurank Goyal',
    role: 'Cloud Architect @ Siemens Energy',
    relation: 'Managed Viorel directly · April 2026',
    text: 'I had the opportunity to work with Viorel, and he consistently impressed me with his strong technical expertise in .NET and Azure DevOps, along with his ability to deliver high-quality work. He is proactive, dependable, and a pleasure to work with. I would highly recommend him for any role requiring expertise in .NET, Azure Cloud, and Azure DevOps.',
  },
  {
    name: 'Andreea Alexandru',
    role: 'QA Engineer',
    relation: 'Worked on the same team · January 2026',
    text: 'I had the pleasure of working with Viorel on a complex project where close collaboration between QA and development was essential. From a tester\'s perspective, he is the kind of developer who truly makes a difference. He approaches requirements with a strong understanding of their business impact, writes clean and well-structured code, and is always open to feedback. What I appreciated most was the way bugs and edge cases were handled—with responsibility, attention to detail, and a genuine desire to deliver a stable, high-quality solution. Communication with Viorel was always clear and solution-oriented. I would confidently recommend Viorel to any team looking for a technically strong developer and a reliable team player who truly values quality and teamwork.',
  },
  {
    name: 'Stephanie Kellotat',
    role: 'Scrum Master · BROCKHAUS AG',
    relation: 'Worked on the same team · December 2024',
    text: 'I had the pleasure of working with Viorel in a Scrum team on a complex ETRM software project, where he served as a Senior .NET Developer and I as the Scrum Master. Viorel consistently demonstrated a remarkable combination of reliability, openness, and proactivity, embodying the self-responsibility and initiative that agile teams thrive on. His expertise made him a cornerstone of the team, not only as a skilled developer but also as a trusted point of contact for testers, business analysts, and fellow developers. I truly appreciated his collaborative spirit and would welcome the chance to work with him again.',
  },
  {
    name: 'Mariyan Draganov',
    role: '.NET Developer · LEAD Consult',
    relation: 'Worked on the same team · September 2024',
    text: 'I have been working with Viorel for the past two years on various challenging projects at E.on. Throughout this time I have always been able to rely on Viorel and his vast expertise in Azure backend development. His deep knowledge of cloud architecture, coupled with his ability to implement scalable and reliable solutions, has been instrumental in the success of our projects.',
  },
  {
    name: 'Radhika Inamdar',
    role: 'ETRM Senior Consultant · E.ON Utilities',
    relation: 'Worked on the same team · September 2024',
    text: 'I have had the immense pleasure of working with Viorel, who consistently displays thoughtfulness and a methodical approach to issue fixing. As a QA, it is a breeze to test his implementation, and he is always approachable to answer any queries. What impresses me the most about Viorel is his tech savviness in .NET and Azure development. Discussing technical loopholes with him is always an enlightening experience. Moreover, I greatly appreciate his patience and determination and count on these qualities when working on any project with him.',
  },
  {
    name: 'Swayam Mishra',
    role: 'Digital Transformation & Enterprise Solution Architecture · Cloud, Data & AI',
    relation: 'Was Viorel\'s client · March 2023',
    text: 'It was a real pleasure to know and work with Viorel during a few challenging e.on projects. He is very strong in .NET, Microservice, and Azure development topics. Viorel demonstrates his leaning of best practices and patterns and applies them to improve the quality of application. Viorel is continuously self-learning, always focused, detailed, sincere and finally a great team player to work with.',
  },
  {
    name: 'Mircea Fechet',
    role: 'Senior .NET QA Automation Engineer · Contractor',
    relation: 'Worked on different teams · March 2023',
    text: 'If you\'re looking for someone who\'s knowledgeable, dedicated and has great problem-solving skills, Viorel is your guy. I\'ve had the pleasure of knowing him several years ago, and he\'s always been a great team player and a valuable asset to any project he\'s been involved in. If you have any Senior .NET Engineer positions available, I highly recommend you consider Viorel for the role. You won\'t be disappointed!',
  },
  {
    name: 'Carla Dall\'Aglio',
    role: 'Presidente · NewBit srl',
    relation: 'Was senior to Viorel · January 2023',
    text: 'We have collaborated with Viorel for the review and development of software for the management of production processes, with excellent results. Viorel proved to be reliable and professional.',
  },
  {
    name: 'Iulian Holonca',
    role: 'Solution Architect · Senior Software Engineer',
    relation: 'Managed Viorel directly · January 2023',
    text: 'I worked with Viorel on an e-commerce system at Romsoft. He had a talent in wrapping legacy code and he always met due dates. He was passionate about technology and about finding the best solutions. He is the type of developer who will look for ways of doing things better even without express assignments. We were sorry to see him leave.',
  },
  {
    name: 'Paul Enascut',
    role: 'Senior AI Engineer · .NET & Azure Developer',
    relation: 'Worked on the same team · January 2023',
    text: 'Viorel is an experienced and a very learned developer. He has a very good expertise not only on software development but also on standards and concepts of software quality. Always happy to help, understanding and keeping eye on detail, he has been a real asset to the team.',
  },
  {
    name: 'Draghici Florin',
    role: '.NET Developer (Fullstack)',
    relation: 'Worked on the same team · January 2023',
    text: 'It is my pleasure to highly recommend Viorel for any role in the technology industry. Viorel\'s technical skills are second to none. He is a highly skilled C# and Azure developer and his proficiency in these technologies is evident in the quality of his work. He is always willing to go the extra mile to ensure that projects are delivered on time and to the highest standard. One of Viorel\'s greatest strengths is his ability to work well in a team — a great collaborator and communicator, his positive attitude and willingness to help others is contagious. He is highly reliable, always respects deadlines, and is committed to delivering the best results possible.',
  },
];

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

        <section className={styles.recommendations}>
          <h2 className={styles.sectionTitle}>Trusted by those who shipped with me</h2>
          <div className={styles.recommendationGrid}>
            {recommendations.map(rec => (
              <div key={rec.name} className={styles.recommendationCard}>
                <p className={styles.recommendationQuote}>{rec.text}</p>
                <div className={styles.recommendationAuthor}>
                  <strong className={styles.recommendationName}>{rec.name}</strong>
                  <span className={styles.recommendationRole}>{rec.role}</span>
                  <span className={styles.recommendationRelation}>{rec.relation}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home
