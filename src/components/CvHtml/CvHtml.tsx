import React, { ReactNode } from 'react';
import {
  aiTools,
  certifications,
  contacts,
  ContactType,
  education,
  enabledProjectsAll,
  fullName,
  profilePhoto,
  projectsByName,
  skills,
  titleItems,
} from '../../data';
import styles from './CvHtml.module.css';

const contactIcons: Record<ContactType, ReactNode> = {
  phone: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  email: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  ),
  location: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.34 18.34V10.5H5.67v7.84h2.67zM7 9.34a1.55 1.55 0 1 0 0-3.1 1.55 1.55 0 0 0 0 3.1zm11.34 9v-4.3c0-2.3-1.23-3.37-2.87-3.37-1.32 0-1.91.73-2.24 1.24v-1.07h-2.67c.04.75 0 7.84 0 7.84h2.67v-4.38c0-.24.02-.48.09-.65.19-.48.63-.98 1.36-.98.96 0 1.35.73 1.35 1.8v4.21h2.62z" />
    </svg>
  ),
};

interface PanelProps {
  title: string;
  children: ReactNode;
}

const Panel: React.FC<PanelProps> = ({ title, children }) => (
  <section className={styles.panel}>
    <h2 className={styles.panelTitle}>{title}</h2>
    <div className={styles.panelBody}>{children}</div>
  </section>
);

const CvHtml: React.FC = () => {
  const projects = enabledProjectsAll.map((name) => projectsByName[name]);

  return (
    <div className={styles.sheet}>
      <aside className={styles.left}>
        <div className={styles.photoWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.photo} src={profilePhoto} alt={fullName} />
        </div>

        <Panel title="Contact">
          {contacts.map((contact) => {
            const content = (
              <>
                <span className={styles.contactIcon}>{contactIcons[contact.type]}</span>
                <span className={styles.contactText}>{contact.text}</span>
              </>
            );
            const isExternal = contact.link?.startsWith('http');
            return contact.link ? (
              <a
                key={contact.type}
                href={contact.link}
                className={styles.contactRow}
                target={isExternal ? '_blank' : undefined}
                rel="noopener noreferrer"
              >
                {content}
              </a>
            ) : (
              <div key={contact.type} className={styles.contactRow}>
                {content}
              </div>
            );
          })}
        </Panel>

        <Panel title="AI tools">
          {aiTools.map((tool) => (
            <p key={tool} className={styles.leftItem}>{tool}</p>
          ))}
        </Panel>

        <Panel title="Skills">
          {skills.map((skill) => (
            <div key={skill.name} className={styles.skillRow}>
              <span>{skill.name}</span>
              <span className={styles.skillYears}>
                {skill.years} {skill.years === 1 ? 'year' : 'years'}
              </span>
            </div>
          ))}
        </Panel>

        <Panel title="Certifications">
          {certifications.map((certification) => (
            <p key={certification} className={styles.leftItem}>{certification}</p>
          ))}
        </Panel>

        <Panel title="Education">
          <p className={`${styles.leftItem} ${styles.bold}`}>{education.institution}</p>
          <p className={styles.leftItem}>{education.degree}</p>
          <p className={styles.leftItem}>{education.location}</p>
        </Panel>
      </aside>

      <main className={styles.right}>
        <header className={styles.header}>
          <h1 className={styles.name}>{fullName}</h1>
          <div className={styles.titles}>
            {titleItems.map((item, index) => (
              <span key={item} className={styles.titleItem}>
                {!!index && <span className={styles.titleSeparator}>•</span>}
                {item}
              </span>
            ))}
          </div>
        </header>

        <hr className={styles.hr} />

        <h2 className={styles.sectionTitle}>About Me</h2>
        <p className={styles.aboutText}>
          I am a senior AI Engineer / .NET Full-Stack / developer / contractor / freelancer with{' '}
          <strong>9+ years of experience</strong>, only interested in remote work.
        </p>
        <p className={styles.aboutText}>
          I use my expertise, skills and passion to identify and implement clients&rsquo; needs with regards to their software solutions.
        </p>
        <p className={styles.aboutText}>
          Drop me a message if you think my expertise could help your organization!
        </p>

        <h2 className={`${styles.sectionTitle} ${styles.workTitle}`}>Work Experience</h2>

        <div className={styles.timeline}>
          {projects.map((project) => (
            <article key={project.projectName} className={styles.projectCard}>
              <span className={styles.marker} />
              <div className={styles.projectHeading}>
                <h3 className={styles.projectTitle}>{project.title}</h3>
                <span className={styles.projectPeriod}>{project.from} - {project.to}</span>
              </div>
              <p className={styles.projectName}>
                {project.projectName}
                {project.company ? ` | ${project.company}` : ''}
              </p>
              <p className={styles.clientProblem}>{project.clientProblem}</p>
              <ul className={styles.achievements}>
                {project.achievements.map((achievement, key) => (
                  <li key={key} className={styles.achievement}>
                    <strong>{achievement.highlight}</strong>{achievement.text}
                  </li>
                ))}
              </ul>
              <p className={styles.skills}>Skills: {project.skills.join(', ')}</p>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
};

export default CvHtml;
