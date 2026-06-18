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
    slug: 'impedance-mismatch-explained',
    title: 'Impedance Mismatch in Software: What It Is and Why It Matters',
    description: 'Impedance mismatch describes the friction between two systems built on fundamentally different models. Learn what it means, why the object-relational mismatch is the classic example, and where EF Core abstractions leak.',
    date: '2026-06-18',
    readTime: 7,
    tags: ['.NET', 'EF Core', 'SQLAlchemy', 'Architecture', 'Backend'],
    image: '/images/impedance_mismatch.png',
    faq: [
      { q: 'Where does the term "impedance mismatch" come from?', a: 'It comes from electrical engineering, where impedance mismatch between circuit components causes power loss and signal reflection. The software community borrowed the metaphor - two systems with incompatible shapes need a bridging component, at the cost of some loss.' },
      { q: 'Does using an ORM solve the object-relational impedance mismatch?', a: 'It reduces the manual work but does not eliminate the mismatch. An ORM is the translation layer - and translation layers always have edge cases, performance surprises, and leaky abstractions. You trade writing SQL by hand for learning the ORM\'s behaviour in detail.' },
      { q: 'What is the N+1 query problem?', a: 'It happens when you load a list of N entities and then trigger one additional query for each entity to load a related object. One query becomes N+1 queries. In EF Core the fix is to use Include() to eager-load the related data in a single query.' },
      { q: 'What is the difference between IQueryable and IEnumerable in EF Core?', a: 'IQueryable builds an expression tree that EF Core translates to SQL - filtering and sorting happen in the database. IEnumerable triggers execution immediately and any subsequent operations happen in memory. Using IEnumerable where IQueryable is expected can load entire tables into memory.' },
      { q: 'Should I always use an ORM?', a: 'Not always. ORMs are well suited for CRUD-heavy applications with straightforward data models. For read-heavy reporting, complex aggregations, or bulk data operations, raw SQL or a micro-ORM like Dapper often gives you better control and performance.' },
      { q: 'Is impedance mismatch only relevant to databases?', a: 'No. The concept appears anywhere two systems with fundamentally different models need to communicate - sync vs async boundaries, REST APIs vs domain models, microservices with overlapping entities, and serialisation formats. Wherever you see a translation layer, there is probably a mismatch underneath it.' },
    ],
  },
  {
    slug: 'ca2012-valuetask-correctly',
    title: 'CA2012: How to Use ValueTask Correctly in .NET',
    description: 'CA2012 catches ValueTask misuse — double awaits, stored instances, and discarded results. Learn the one-shot consumption contract, every violation pattern with code examples, and when AsTask() is the right escape hatch.',
    date: '2026-06-05',
    readTime: 7,
    tags: ['.NET', 'C#', 'Async', 'Backend'],
    image: '/images/valuetask.png',
    faq: [
      { q: 'Is CA2012 enabled by default?', a: 'From .NET 10 it is enabled as a suggestion. In earlier SDK versions it may not be active. You can enable it explicitly in .editorconfig by setting dotnet_diagnostic.CA2012.severity to warning or error.' },
      { q: 'Why can I await a Task multiple times but not a ValueTask?', a: 'Task is a class (reference type) and its completed state and result are stored on the heap indefinitely. ValueTask is a struct that may wrap a pooled IValueTaskSource — after the first await, the pool can reclaim and reuse that source object. A second await could read stale recycled data.' },
      { q: 'When should I use AsTask() instead of just calling the method again?', a: 'Use AsTask() when calling the method a second time would repeat work you do not want repeated — for example, if the method performs I/O or modifies state. If the operation is idempotent, calling it twice is cleaner and avoids the Task allocation.' },
      { q: 'Does CA2012 catch misuse of ValueTask (non-generic) too?', a: 'Yes. The rule applies to both ValueTask and ValueTask<T>. Both have the same one-shot consumption contract.' },
      { q: 'Can I suppress CA2012 at the project level?', a: 'Yes, but you should not do this globally. CA2012 catches real bugs. If you find yourself suppressing it broadly, the underlying code should be fixed instead.' },
      { q: 'Should I always prefer ValueTask over Task?', a: 'No. Task is the right default. ValueTask is an optimisation for hot paths where the operation frequently completes synchronously and allocation pressure is measurable. Use Task unless profiling shows a real benefit from switching.' },
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
    slug: 'dotnet-task-async-await',
    title: 'Understanding Task in .NET: The Unit of Asynchronous Work',
    description: 'A deep dive into what Task really is in .NET, how async/await works under the hood, and the pitfalls that cause deadlocks, lost exceptions, and performance problems in production.',
    date: '2026-06-04',
    readTime: 12,
    tags: ['.NET', 'C#', 'Async', 'Backend'],
    image: '/images/task.png',
    faq: [
      { q: 'What is the difference between Task and Thread in .NET?', a: 'A Thread is an OS-level execution unit. A Task is a higher-level abstraction representing an operation that may or may not use a thread. Many tasks (especially I/O-bound ones) complete without ever blocking a thread.' },
      { q: 'When should I use Task.Run?', a: 'Use Task.Run only for CPU-bound work that you want to offload from the current thread. Do not use it to wrap I/O-bound async calls - that wastes a thread-pool thread waiting for I/O that did not need one.' },
      { q: 'What causes a deadlock in async .NET code?', a: 'Calling .Result or .Wait() on a Task in an environment with a SynchronizationContext (WPF, WinForms, classic ASP.NET). The calling thread blocks waiting for the Task, but the Task\'s continuation needs that same thread to run.' },
      { q: 'What is the difference between await and .Result?', a: 'await suspends the method without blocking a thread and unwraps the AggregateException, rethrowing the actual exception type. .Result blocks the calling thread and throws the full AggregateException wrapper.' },
      { q: 'What is ConfigureAwait(false) and when should I use it?', a: 'ConfigureAwait(false) tells the runtime not to capture the current SynchronizationContext when resuming after an await. Use it in library code to avoid unnecessary context switching and reduce deadlock risk for callers.' },
      { q: 'What is ValueTask and when should I use it?', a: 'ValueTask is a struct alternative to Task that avoids a heap allocation when the result is already available synchronously. Use it on hot paths where the operation frequently completes synchronously. Always await it exactly once.' },
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
