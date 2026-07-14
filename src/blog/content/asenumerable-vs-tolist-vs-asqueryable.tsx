import React from 'react';
import styles from './Article.module.css';

const AsEnumerableVsToListVsAsQueryable = () => (
  <div className={styles.article}>

    <div className={styles.quickAnswer}>
      <strong>Quick answer:</strong> All three decide <em>where</em> your query stops being SQL and starts being C#. <code>AsEnumerable()</code> hands off to the client but stays deferred, streaming the rows. <code>ToList()</code> hands off and executes immediately, buffering everything into a list. <code>AsQueryable()</code> does the opposite - and on a plain <code>List&lt;T&gt;</code> it buys you nothing at all, because there is no database behind it to translate anything into.
    </div>

    <p className={styles.lead}>
      In the <a href="/blog/ienumerable-vs-iqueryable" className={styles.link}>article on IEnumerable vs IQueryable</a> I argued that you should keep <code>IQueryable</code> in the type until you genuinely want rows in memory - and make that moment explicit. These three methods <em>are</em> that moment. Getting them right is the difference between a deliberate hand-off and an accidental table load, and one of them hides a trap that only ever shows up in your test suite.
    </p>

    <img
      src="/images/handoff.png"
      alt="AsEnumerable, ToList and AsQueryable: the hand-off point between SQL and C#"
      style={{ width: '100%', borderRadius: '12px', margin: '1.5rem 0' }}
    />

    <h2>What actually changes when you call one of these?</h2>
    <p>
      Nothing about your data. Everything about <em>who does the work</em>.
    </p>
    <p>
      Up to the point you call one of them, you are composing an expression tree that EF Core will translate into SQL. After it, you are composing delegates that run in your process. The docs call this switching to client evaluation, and they are explicit that it is something you opt into: "you can explicitly opt into client evaluation by calling methods like <code>AsEnumerable</code> or <code>ToList</code> (<code>AsAsyncEnumerable</code> or <code>ToListAsync</code> for async)".
    </p>
    <p>
      So the only real question is <strong>where you put the line</strong> - and how much data crosses it.
    </p>

    <h2>AsEnumerable or ToList - which one?</h2>
    <p>
      Both switch you to the client. They differ in <em>when</em> the query runs and <em>what it costs you in memory</em>, and the docs put it plainly: "By using <code>AsEnumerable</code> you would be streaming the results, but using <code>ToList</code> would cause buffering by creating a list, which also takes additional memory. Though if you're enumerating multiple times, then storing results in a list helps more since there's only one query to the database."
    </p>
    <p>
      The performance guidance spells out what that buys you: "the memory requirements of a streaming query are fixed - they are the same whether the query returns 1 row or 1000; a buffering query, on the other hand, requires more memory the more rows are returned". Which leads to a rule Microsoft states outright, and which is worth pinning to your wall: <strong>"Avoid using <code>ToList</code> or <code>ToArray</code> if you intend to use another LINQ operator on the result - this will needlessly buffer all results into memory. Use <code>AsEnumerable</code> instead."</strong>
    </p>
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th></th>
            <th><code>AsEnumerable()</code></th>
            <th><code>ToList()</code></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>When the query runs</td>
            <td>Deferred - on enumeration</td>
            <td>Immediately</td>
          </tr>
          <tr>
            <td>Memory</td>
            <td>Streams the rows</td>
            <td>Buffers all of them into a list</td>
          </tr>
          <tr>
            <td>Enumerating twice</td>
            <td>Queries the database twice</td>
            <td>One query, reuse the list</td>
          </tr>
          <tr>
            <td>Reach for it when</td>
            <td>You pass through the rows once</td>
            <td>You need the rows more than once</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div className={styles.callout}>
      <strong>The streaming promise has two conditions attached.</strong> The first is tracking. "Queries that return entity types are tracking" by default, and the docs describe what that means mechanically: "EF internally maintains a dictionary of tracked instances", and "before handing a loaded instance to the application, EF <em>snapshots</em> that instance and keeps the snapshot internally... The snapshot takes up more memory". So on a tracking query the context accumulates every entity it materialises no matter which operators you use downstream - fixed memory is not what you get. If you are pulling rows to the client to discard most of them, pair <code>AsEnumerable()</code> with <code>AsNoTracking()</code>, or the streaming buys you very little.
    </div>
    <p>
      The second condition is easier to miss. "In certain situations, EF will itself buffer the resultset internally, regardless of how you evaluate your query" - specifically when a retrying execution strategy is configured, and when split query is in use. So if you turned on <code>EnableRetryOnFailure</code> for Azure SQL, your carefully streamed query is being buffered underneath anyway. Worse, the docs warn that this stacks: "if you use <code>ToList</code> on a query and a retrying execution strategy is in place, the resultset is loaded into memory <em>twice</em>: once internally by EF, and once by <code>ToList</code>."
    </p>

    <h2>When should you deliberately switch to the client?</h2>
    <p>
      The docs give two good reasons: "The amount of data is small so that evaluating on the client doesn't incur a huge performance penalty", and "The LINQ operator being used has no server-side translation."
    </p>
    <p>
      The second one is the common case. Some C# method has no SQL equivalent, EF Core refuses to translate it, and you have to run it yourself. The rule is not <em>whether</em> you hand off, but <strong>how much you hand off</strong> - narrow the set on the server first, and only then cross the line.
    </p>
    <pre className={styles.code}>{`// The database does the heavy lifting...
var flagged = db.Orders
    .Where(o => o.PlacedAt > cutoff)   // SQL
    .Where(o => o.Total > 1_000)       // SQL
    .AsNoTracking()                    // nothing to track - we only read
    .AsEnumerable()                    // <- the hand-off, explicit
    .Where(o => IsSuspicious(o))       // C#, no SQL translation exists
    .ToList();`}</pre>
    <p>
      Move the <code>AsEnumerable()</code> one line up, before the filters, and you have written the exact query the previous article was about. The method is not the problem. Its <em>position</em> is.
    </p>
    <p>
      In async code, reach for <code>AsAsyncEnumerable()</code> rather than <code>AsEnumerable()</code>. It is what the docs point at for exactly this shape - "use <code>AsAsyncEnumerable</code> to execute the query on the database, and continue composing client-side LINQ operators over the resulting <code>IAsyncEnumerable&lt;T&gt;</code>" - and it streams, so you keep the property you came for.
    </p>

    <h2>Do you even need to switch?</h2>
    <p>
      Often not - and this is the part that is easy to get backwards. Client evaluation in the <strong>final projection is allowed</strong>. EF Core "supports partial client evaluation in the top-level projection (essentially, the last call to <code>Select()</code>)".
    </p>
    <p>
      So if your untranslatable C# only appears in the last <code>Select</code>, you need no hand-off at all. EF Core fetches the columns it needs and runs your method on the results.
    </p>
    <pre className={styles.code}>{`// No AsEnumerable needed - this works as-is
var rows = await db.Orders
    .Where(o => o.Total > 1_000)                  // SQL
    .Select(o => new OrderRow(
        o.Id,
        FormatReference(o.Id, o.PlacedAt)))       // C#, in the projection
    .ToListAsync(ct);`}</pre>
    <p>
      Put that same <code>FormatReference</code> call inside a <code>Where</code> instead and EF Core throws, because "If EF Core detects an expression, in any place other than the top-level projection, which can't be translated to the server, then it throws a runtime exception." Which is a good thing - the exception is the framework refusing to quietly drag your table into memory.
    </p>

    <h2>What does AsQueryable actually do?</h2>
    <p>
      It depends entirely on what you call it on, and the two cases could not be more different. The API documentation states both in one sentence: "If the type of <code>source</code> implements <code>IQueryable&lt;T&gt;</code>, <code>AsQueryable</code> returns it directly. Otherwise, it returns an <code>IQueryable&lt;T&gt;</code> that executes queries by calling the equivalent query operator methods in <code>Enumerable</code> instead of those in <code>Queryable</code>."
    </p>
    <p>
      <strong>On a real query, it gives you back the real query.</strong> If the object is already an <code>IQueryable</code> - an EF Core query that has merely been <em>typed</em> as <code>IEnumerable</code> - <code>AsQueryable()</code> returns it directly, provider and all. SQL translation is restored.
    </p>
    <pre className={styles.code}>{`IEnumerable<Order> leaky = db.Orders;   // still an EF query underneath

leaky.Where(o => o.Total > 100)         // Enumerable.Where - client side
     .ToList();

leaky.AsQueryable()                     // hands back the original IQueryable
     .Where(o => o.Total > 100)         // Queryable.Where - translated to SQL
     .ToList();`}</pre>
    <p>
      Useful trivia, and a neat proof that the static type was the only thing standing between you and a translated query. Do not build on it, though. If a variable's type is lying to you, fix the type.
    </p>
    <p>
      <strong>On a plain collection, it gives you nothing.</strong> Call <code>AsQueryable()</code> on a <code>List&lt;T&gt;</code> and, per that same sentence, you get back something that runs the <code>Enumerable</code> operators anyway - an <code>EnumerableQuery&lt;T&gt;</code>, a queryable-shaped wrapper with no database behind it. No SQL is generated, and none can be. It satisfies a method signature; it does not make anything faster.
    </p>

    <h2>The AsQueryable trap that only shows up in tests</h2>
    <p>
      That second case is where people get hurt, because faking a <code>DbSet</code> with <code>list.AsQueryable()</code> is such an obvious idea.
    </p>
    <p>
      It works right up until the code under test does something async. EF Core's async operators are its own extension methods - "<code>ToListAsync</code>, <code>SingleAsync</code>, <code>AsAsyncEnumerable</code>, etc." - and they need a source that can actually be enumerated asynchronously. An <code>EnumerableQuery&lt;T&gt;</code> cannot: it implements <code>IQueryable&lt;T&gt;</code> but not <code>IAsyncEnumerable&lt;T&gt;</code>, and its provider is not an <code>IAsyncQueryProvider</code>. So the call throws an <code>InvalidOperationException</code> at runtime. Your production code is fine. Your test blows up on the first <code>await</code> - which you can confirm in about thirty seconds, and which is worth doing rather than taking my word for it.
    </p>
    <p>
      That is the entire reason libraries like MockQueryable exist. But before you reach for one, notice that the EF Core testing docs point away from this road altogether: they say "Mocking <code>DbSet</code> for querying is complex and difficult, and suffers from the same disadvantages as the in-memory approach; we discourage this as well." They are just as blunt about the in-memory provider - "it is highly limited and we discourage its use" - and steer you toward SQLite in-memory mode, which "offers better compatibility with production relational databases, since SQLite is itself a full-fledged relational database", or toward testing against your real database system.
    </p>
    <div className={styles.callout}>
      <strong>The takeaway:</strong> if your test needs to exercise a query, give it something that can actually run one. A fake <code>IQueryable</code> does not translate SQL, does not enforce your constraints, and does not support the async API you are calling - so a passing test proves very little about the query you shipped.
    </div>

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
            <td>C# logic in a <code>Where</code>, <code>OrderBy</code> or join</td>
            <td>Narrow on the server, then <code>AsEnumerable()</code> (with <code>AsNoTracking()</code>), then apply it.</td>
          </tr>
          <tr>
            <td>C# logic in the final <code>Select</code></td>
            <td>Nothing. Client evaluation in the top-level projection is supported.</td>
          </tr>
          <tr>
            <td>You enumerate the results more than once</td>
            <td><code>ToList()</code> - one query, then reuse. <code>AsEnumerable()</code> would re-query.</td>
          </tr>
          <tr>
            <td>You pass through the results once</td>
            <td><code>AsEnumerable()</code> - stream, and skip the extra list.</td>
          </tr>
          <tr>
            <td>Faking a <code>DbSet</code> in a test</td>
            <td>Do not. The docs discourage it; async operators throw on an <code>EnumerableQuery</code>. Use SQLite in-memory or a real database.</td>
          </tr>
          <tr>
            <td>An <code>IEnumerable</code> variable that is secretly an EF query</td>
            <td><code>AsQueryable()</code> restores translation - but fix the type instead.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      <strong>The one rule worth remembering: none of these methods is dangerous. Their position is.</strong> Call them after the database has finished its work and they are exactly the right tool. Call them before, and you have just asked for the whole table.
    </p>

    <h2>Frequently asked questions</h2>
    <div className={styles.faq}>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What is the difference between AsEnumerable and ToList?</strong>
        <p className={styles.faqA}>Both switch the query to client evaluation. AsEnumerable stays deferred and streams the results; ToList executes immediately and buffers everything into a list, which takes additional memory. Prefer AsEnumerable when you pass through the rows once, and ToList when you enumerate several times, since the list means only one trip to the database.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Does AsEnumerable really use constant memory?</strong>
        <p className={styles.faqA}>Only on a no-tracking query. On a tracking query - the default - the DbContext keeps a reference to every entity it materialises, no matter which operators you use afterwards, so the rows are not really released until the context is disposed. If you are streaming rows in order to discard most of them, combine AsEnumerable with AsNoTracking.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Does calling AsQueryable() on a List give me SQL translation?</strong>
        <p className={styles.faqA}>No. On an in-memory collection it produces an EnumerableQuery, a queryable-shaped wrapper whose provider still executes everything in memory. There is no database behind it, so no SQL is generated and none can be. It satisfies a method signature; it does not make anything faster.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Why does ToListAsync throw when I mock a DbSet with AsQueryable?</strong>
        <p className={styles.faqA}>Because an EnumerableQuery's provider is not an IAsyncQueryProvider and the source is not an IAsyncEnumerable, so EF Core's async operators - ToListAsync, FirstOrDefaultAsync, CountAsync - have nothing to work with and throw at runtime. It is why libraries like MockQueryable exist, and why the EF Core testing docs call mocking DbSet for querying "complex and difficult" and discourage it, pointing to SQLite in-memory mode or your real database system instead.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Do I need AsEnumerable to call a C# method in my query?</strong>
        <p className={styles.faqA}>Not if the method is only in the final Select. EF Core supports partial client evaluation in the top-level projection, so it fetches the columns it needs and runs your method on the results. You only need a hand-off when the untranslatable code sits in a Where, an OrderBy, or a join - and there EF Core throws rather than silently pulling the table into memory.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Can AsQueryable() rescue a query that was typed as IEnumerable?</strong>
        <p className={styles.faqA}>Yes, technically. If the object is still a real EF Core query and was only typed as IEnumerable, AsQueryable returns the original IQueryable, provider intact, so subsequent operators are translated again. It is a good demonstration that the static type was the only problem - but it is a patch over a broken signature. Fix the type instead.</p>
      </div>
    </div>

    <h2>Official resources</h2>
    <ul>
      <li><a href="https://learn.microsoft.com/en-us/ef/core/querying/client-eval" target="_blank" rel="noopener noreferrer" className={styles.link}>Client vs. server evaluation - EF Core, Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/ef/core/testing/" target="_blank" rel="noopener noreferrer" className={styles.link}>Testing applications that use EF Core - Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/ef/core/testing/choosing-a-testing-strategy" target="_blank" rel="noopener noreferrer" className={styles.link}>Choosing a testing strategy - EF Core, Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/ef/core/querying/tracking" target="_blank" rel="noopener noreferrer" className={styles.link}>Tracking vs. no-tracking queries - EF Core, Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/dotnet/api/system.linq.queryable.asqueryable" target="_blank" rel="noopener noreferrer" className={styles.link}>Queryable.AsQueryable method - .NET API, Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/ef/core/miscellaneous/async" target="_blank" rel="noopener noreferrer" className={styles.link}>Asynchronous programming - EF Core, Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/ef/core/performance/efficient-querying" target="_blank" rel="noopener noreferrer" className={styles.link}>Efficient querying - EF Core, Microsoft Learn</a></li>
    </ul>

  </div>
);

export default AsEnumerableVsToListVsAsQueryable;
