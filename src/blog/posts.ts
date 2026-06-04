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
  {
    slug: 'csharp-records-vs-classes',
    title: 'C# Records vs Classes: When to Use Each and Why',
    description: 'Records and classes look similar in C# but behave very differently. Learn how value equality, with expressions, and immutability make records the right choice for data models - and when to stick with classes.',
    date: '2026-06-04',
    readTime: 6,
    tags: ['C#', '.NET', 'Backend'],
    image: '/images/csharp-records.png',
    faq: [
      { q: 'When were records introduced in C#?', a: 'Record classes were introduced in C# 9 (released with .NET 5 in November 2020). Record structs and readonly record structs were added in C# 10 (released with .NET 6 in November 2021).' },
      { q: 'Are records immutable in C#?', a: 'Positional record class properties are init-only by default, meaning they cannot be changed after the object is constructed. However, you can declare a record with mutable set properties if needed. Record structs are mutable by default - use readonly record struct for immutability.' },
      { q: 'What does the with expression do?', a: 'A with expression creates a new record instance that is a shallow copy of an existing one, with one or more properties changed. The original is never modified.' },
      { q: 'Can I use a record as a dictionary key?', a: 'Yes. Because records implement value equality and override GetHashCode, two records with the same data produce the same hash code and are treated as equal keys in a dictionary.' },
      { q: 'What is the difference between record and record class?', a: 'They are identical. The record keyword on its own defines a reference type, which is the same as writing record class explicitly. The explicit record class form was introduced in C# 10 to make the distinction from record struct clearer.' },
      { q: 'Can a regular class inherit from a record?', a: 'No. A regular class cannot inherit from a record, and a record cannot inherit from a regular class. Records can only inherit from other records.' },
    ],
  },
  {
    slug: 'sql-joins-inner-left-right',
    title: 'SQL JOINs Explained: INNER, LEFT, RIGHT, FULL OUTER and SELF JOIN with Examples',
    description: 'A clear explanation of SQL INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN and SELF JOIN with practical examples. Learn what each join returns and when to use it.',
    date: '2026-06-03',
    readTime: 5,
    tags: ['SQL', 'Database', 'Backend'],
    image: '/images/sql-joins.png',
    faq: [
      { q: 'What is the difference between INNER JOIN and LEFT JOIN?', a: 'INNER JOIN only returns rows with a match in both tables. LEFT JOIN returns all rows from the left table, with NULLs where no match exists in the right table.' },
      { q: 'Is LEFT JOIN the same as LEFT OUTER JOIN?', a: 'Yes. LEFT JOIN and LEFT OUTER JOIN are identical. The OUTER keyword is optional.' },
      { q: 'Which JOIN is the fastest?', a: 'INNER JOIN is typically the fastest because it processes fewer rows. However, performance depends mostly on indexes, not the JOIN type.' },
      { q: 'Can I use multiple JOINs in one query?', a: 'Yes. You can chain as many JOINs as needed in a single query, each with its own ON condition.' },
      { q: 'What is a FULL OUTER JOIN?', a: 'FULL OUTER JOIN returns all rows from both tables, matching them where it can and filling in NULL where it cannot. You get matched rows (from both sides), unmatched left rows (right columns = NULL), and unmatched right rows (left columns = NULL). Note: MySQL does not support FULL OUTER JOIN natively.' },
      { q: 'What is a SELF JOIN?', a: 'A SELF JOIN joins a table with itself using two different aliases. It is useful for querying hierarchical data, such as employees and their managers stored in the same table.' },
    ],
  },
];
