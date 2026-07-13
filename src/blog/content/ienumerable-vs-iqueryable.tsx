import React from 'react';
import styles from './Article.module.css';

const IEnumerableVsIQueryable = () => (
  <div className={styles.article}>

    <div className={styles.quickAnswer}>
      <strong>Quick answer:</strong> The difference is not the interface - it is the <em>type of the lambda</em>. <code>Queryable.Where</code> takes an <code>Expression&lt;Func&lt;T, bool&gt;&gt;</code>, a data structure EF Core can read and translate into SQL. <code>Enumerable.Where</code> takes a plain <code>Func&lt;T, bool&gt;</code>, a compiled delegate EF Core cannot see inside. So the moment a query is typed as <code>IEnumerable&lt;T&gt;</code>, every operator after it runs in your process - and EF Core fetches every row of the table, and tracks them, to feed it.
    </div>

    <p className={styles.lead}>
      Type a query as <code>IEnumerable</code> instead of <code>IQueryable</code> and it still returns exactly the same rows. That is what makes it hard to catch: it passes the tests, it passes review, and on a development database with a few thousand rows there is nothing to see. The only thing that differs is the SQL - and you can check that for yourself with <code>ToQueryString()</code>. One version filters in the database; the other fetches every row and filters in your process. What that costs is not a matter of opinion. It scales with the number of rows in the table.
    </p>
    <p className={styles.lead}>
      What makes it worth an article is the second half of the story: EF Core has a safety net for exactly this problem, and typing <code>IEnumerable</code> is how you step outside it.
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
      In the second case the compiler builds a <strong>compiled delegate</strong>. A delegate can only be <em>invoked</em>; it cannot be inspected. EF Core has nothing to read, so it does not even try. It sends a <code>SELECT</code> with <strong>no <code>WHERE</code> clause at all</strong>, materialises every row into an <code>Order</code>, and then your delegate filters them one by one in your process.
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
      One place it surfaces is a repository or service boundary, where the "safer looking" interface gets returned:
    </p>
    <pre className={styles.code}>{`public class OrderRepository
{
    // Looks harmless. This is where it goes wrong.
    public IEnumerable<Order> GetOrders() => _db.Orders;
}

// Caller, three files away, with no idea
var big = repo.GetOrders()
    .Where(o => o.Total > 10_000)   // Func<Order, bool> - in memory
    .OrderByDescending(o => o.Total) // in memory
    .Take(20)                        // in memory
    .ToList();                       // the whole table was already loaded`}</pre>
    <p>
      The caller wrote a reasonable-looking query, and it returns the right twenty orders. But the database received a <code>SELECT</code> over the whole table with no <code>WHERE</code>, no <code>ORDER BY</code> and no <code>TOP</code> - which you can confirm from the SQL log, not from the C#. The cost of that is simple arithmetic: you pay for every row in the table, every time. On ten thousand rows that is invisible. On ten million, you are transferring and materialising ten million.
    </p>
    <p>
      Be precise about what that costs, because it is worse than "it loads the table". Every row crosses the network and is <strong>materialised into an entity object</strong>. Whether they are all held in memory at once depends on the operators: a bare <code>Where</code> streams and discards as it goes, but <code>OrderByDescending</code> in LINQ-to-Objects has to see every element before it can sort even one - so in the example above, the entire table <em>is</em> buffered.
    </p>
    <div className={styles.callout}>
      <strong>And the cost that is easiest to miss: change tracking.</strong> <code>db.Orders</code> is a tracking query by default, and tracking happens at materialisation - not at filtering. So every row you fetch, including every one your delegate is about to throw away, gets a snapshot in the change tracker. The <code>DbContext</code> ends up holding the whole table, and a later <code>SaveChanges</code> has to walk all of it. If you must pull rows to the client, <code>AsNoTracking()</code> at least stops EF Core from paying for entities you are only going to discard.
    </div>

    <h2>Why doesn't EF Core throw and save you?</h2>
    <p>
      This is the part that matters most, and it is easy to overlook.
    </p>
    <p>
      EF Core <em>does</em> have a guard. Since version 3.0, if it finds something it cannot translate anywhere other than the final <code>Select</code>, it refuses to silently fall back to memory. The docs are explicit: "If EF Core detects an expression, in any place other than the top-level projection, which can't be translated to the server, then it throws a runtime exception." And on filters specifically: "Because the filter can't be applied in the database, all the data needs to be pulled into memory to apply the filter on the client... So Entity Framework Core blocks such client evaluation and throws a runtime exception."
    </p>
    <p>
      That guard is why an untranslatable C# method inside a <code>Where</code> blows up loudly instead of quietly scanning your table. It is a genuinely good safety net.
    </p>
    <div className={styles.callout}>
      <strong>But the guard only works inside <code>IQueryable</code>.</strong> It fires when EF Core <em>tries to translate</em> your predicate and fails. Type the variable as <code>IEnumerable</code> and the predicate never reaches EF Core at all - the compiler bound it to <code>Enumerable.Where</code>, so there is nothing to translate, nothing to fail, and nothing to throw. You do not get an exception. You get a <code>SELECT</code> with no <code>WHERE</code> clause, and no warning that it happened.
    </div>
    <p>
      That asymmetry is worth sitting with. An untranslatable query <strong>throws</strong>. A query you accidentally moved to the client <strong>succeeds</strong>. The louder failure is the safer one.
    </p>

    <h2>The overload trap that does this behind your back</h2>
    <p>
      You do not need to type <code>IEnumerable</code> on a variable to fall into this. A helper method with the wrong <em>parameter</em> type is enough. And the way the compiler reacts to it is the most instructive thing in this article.
    </p>
    <pre className={styles.code}>{`// Source is IQueryable, predicate is a delegate.
// Overload resolution picks Enumerable.Where, which returns
// IEnumerable<T> - so this does NOT compile. CS0266.
public static IQueryable<T> Filter<T>(
    IQueryable<T> source,
    Func<T, bool> predicate)
    => source.Where(predicate);

// Same mistake, but the signature says IEnumerable.
// Now it compiles - and silently runs on the client.
public static IEnumerable<T> Filter<T>(
    IQueryable<T> source,
    Func<T, bool> predicate)
    => source.Where(predicate);

// Correct: keep it an expression all the way down.
public static IQueryable<T> Filter<T>(
    IQueryable<T> source,
    Expression<Func<T, bool>> predicate)
    => source.Where(predicate);        // binds to Queryable.Where`}</pre>
    <p>
      Look at what separates the first two. In both, the source really is an <code>IQueryable</code>, but the <em>predicate</em> is a delegate - so <code>Queryable.Where</code> is not even a candidate (a <code>Func</code> does not convert to an <code>Expression</code>), and overload resolution falls to <code>Enumerable.Where</code>, which hands back an <code>IEnumerable&lt;T&gt;</code>.
    </p>
    <p>
      The first version therefore <strong>refuses to compile</strong>. <code>IQueryable</code> derives from <code>IEnumerable</code>, so the conversion goes that way and not the other - you cannot return an <code>IEnumerable&lt;T&gt;</code> where an <code>IQueryable&lt;T&gt;</code> was promised. The type system catches you.
    </p>
    <p>
      The second version compiles perfectly, because the signature already gave up. That is the whole lesson in two lines: <strong>the type system will defend you for exactly as long as you keep asking for <code>IQueryable</code>. The moment a signature says <code>IEnumerable</code>, it stops arguing.</strong>
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
    <div className={styles.callout}>
      <strong>And the AsQueryable trap that only shows up in tests.</strong> Wrapping a <code>List&lt;T&gt;</code> in <code>AsQueryable()</code> hands you an <code>EnumerableQuery&lt;T&gt;</code>, whose provider is not an <code>IAsyncQueryProvider</code>. So the moment the code under test calls an async EF Core operator on it - <code>ToListAsync</code>, <code>FirstOrDefaultAsync</code>, <code>CountAsync</code> - it throws at runtime, because the source is not an <code>IAsyncEnumerable</code>. That is why libraries like MockQueryable exist at all, and why the EF Core testing docs point away from this entirely: they call mocking <code>DbSet</code> for querying "complex and difficult" and discourage it, steering you toward SQLite in-memory mode or your real database system instead.
    </div>
    <p>
      One nuance that is easy to get backwards: client evaluation in the <strong>final projection is allowed</strong>. EF Core "supports partial client evaluation in the top-level projection (essentially, the last call to <code>Select()</code>)". So calling a C# helper inside your last <code>Select</code> works without any <code>AsEnumerable</code> - EF fetches the columns it needs and runs your method on the results. It is only in a <code>Where</code>, an <code>OrderBy</code>, or a join that it throws.
    </p>

    <h2>How do you prove which side you are on?</h2>
    <p>
      Do not guess from the type - read the SQL. On any <code>IQueryable</code>, <code>ToQueryString()</code> (EF Core 5.0 and later) gives you the statement EF Core would send:
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
            <td>Return <code>IQueryable&lt;T&gt;</code> - or, better, do not let them compose: take the filter as a parameter and return a projected DTO. Returning <code>IEnumerable</code> from a repository is the classic way this goes wrong.</td>
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
    <p>
      Inside a method body, <code>var</code> is the cheapest way to hold that line. It keeps whatever type the provider actually handed back, so you cannot <em>declare</em> your way onto <code>Enumerable.Where</code> - making the mistake requires writing <code>IEnumerable&lt;T&gt;</code> out by hand. What <code>var</code> cannot do is guard a boundary: parameters and return types have to be spelled out, and that is precisely where the overload trap did its damage. <strong>So: <code>var</code> inside methods, and deliberate <code>IQueryable</code> and <code>Expression&lt;Func&lt;T, bool&gt;&gt;</code> types on every signature.</strong>
    </p>
    <p>
      One last thing, once the filter is running in SQL: the same discipline applies to <em>columns</em>. A translated <code>Where</code> still materialises whole entities unless you project, so use <code>Select</code> into a DTO and stop paying for columns you never read. That is the rest of the same story, and the <a href="https://learn.microsoft.com/en-us/ef/core/performance/efficient-querying" target="_blank" rel="noopener noreferrer" className={styles.link}>Efficient querying</a> guidance covers it properly.
    </p>

    <h2>Frequently asked questions</h2>
    <div className={styles.faq}>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What is the real difference between IEnumerable and IQueryable?</strong>
        <p className={styles.faqA}>The type of the lambda the LINQ operator accepts. Queryable.Where takes an Expression&lt;Func&lt;T, bool&gt;&gt; - an expression tree EF Core can inspect and translate into SQL. Enumerable.Where takes a Func&lt;T, bool&gt; - a compiled delegate that can only be invoked, never inspected. IQueryable also inherits from IEnumerable, which is why the mistake compiles silently.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Why does typing a query as IEnumerable cause a full table scan?</strong>
        <p className={styles.faqA}>Because the compiler binds every subsequent operator to the in-memory versions. EF Core is never given the predicate, so it cannot put it in the WHERE clause. It sends a SELECT with no WHERE, materialises every row into an entity, and your delegate filters them in your process. Worse, a tracking query snapshots every one of those entities in the change tracker - including the ones you are about to discard. The results are still correct, which is why it passes tests and review; the only place the difference shows up is the SQL.</p>
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
        <p className={styles.faqA}>No. AsQueryable on an in-memory collection wraps it in a queryable façade whose provider still executes everything in memory. There is no database behind it and no SQL is generated. It is useful for satisfying a method signature, never for performance. And be careful using it to fake a DbSet in tests: an EnumerableQuery has no async query provider, so any async EF Core operator - ToListAsync, FirstOrDefaultAsync, CountAsync - throws at runtime, which is why the EF Core testing docs discourage mocking DbSet and point to SQLite in-memory or your real database instead.</p>
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
