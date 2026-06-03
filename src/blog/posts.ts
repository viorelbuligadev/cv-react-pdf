export interface FaqItem {
  q: string;
  a: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: number;
  tags: string[];
  image: string;
  faq: FaqItem[];
}

export const posts: BlogPost[] = [
  {
    slug: 'az-204-retirement-ai-200',
    title: 'AZ-204 Is Retiring: What Azure Developers Need to Know About AI-200',
    description: 'Microsoft is retiring the AZ-204 Azure Developer Associate certification on July 31, 2026, replacing it with AI-200. As someone who holds AZ-204, here is everything I found out — what changes, what stays, and what you should do next.',
    date: '2026-06-02',
    readTime: 4,
    tags: ['Azure', 'Certification', 'AI-200', 'AZ-204', 'Microsoft'],
    image: '/images/azure-developer.png',
    faq: [
      { q: 'When does AZ-204 retire?', a: 'AZ-204 retires on July 31, 2026.' },
      { q: 'What replaces AZ-204?', a: 'AZ-204 is replaced by Exam AI-200: Developing AI Cloud Solutions on Azure, leading to the Microsoft Certified: Azure AI Cloud Developer Associate credential.' },
      { q: 'Will my AZ-204 certification still be valid after retirement?', a: 'Yes. Your certification remains valid and on your transcript until it naturally expires. Retirement does not invalidate certifications already earned.' },
      { q: 'Can I renew AZ-204 after July 31, 2026?', a: 'No. After the retirement date, renewal is no longer possible. If your renewal window falls after July 31, 2026, you will need to earn AI-200 instead.' },
      { q: 'Is AZ-204 still valid as a prerequisite for AZ-400 after retirement?', a: 'Yes. Microsoft has confirmed that AZ-204 will continue to satisfy the AZ-400 prerequisite as long as it is valid on your transcript.' },
      { q: 'Should I still take AZ-204 before it retires?', a: 'If you are already well into your preparation, finishing AZ-204 is still worthwhile. If you are just starting, AI-200 is the better long-term investment.' },
    ],
  },
];
