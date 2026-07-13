import React from 'react';
import styles from './Article.module.css';

const EfCoreTransactions = () => (
  <div className={styles.article}>

    <div className={styles.quickAnswer}>
      <strong>Quick answer:</strong> You already have a transaction. EF Core wraps every <code>SaveChanges</code> call in one, so a single save either fully succeeds or leaves the database untouched. You need an explicit transaction only when <strong>one atomic unit spans more than one save</strong> - several <code>SaveChanges</code> calls, an <code>ExecuteUpdate</code>, raw SQL, or a second <code>DbContext</code>. And the moment you open one by hand, retrying execution strategies stop working unless you wrap the whole thing in <code>CreateExecutionStrategy()</code>.
    </div>

    <p className={styles.lead}>
      Transactions in EF Core are one of those topics where the framework does most of the work for you, silently, until one day it does not. Most of the transaction bugs I have seen were not caused by writing a transaction badly - they were caused by not realising one was already there, or by opening a second one on top of it. Here is what EF Core gives you for free, and the exact points at which you have to take over.
    </p>

    <img
      src="/images/eftransactions.png"
      alt="EF Core transactions: commit, rollback and savepoints"
      style={{ width: '100%', borderRadius: '12px', margin: '1.5rem 0' }}
    />

    <h2>What does SaveChanges already give you?</h2>
    <p>
      More than most people assume. Straight from the docs: "By default, if the database provider supports transactions, <strong>all changes in a single call to <code>SaveChanges</code> are applied in a transaction</strong>. If any of the changes fail, then the transaction is rolled back and none of the changes are applied to the database."
    </p>
    <p>
      So this is already atomic. The order and all of its lines are inserted together, or not at all. There is no half-written order, even if the third line violates a constraint.
    </p>
    <pre className={styles.code}>{`var order = new Order { CustomerId = customerId };
order.Lines.Add(new OrderLine { Sku = "A-100", Quantity = 2 });
order.Lines.Add(new OrderLine { Sku = "B-220", Quantity = 1 });

db.Orders.Add(order);

// One transaction, opened and committed by EF Core.
await db.SaveChangesAsync(ct);`}</pre>
    <p>
      The docs are blunt about what follows from this: "For most applications, this default behavior is sufficient. <strong>You should only manually control transactions if your application requirements deem it necessary.</strong>" If your unit of work is one <code>SaveChanges</code>, you are done - reaching for <code>BeginTransaction</code> here adds nothing but ceremony.
    </p>

    <h2>When do you actually need an explicit transaction?</h2>
    <p>
      When the thing that must be all-or-nothing is bigger than a single save. In practice that means one of these:
    </p>
    <ul>
      <li><strong>Two or more <code>SaveChanges</code> calls</strong> that must land together.</li>
      <li><strong>A <code>SaveChanges</code> plus an <code>ExecuteUpdate</code> or <code>ExecuteDelete</code>.</strong> These bypass the change tracker and, as I covered in <a href="/blog/aspnet-core-background-jobs-race-conditions" className={styles.link}>the article on conditional updates</a>, they "do not implicitly start a transaction when they're invoked" - each call is its own.</li>
      <li><strong>EF Core plus raw SQL</strong>, or EF Core plus a second <code>DbContext</code>.</li>
    </ul>
    <p>
      Placing an order and decrementing stock is the classic case. The insert is one operation, the stock decrement is another, and shipping an order without reserving stock is exactly the corruption you are trying to avoid.
    </p>
    <pre className={styles.code}>{`await using var tx = await db.Database.BeginTransactionAsync(ct);

db.Orders.Add(order);
await db.SaveChangesAsync(ct);

// Separate operation. Without tx it would be its own transaction;
// with tx open on the context, it joins this one.
var reserved = await db.Stock
    .Where(s => s.Sku == sku && s.Available >= quantity)
    .ExecuteUpdateAsync(s => s
        .SetProperty(x => x.Available, x => x.Available - quantity), ct);

if (reserved == 0)
    throw new OutOfStockException(sku);   // no commit -> rolled back on dispose

await tx.CommitAsync(ct);`}</pre>
    <p>
      There is no <code>try</code>/<code>catch</code> here on purpose. <code>await using</code> disposes the transaction on any exception, and a transaction disposed without a commit is rolled back. Calling <code>RollbackAsync</code> yourself in a <code>catch</code> is not just redundant - if the exception came out of <code>CommitAsync</code>, the transaction is already finished and the rollback can throw on top of the original error. Let disposal do it.
    </p>
    <div className={styles.callout}>
      <strong>One caution on mixing.</strong> The docs advise that "it is usually a good idea to avoid mixing both tracked <code>SaveChanges</code> modifications and untracked modifications via <code>ExecuteUpdate</code>/<code>ExecuteDelete</code>", because <code>ExecuteUpdate</code> writes straight past the change tracker and leaves any tracked copy of that row stale. The example above is safe precisely because the two touch different entities - <code>Stock</code> is never loaded into the tracker. If you <code>ExecuteUpdate</code> a row you have also loaded and modified, the later <code>SaveChanges</code> will happily overwrite it.
    </div>

    <h2>Which isolation level are you actually getting?</h2>
    <p>
      Whichever one your provider defaults to - on SQL Server, that is Read Committed. <code>BeginTransactionAsync</code> takes an overload if you need something stronger:
    </p>
    <pre className={styles.code}>{`using System.Data;

await using var tx = await db.Database.BeginTransactionAsync(
    IsolationLevel.Serializable, ct);`}</pre>
    <p>
      The level decides which anomalies the database is allowed to show you inside the transaction.
    </p>
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Level</th>
            <th>Dirty read</th>
            <th>Non-repeatable read</th>
            <th>Phantom read</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Read Uncommitted</td>
            <td>possible</td>
            <td>possible</td>
            <td>possible</td>
          </tr>
          <tr>
            <td>Read Committed <em>(SQL Server default)</em></td>
            <td>prevented</td>
            <td>possible</td>
            <td>possible</td>
          </tr>
          <tr>
            <td>Repeatable Read</td>
            <td>prevented</td>
            <td>prevented</td>
            <td>possible</td>
          </tr>
          <tr>
            <td>Serializable</td>
            <td>prevented</td>
            <td>prevented</td>
            <td>prevented</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      The EF Core docs describe repeatable read as guaranteeing "that a transaction sees data in the database as it was when the transaction started, without being affected by any subsequent concurrent activity" - and note that databases reach that guarantee in two very different ways. SQL Server's <em>repeatable read</em> takes shared locks, so a concurrent writer <strong>blocks</strong> until you finish. SQL Server's <em>snapshot</em> level does not lock; it lets the other transaction write and then raises a serialization error when you try to. Serializable, per the docs, "provides the same guarantees as repeatable read (and adds additional ones)".
    </p>
    <p>
      Raising the level is not free - you trade concurrency for consistency, and on a locking implementation you trade it for blocked writers. If you do raise it, keep the transaction short.
    </p>

    <h2>What are savepoints, and why does EF Core create them for you?</h2>
    <p>
      Here is a behaviour most people do not know about. Once a transaction is open on the context, EF Core is quietly protecting each save inside it:
    </p>
    <blockquote className={styles.blockquote}>
      "When <code>SaveChanges</code> is invoked and a transaction is already in progress on the context, EF automatically creates a <em>savepoint</em> before saving any data... If <code>SaveChanges</code> encounters any error, it automatically rolls the transaction back to the savepoint, leaving the transaction in the same state as if it had never started."
    </blockquote>
    <p>
      That is why a failed <code>SaveChanges</code> inside a transaction does not poison the whole transaction. You can catch the error, fix the data, and save again - which is exactly what you want when a concurrency conflict throws.
    </p>
    <p>
      Which tells you exactly when a <em>manual</em> savepoint is worth placing - and when it is not. Wrapping a single <code>SaveChanges</code> in your own savepoint adds nothing: EF already did it. A manual savepoint earns its place when the optional sub-unit is made of <strong>several</strong> saves, and a failure in the last one must undo all of them.
    </p>
    <p>
      Enrolling an order into a loyalty programme is that shape. It writes a membership row, then applies points, then records a bonus - three saves. If the bonus step fails, you want the whole enrolment gone, but the order itself to survive.
    </p>
    <pre className={styles.code}>{`await using var tx = await db.Database.BeginTransactionAsync(ct);

db.Orders.Add(order);
await db.SaveChangesAsync(ct);

// Everything after this point is optional and must undo as a group
await tx.CreateSavepointAsync("BeforeEnrolment", ct);

try
{
    db.Memberships.Add(membership);
    await db.SaveChangesAsync(ct);

    db.PointsEntries.Add(points);
    await db.SaveChangesAsync(ct);

    db.Bonuses.Add(bonus);
    await db.SaveChangesAsync(ct);   // if this fails, the two above must go too
}
catch (LoyaltyException)
{
    // Undo the whole enrolment. The order survives.
    await tx.RollbackToSavepointAsync("BeforeEnrolment", ct);
}

await tx.CommitAsync(ct);`}</pre>
    <div className={styles.callout}>
      <strong>A savepoint rolls back the database, not your DbContext.</strong> <code>RollbackToSavepointAsync</code> undoes the rows, but the change tracker is untouched - the entities you added or modified after the savepoint are still sitting there in their <code>Added</code> or <code>Modified</code> state. Commit right after, as above, and nothing more is written. But call <code>SaveChanges</code> again on the same context and EF will cheerfully re-apply the changes you just rolled back. If the context lives on, clear the tracker or drop the context.
    </div>
    <div className={styles.callout}>
      <strong>Warning worth knowing about.</strong> The docs state that savepoints "are incompatible with SQL Server's Multiple Active Result Sets (MARS)". EF will not create them when MARS is enabled on the connection - even if MARS is not actively in use - and if an error occurs during <code>SaveChanges</code>, "the transaction may be left in an unknown state". If your connection string has <code>MultipleActiveResultSets=True</code>, you have silently lost this safety net.
    </div>

    <h2>Why does your transaction break the moment you enable retries?</h2>
    <p>
      This is the one that bites people in production, and it appears the first time someone turns on connection resiliency for Azure SQL.
    </p>
    <p>
      With <code>EnableRetryOnFailure()</code>, EF Core wraps each operation so it can be replayed after a transient failure. But an explicit transaction defines <em>your own</em> unit of work, and EF cannot know how to replay it. So it refuses:
    </p>
    <pre className={styles.code}>{`InvalidOperationException: The configured execution strategy
'SqlServerRetryingExecutionStrategy' does not support user-initiated
transactions. Use the execution strategy returned by
'DbContext.Database.CreateExecutionStrategy()' to execute all the
operations in the transaction as a retriable unit.`}</pre>
    <p>
      The error message tells you the fix, and it is worth reading carefully: hand the entire transaction to the execution strategy as a single delegate. If a transient failure hits, the strategy replays the whole block - transaction and all.
    </p>
    <pre className={styles.code}>{`// IDbContextFactory, injected. The delegate may run more than once,
// so it must build its own context every time.
await using var probe = await factory.CreateDbContextAsync(ct);
var strategy = probe.Database.CreateExecutionStrategy();

await strategy.ExecuteAsync(async () =>
{
    await using var db = await factory.CreateDbContextAsync(ct);
    await using var tx = await db.Database.BeginTransactionAsync(ct);

    db.Orders.Add(new Order { CustomerId = customerId, Sku = sku });
    await db.SaveChangesAsync(ct);

    await db.Stock
        .Where(s => s.Sku == sku)
        .ExecuteUpdateAsync(s => s
            .SetProperty(x => x.Available, x => x.Available - quantity), ct);

    await tx.CommitAsync(ct);
});`}</pre>
    <p>
      Everything that must be retried together goes inside the delegate. This is not optional decoration - without it, any explicit transaction in an app with retries enabled throws on the first line.
    </p>
    <div className={styles.callout}>
      <strong>The delegate must be replayable, and that is the part people get wrong.</strong> It is tempting to reuse the injected <code>DbContext</code> and an entity instance created outside. Do not. If the first attempt saved successfully and only the <em>commit</em> failed, that entity is now tracked as <code>Unchanged</code> and carries a generated key - re-running <code>Add</code> on the retry is meaningless. Build a fresh context and fresh entities inside the delegate, which is exactly why the Microsoft sample creates its context there too.
    </div>

    <h2>How do you share one transaction across contexts or with raw SQL?</h2>
    <p>
      Two contexts do not automatically share a transaction, because they do not automatically share a connection. The docs are strict about the requirement: "To share a transaction, the contexts must share both a <code>DbConnection</code> <strong>and</strong> a <code>DbTransaction</code>."
    </p>
    <p>
      That first half is the one people skip. A <code>DbTransaction</code> belongs to the connection it was opened on, so handing it to a context sitting on a <em>different</em> connection does not work. Both contexts have to be constructed over the <strong>same connection instance</strong>.
    </p>
    <pre className={styles.code}>{`using Microsoft.EntityFrameworkCore.Storage;   // for GetDbTransaction()

await using var connection = new SqlConnection(connectionString);

// Both contexts are built over the SAME connection instance
var orderOptions = new DbContextOptionsBuilder<OrdersContext>()
    .UseSqlServer(connection)
    .Options;

var auditOptions = new DbContextOptionsBuilder<AuditContext>()
    .UseSqlServer(connection)      // <- the same 'connection', not a new one
    .Options;

await using var orders = new OrdersContext(orderOptions);
await using var tx = await orders.Database.BeginTransactionAsync(ct);

orders.Orders.Add(order);
await orders.SaveChangesAsync(ct);

// Second context enlists in the transaction already running on that connection
await using var audit = new AuditContext(auditOptions);
await audit.Database.UseTransactionAsync(tx.GetDbTransaction(), ct);

audit.Entries.Add(new AuditEntry { Action = "OrderPlaced", OrderId = order.Id });
await audit.SaveChangesAsync(ct);

await tx.CommitAsync(ct);   // both contexts commit as one`}</pre>
    <p>
      The same <code>UseTransactionAsync</code> call is how you mix EF Core with raw ADO.NET: open the connection and the <code>DbTransaction</code> yourself, set <code>command.Transaction</code> on the raw command, hand the same transaction to the context, and both commit or roll back as one.
    </p>

    <h2>What about TransactionScope?</h2>
    <p>
      <code>TransactionScope</code> gives you an <em>ambient</em> transaction - anything that enlists on the current thread joins it, without you passing a transaction object around. It is the right tool when the scope you need to coordinate is wider than one context.
    </p>
    <p>
      It comes with sharp edges, though, and the docs list them plainly:
    </p>
    <ul>
      <li><strong>Async needs an opt-in.</strong> "If you're using async APIs, be sure to specify <code>TransactionScopeAsyncFlowOption.Enabled</code> in the <code>TransactionScope</code> constructor to ensure that the ambient transaction flows across async calls." Forget it, and your <code>await</code> silently escapes the scope.</li>
      <li><strong>No async commit or rollback.</strong> "TransactionScope does not support async commit/rollback; that means that disposing it synchronously blocks the executing thread until the operation is complete."</li>
      <li><strong>Distributed transactions are narrow.</strong> Support "was added to .NET 7.0 for Windows only. Any attempt to use distributed transactions on older .NET versions or on non-Windows platforms will fail." If you deploy to Linux containers, that is a hard stop.</li>
    </ul>
    <pre className={styles.code}>{`using var scope = new TransactionScope(
    TransactionScopeOption.Required,
    new TransactionOptions { IsolationLevel = IsolationLevel.ReadCommitted },
    TransactionScopeAsyncFlowOption.Enabled);   // do not omit this

// ... EF Core and/or ADO.NET work here ...

scope.Complete();`}</pre>

    <h2>When should you use each?</h2>
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Approach</th>
            <th>Use it when</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Nothing - just <code>SaveChanges</code></td>
            <td>Your atomic unit is one save. This covers the large majority of code, and the docs recommend it.</td>
          </tr>
          <tr>
            <td><code>BeginTransactionAsync</code></td>
            <td>The unit spans several saves, or mixes <code>SaveChanges</code> with <code>ExecuteUpdate</code>, <code>ExecuteDelete</code>, or raw SQL.</td>
          </tr>
          <tr>
            <td>A stricter <code>IsolationLevel</code></td>
            <td>Read Committed is not enough - you cannot tolerate non-repeatable reads or phantoms inside the transaction. Expect to pay in concurrency.</td>
          </tr>
          <tr>
            <td>Savepoints</td>
            <td>An optional sub-unit inside a transaction spans <em>several</em> saves and must be abandoned as a group. A single save is already protected automatically.</td>
          </tr>
          <tr>
            <td><code>CreateExecutionStrategy()</code> wrapper</td>
            <td>Always, when retries are enabled and you open a transaction by hand. Not optional.</td>
          </tr>
          <tr>
            <td><code>UseTransactionAsync</code></td>
            <td>Two contexts, or EF Core plus ADO.NET, must commit as one.</td>
          </tr>
          <tr>
            <td><code>TransactionScope</code></td>
            <td>You need an ambient transaction across a wider scope - and you have checked the async and platform limitations above.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      The short version: start with none of it. Add an explicit transaction only when you can name the second operation that has to land with the first. That single question - "what else must succeed or fail with this?" - decides everything on this page.
    </p>

    <h2>Frequently asked questions</h2>
    <div className={styles.faq}>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Does SaveChanges run inside a transaction by default?</strong>
        <p className={styles.faqA}>Yes. If the provider supports transactions, all changes in a single SaveChanges call are applied in one transaction. If any change fails, the whole call is rolled back and the database is left unmodified. You do not need BeginTransaction to make a single save atomic.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>When do I actually need BeginTransaction?</strong>
        <p className={styles.faqA}>When the all-or-nothing unit is bigger than one save: several SaveChanges calls, a SaveChanges combined with ExecuteUpdate or ExecuteDelete (which do not start a transaction of their own), raw SQL mixed with EF Core, or two DbContext instances that must commit together.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Why do I get "does not support user-initiated transactions"?</strong>
        <p className={styles.faqA}>Because you enabled a retrying execution strategy (EnableRetryOnFailure) and then opened a transaction yourself. EF cannot know how to replay your transaction after a transient failure, so it throws. The fix is to get an execution strategy from DbContext.Database.CreateExecutionStrategy() and run the whole transaction inside strategy.ExecuteAsync, so it can be retried as one unit.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Does EF Core create savepoints automatically?</strong>
        <p className={styles.faqA}>Yes. When SaveChanges is called while a transaction is already open on the context, EF creates a savepoint first. If the save fails, it rolls back to that savepoint, so the transaction is left as if the save never happened and you can correct the problem and retry.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Why would savepoints silently stop working?</strong>
        <p className={styles.faqA}>Because of MARS. The docs state savepoints are incompatible with SQL Server's Multiple Active Result Sets, and EF will not create them when MARS is enabled on the connection - even if MARS is not actively used. If SaveChanges then fails inside a transaction, the transaction may be left in an unknown state. Check your connection string for MultipleActiveResultSets=True.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Can I use TransactionScope with async code?</strong>
        <p className={styles.faqA}>Yes, but you must pass TransactionScopeAsyncFlowOption.Enabled to the constructor, otherwise the ambient transaction does not flow across await calls. Also note that TransactionScope has no async commit or rollback - disposing it blocks the thread - and distributed transactions only work on .NET 7 or later, on Windows.</p>
      </div>
    </div>

    <h2>Official resources</h2>
    <ul>
      <li><a href="https://learn.microsoft.com/en-us/ef/core/saving/transactions" target="_blank" rel="noopener noreferrer" className={styles.link}>Transactions - EF Core, Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/ef/core/miscellaneous/connection-resiliency#execution-strategies-and-transactions" target="_blank" rel="noopener noreferrer" className={styles.link}>Connection resiliency: execution strategies and transactions - EF Core, Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/ef/core/saving/execute-insert-update-delete" target="_blank" rel="noopener noreferrer" className={styles.link}>ExecuteUpdate and ExecuteDelete - EF Core, Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/ef/core/saving/concurrency" target="_blank" rel="noopener noreferrer" className={styles.link}>Handling concurrency conflicts - EF Core, Microsoft Learn</a></li>
    </ul>

  </div>
);

export default EfCoreTransactions;
