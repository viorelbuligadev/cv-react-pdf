import React from 'react';
import styles from './Article.module.css';

const IEnumerableVsIQueryable = () => (
  <div className={styles.article}>

    <div className={styles.quickAnswer}>
      <strong>Quick answer:</strong> The difference is not the interface - it is the <em>type of the lambda</em>. <code>Queryable.Where</code> takes an <code>Expression&lt;Func&lt;T, bool&gt;&gt;</code>, a data structure EF Core can read and translate into SQL. <code>Enumerable.Where</code> takes a plain <code>Func&lt;T, bool&gt;</code>, a compiled delegate EF Core cannot see inside. So the moment a query is typed as <code>IEnumerable&lt;T&gt;</code>, every operator after it runs in your process - and EF Core loads the whole table to feed it.
    </div>

    <p className={styles.lead}>
      Every .NET team eventually ships the same bug: a query that worked fine on a development database brings production to its knees, because somewhere a variable was typed <code>IEnumerable</code> instead of <code>IQueryable</code>. What makes it dangerous is not that it is subtle to write - it is that EF Core has a safety net for exactly this problem, and typing <code>IEnumerable</code> is how you step outside it.
    </p>

    <img
      src="/images/iqueryable.png"
      alt="IEnumerable versus IQueryable: delegate in memory versus expression tree translated to SQL"
      style={{ width: '100%', borderRadius: '12px', margin: '1.5rem 0' }}
    />

    <h2>What is the actual difference?</h2>
    <p>
      Start with the fact that <code>IQueryable&lt;T&gt;</code> <em>inherits</em> from <code>IEnumerable&lt;T&gt;</code>. It is not an alternative to it - it is an extension of it, and what it adds is an <code>Expression</code> and a <code>Provider</code>.
    </p>
    <p>
      That inheritance is why both of these compile, and why they look identical:
    </p>
    <pre className={styles.code}>{`// Queryable.Where(this IQueryable<T>, Expression<Func<T, bool>>)
IQueryable<Order> q = db.Orders;
q = q.Where(o => o.Total > 100);

// Enumerable.Where(this IEnumerable<T>, Func<T, bool>)
IEnumerable<Order> e = db.Orders;
e = e.Where(o => o.Total > 100);`}</pre>
    <p>
      Same lambda, same result set, wildly different behaviour. In the first case the compiler builds an <strong>expression tree</strong> - a data structure describing "a comparison between the Total property and the constant 100". EF Core walks that tree and emits <code>WHERE [o].[Total] &gt; 100</code>.
    </p>
    <p>
      In the second case the compiler builds a <strong>compiled delegate</strong>. A delegate can only be <em>invoked</em>; it cannot be inspected. EF Core has nothing to read, so it does not even try. It issues <code>SELECT * FROM [Orders]</code>, materialises every row, and then your delegate filters them one by one in memory.
    </p>
    <div className={styles.callout}>
      <strong>The variable's type picks the overload.</strong> Nothing else changed - not the lambda, not the query, not the LINQ method name. Writing <code>IEnumerable&lt;Order&gt;</code> instead of <code>IQueryable&lt;Order&gt;</code> silently binds every subsequent <code>Where</code>, <code>OrderBy</code> and <code>Take</code> to the in-memory version.
    </div>

    <h2>Why does EF Core need an expression tree?</h2>
    <p>
      Because a LINQ query is not executed when you write it. As the docs put it: "When you call LINQ operators, you're simply building up an in-memory representation of the query. The query is only sent to the database when the results are consumed."
    </p>
    <p>
      That representation is the expression tree. EF Core hands it to the database provider, which "identifies which parts of the query can be evaluated in the database" and translates those parts to SQL. The query goes to the server only when you consume it - iterating in a <code>foreach</code>, or calling <code>ToList</code>, <code>ToArray</code>, <code>Single</code>, <code>Count</code>, or their async overloads.
    </p>
    <p>
      So the tree is the contract. Remove it and EF Core is blind.
    </p>

    <h2>What goes wrong in real code?</h2>
    <p>
      Almost always in a repository or service boundary, where someone returns the "safer looking" interface:
    </p>
    <pre className={styles.code}>{`public class OrderRepository
{
    // Looks harmless. It is the bug.
    public IEnumerable<Order> GetOrders() => _db.Orders;
}

// Caller, three files away, with no idea
var big = repo.GetOrders()
    .Where(o => o.Total > 10_000)   // Func<Order, bool> - in memory
    .OrderByDescending(o => o.Total) // in memory
    .Take(20)                        // in memory
    .ToList();                       // the whole table was already loaded`}</pre>
    <p>
      The caller wrote a perfectly reasonable query. The database received <code>SELECT * FROM [Orders]</code>. On a table with ten thousand rows nobody notices. On a table with ten million, the app falls over - and the query in the code review looked fine.
    </p>

    <h2>Why doesn't EF Core throw and save you?</h2>
    <p>
      This is the part most articles miss, and it is the whole point.
    </p>
    <p>
      EF Core <em>does</em> have a guard. Since version 3.0, if it finds something it cannot translate anywhere other than the final <code>Select</code>, it refuses to silently fall back to memory. The docs are explicit: "If EF Core detects an expression, in any place other than the top-level projection, which can't be translated to the server, then it throws a runtime exception." And on filters specifically: "Because the filter can't be applied in the database, all the data needs to be pulled into memory to apply the filter on the client... So Entity Framework Core blocks such client evaluation and throws a runtime exception."
    </p>
    <p>
      That guard is why an untranslatable C# method inside a <code>Where</code> blows up loudly instead of quietly scanning your table. It is a genuinely good safety net.
    </p>
    <div className={styles.callout}>
      <strong>But the guard only works inside <code>IQueryable</code>.</strong> It fires when EF Core <em>tries to translate</em> your predicate and fails. Type the variable as <code>IEnumerable</code> and the predicate never reaches EF Core at all - the compiler bound it to <code>Enumerable.Where</code>, so there is nothing to translate, nothing to fail, and nothing to throw. You do not get an exception. You get a full table scan and a silent performance cliff.
    </div>
    <p>
      That asymmetry is worth sitting with. An untranslatable query <strong>throws</strong>. A query you accidentally moved to the client <strong>succeeds</strong>. The louder failure is the safer one.
    </p>

    <h2>The overload trap that does this behind your back</h2>
    <p>
      You do not need to type <code>IEnumerable</code> anywhere to fall into this. A helper method with the wrong parameter type is enough:
    </p>
    <pre className={styles.code}>{`// The source is IQueryable, so this must be safe... right?
public static IQueryable<T> Filter<T>(
    IQueryable<T> source,
    Func<T, bool> predicate)          // <- delegate, not expression
    => source.Where(predicate);        // binds to Enumerable.Where!

// Correct: keep it an expression all the way down
public static IQueryable<T> Filter<T>(
    IQueryable<T> source,
    Expression<Func<T, bool>> predicate)
    => source.Where(predicate);        // binds to Queryable.Where`}</pre>
    <p>
      In the first version the source really is an <code>IQueryable</code>, but the <em>predicate</em> is a delegate, so overload resolution picks <code>Enumerable.Where</code> - and the whole chain degrades to client evaluation. It even still compiles as <code>IQueryable&lt;T&gt;</code> on the way out, because <code>IQueryable</code> derives from <code>IEnumerable</code>. The type says one thing and the execution does another.
    </p>
    <p>
      <strong>The rule: if a method takes a predicate that must reach the database, its type is <code>Expression&lt;Func&lt;T, bool&gt;&gt;</code>. Never <code>Func&lt;T, bool&gt;</code>.</strong>
    </p>

    <h2>AsEnumerable, ToList, AsQueryable - which and when?</h2>
    <p>
      Switching to the client is sometimes exactly what you want. The docs list two good reasons: the amount of data is small, or the LINQ operator has no server-side translation. The point is to do it <em>deliberately</em>, and after the database has already done the heavy lifting.
    </p>
    <pre className={styles.code}>{`// Narrow on the server FIRST, then hand off to C#
var flagged = (await db.Orders
        .Where(o => o.PlacedAt > cutoff)   // SQL
        .Where(o => o.Total > 1_000)       // SQL
        .ToListAsync(ct))                  // executes here - a small set
    .Where(o => IsSuspicious(o))           // C# method, impossible in SQL
    .ToList();`}</pre>
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Call</th>
            <th>What it does</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>AsEnumerable()</code></td>
            <td>Switches to client evaluation but stays deferred - it <strong>streams</strong> the results. Use it when you will enumerate once.</td>
          </tr>
          <tr>
            <td><code>ToList()</code></td>
            <td>Executes immediately and <strong>buffers</strong> into a list, which "takes additional memory". Worth it if you enumerate more than once, since it is a single trip to the database.</td>
          </tr>
          <tr>
            <td><code>AsQueryable()</code></td>
            <td>On an in-memory collection this gives you <em>nothing</em> - no SQL, no translation. It wraps the list in a queryable façade that still executes in memory. It is useful for satisfying a signature, not for performance.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      One nuance people get backwards: client evaluation in the <strong>final projection is allowed</strong>. EF Core "supports partial client evaluation in the top-level projection (essentially, the last call to <code>Select()</code>)". So calling a C# helper inside your last <code>Select</code> works without any <code>AsEnumerable</code> - EF fetches the columns it needs and runs your method on the results. It is only in a <code>Where</code>, an <code>OrderBy</code>, or a join that it throws.
    </p>

    <h2>How do you prove which side you are on?</h2>
    <p>
      Do not guess from the type - read the SQL. On any <code>IQueryable</code>, <code>ToQueryString()</code> gives you the statement EF Core would send:
    </p>
    <pre className={styles.code}>{`var query = db.Orders.Where(o => o.Total > 100);
Console.WriteLine(query.ToQueryString());
// SELECT [o].[Id], [o].[Total], ...
// FROM [Orders] AS [o]
// WHERE [o].[Total] > 100.0`}</pre>
    <p>
      If the <code>WHERE</code> you expect is missing, your filter is running in memory. And note that you cannot even call <code>ToQueryString()</code> once the variable is an <code>IEnumerable</code> - the method does not exist there. That failure to compile is itself the answer.
    </p>

    <h2>When should you use each?</h2>
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Situation</th>
            <th>Use</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Building a query the database should execute</td>
            <td><code>IQueryable&lt;T&gt;</code>, all the way to the call that materialises it.</td>
          </tr>
          <tr>
            <td>A repository method callers need to compose on</td>
            <td>Return <code>IQueryable&lt;T&gt;</code> - or, better, do not let them compose: take the filter as a parameter and return a projected DTO. Returning <code>IEnumerable</code> from a repository is the classic version of this bug.</td>
          </tr>
          <tr>
            <td>C# logic inside a filter or ordering</td>
            <td>Narrow on the server first, then <code>AsEnumerable()</code> or <code>ToListAsync()</code>, then apply it.</td>
          </tr>
          <tr>
            <td>C# logic inside the final <code>Select</code></td>
            <td>Nothing to do - EF Core allows client evaluation in the top-level projection.</td>
          </tr>
          <tr>
            <td>A collection already in memory</td>
            <td><code>IEnumerable&lt;T&gt;</code>. <code>AsQueryable()</code> will not conjure a database.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      The habit that prevents all of it is small: <strong>keep <code>IQueryable</code> in the type until the moment you genuinely want rows in memory, and make that moment explicit.</strong> Every accidental <code>IEnumerable</code> is a decision to load the table, made by someone who did not know they were making it.
    </p>

    <h2>Frequently asked questions</h2>
    <div className={styles.faq}>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What is the real difference between IEnumerable and IQueryable?</strong>
        <p className={styles.faqA}>The type of the lambda the LINQ operator accepts. Queryable.Where takes an Expression&lt;Func&lt;T, bool&gt;&gt; - an expression tree EF Core can inspect and translate into SQL. Enumerable.Where takes a Func&lt;T, bool&gt; - a compiled delegate that can only be invoked, never inspected. IQueryable also inherits from IEnumerable, which is why the mistake compiles silently.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Why does typing a query as IEnumerable cause a full table scan?</strong>
        <p className={styles.faqA}>Because the compiler binds every subsequent operator to the in-memory versions. EF Core is never given the predicate, so it cannot put it in the WHERE clause. It fetches every row, materialises them, and your delegate filters them in your process. The results are correct, which is exactly why nobody notices until the table grows.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Doesn't EF Core throw when it cannot translate something?</strong>
        <p className={styles.faqA}>Yes, but only inside IQueryable. Since EF Core 3.0, an expression it cannot translate anywhere other than the top-level projection causes a runtime exception rather than a silent client-side fallback. That guard fires when EF tries to translate and fails. If you typed the variable as IEnumerable, EF is never asked to translate anything, so there is nothing to fail and nothing to throw - you just get a table scan.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What is the difference between AsEnumerable and ToList?</strong>
        <p className={styles.faqA}>Both switch to client evaluation. AsEnumerable stays deferred and streams the results; ToList executes immediately and buffers everything into a list, which costs additional memory. Prefer AsEnumerable when you enumerate once, and ToList when you enumerate several times, since the list means only one trip to the database.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Does calling AsQueryable() on a List give me SQL translation?</strong>
        <p className={styles.faqA}>No. AsQueryable on an in-memory collection wraps it in a queryable façade whose provider still executes everything in memory. There is no database behind it and no SQL is generated. It is useful for satisfying a method signature or for testing, never for performance.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Should my repository return IQueryable?</strong>
        <p className={styles.faqA}>It is a genuine trade-off. Returning IQueryable keeps queries composable and translatable, but it leaks EF Core into the caller and lets anyone write a query you never reviewed. Returning IEnumerable hides EF Core but silently kills translation. A middle path is to accept the filter as a parameter and return a projected DTO, so composition happens inside the repository where you control it.</p>
      </div>
    </div>

    <h2>Official resources</h2>
    <ul>
      <li><a href="https://learn.microsoft.com/en-us/ef/core/querying/how-query-works" target="_blank" rel="noopener noreferrer" className={styles.link}>How queries work - EF Core, Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/ef/core/querying/client-eval" target="_blank" rel="noopener noreferrer" className={styles.link}>Client vs. server evaluation - EF Core, Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/dotnet/api/system.linq.iqueryable-1" target="_blank" rel="noopener noreferrer" className={styles.link}>IQueryable&lt;T&gt; interface - .NET API, Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/ef/core/performance/efficient-querying" target="_blank" rel="noopener noreferrer" className={styles.link}>Efficient querying - EF Core, Microsoft Learn</a></li>
    </ul>

  </div>
);

export default IEnumerableVsIQueryable;
