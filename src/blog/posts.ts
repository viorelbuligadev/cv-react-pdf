export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: number;
  tags: string[];
  image: string;
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
  },
];
