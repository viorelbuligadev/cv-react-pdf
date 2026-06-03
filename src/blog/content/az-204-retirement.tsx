import React from 'react';
import styles from './Article.module.css';

const Az204Retirement = () => (
  <div className={styles.article}>

    <div className={styles.quickAnswer}>
      <strong>Quick answer:</strong> AZ-204 retires on <strong>July 31, 2026</strong> and is replaced by <strong>AI-200: Azure AI Cloud Developer Associate</strong>. Existing certifications stay valid until expiry. If you are already preparing, finish it. If you are just starting, go straight to AI-200.
    </div>

    <p className={styles.lead}>
      I hold the Microsoft Certified: Azure Developer Associate certification. So when Microsoft announced it is retiring on July 31, 2026, I started looking into what this actually means.
    </p>

    <h2>What is happening to AZ-204?</h2>
    <p>
      Microsoft is retiring AZ-204 as part of a wider shift toward AI-focused certifications. The replacement is <strong>Exam AI-200: Developing AI Cloud Solutions on Azure</strong>, which leads to the <a href="https://techcommunity.microsoft.com/blog/skills-hub-blog/new-microsoft-certified-azure-ai-cloud-developer-associate-certification/4494116" target="_blank" rel="noopener noreferrer" className={styles.link}><strong>Microsoft Certified: Azure AI Cloud Developer Associate</strong></a> credential. The AI-200 beta launched in May 2026 and the full exam is expected to be available in July 2026.
    </p>

    <h2>How is AI-200 different from AZ-204?</h2>
    <p>
      A significant part of AZ-204 content carries over into AI-200. The core topics like Azure Functions, containers, Service Bus, Key Vault and Azure Monitor are still there. What changes is the focus. You can review the full breakdown in the <a href="https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ai-200" target="_blank" rel="noopener noreferrer" className={styles.link}>official AI-200 study guide</a>.
    </p>
    <p>Several topics from AZ-204 are removed in AI-200:</p>
    <ul>
      <li>Blob Storage SDK</li>
      <li>MSAL and Identity Platform</li>
      <li>Microsoft Graph</li>
      <li>API Management</li>
      <li>Event Hubs</li>
      <li>Azure Container Instances</li>
    </ul>
    <p>And new topics are added:</p>
    <ul>
      <li>Azure OpenAI and Cognitive Services integration</li>
      <li>Vector databases: Cosmos DB with vector search, PostgreSQL with pgvector</li>
      <li>Azure Managed Redis</li>
      <li>KEDA for event-driven autoscaling</li>
      <li>OpenTelemetry and KQL for observability</li>
      <li>More Python SDK usage</li>
    </ul>

    <div className={styles.callout}>
      <strong>The shift in one sentence:</strong> from building apps on Azure to building AI-powered apps on Azure.
    </div>

    <h2>What happens to your AZ-204 certification after July 31?</h2>
    <p>
      If you already have AZ-204, your certification stays valid until it expires. It will remain on your transcript and can be verified online. The only thing you cannot do after July 31 is renew it. Your AZ-204 does not convert to AI-200 automatically.
    </p>
    <p>
      Note: Microsoft has <a href="https://learn.microsoft.com/en-us/answers/questions/5893548/will-az-204-still-be-accepted-as-a-prerequisite-fo" target="_blank" rel="noopener noreferrer" className={styles.link}>confirmed</a> that AZ-204 will still satisfy the AZ-400 prerequisite as long as it is valid on your transcript.
    </p>

    <h2>Should you take AZ-204 now or go straight to AI-200?</h2>
    <p>
      If you are already deep into your AZ-204 preparation, finish it. The certification is still valuable and recognised. If you are just starting out, AI-200 is the better long-term choice since it reflects how Azure development actually looks today.
    </p>

    <h2>Is it worth having AZ-204 if it is being retired?</h2>
    <p>
      I am glad I have AZ-204. The skills it covers are real and I use them every day. My next step will be AI-200, not because AZ-204 is being retired, but because the content of AI-200 matches the work I have been doing for the past two years. AI integration is no longer optional for Azure developers. Microsoft is just making that official.
    </p>

    <h2>Frequently asked questions</h2>
    <div className={styles.faq}>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>When does AZ-204 retire?</strong>
        <p className={styles.faqA}>AZ-204 retires on July 31, 2026.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What replaces AZ-204?</strong>
        <p className={styles.faqA}>Exam AI-200: Developing AI Cloud Solutions on Azure, leading to the Microsoft Certified: Azure AI Cloud Developer Associate credential.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Will my AZ-204 certification still be valid after retirement?</strong>
        <p className={styles.faqA}>Yes. Your certification remains valid and on your transcript until it naturally expires.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Can I renew AZ-204 after July 31, 2026?</strong>
        <p className={styles.faqA}>No. After the retirement date, renewal is no longer possible.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Is AZ-204 still valid as a prerequisite for AZ-400?</strong>
        <p className={styles.faqA}>Yes, as long as the certification is valid on your transcript.</p>
      </div>
    </div>

    <h2>Official resources</h2>
    <ul>
      <li><a href="https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ai-200" target="_blank" rel="noopener noreferrer" className={styles.link}>Study guide for Exam AI-200</a></li>
      <li><a href="https://techcommunity.microsoft.com/blog/skills-hub-blog/new-microsoft-certified-azure-ai-cloud-developer-associate-certification/4494116" target="_blank" rel="noopener noreferrer" className={styles.link}>Azure AI Cloud Developer Associate announcement</a></li>
      <li><a href="https://learn.microsoft.com/en-us/answers/questions/5843092/clarification-regarding-az-204-certification-valid" target="_blank" rel="noopener noreferrer" className={styles.link}>AZ-204 certification validity after retirement (Microsoft Q&A)</a></li>
      <li><a href="https://learn.microsoft.com/en-us/answers/questions/5893548/will-az-204-still-be-accepted-as-a-prerequisite-fo" target="_blank" rel="noopener noreferrer" className={styles.link}>AZ-204 as AZ-400 prerequisite after retirement (Microsoft Q&A)</a></li>
    </ul>
  </div>
);

export default Az204Retirement;
