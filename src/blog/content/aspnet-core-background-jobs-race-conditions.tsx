import React from 'react';
import styles from './Article.module.css';

const AspNetCoreBackgroundJobsRaceConditions = () => (
  <div className={styles.article}>

    <div className={styles.quickAnswer}>
      <strong>Quick answer:</strong> EF Core's <code>ExecuteUpdateAsync</code> sends a single <code>UPDATE</code> to the database and returns the number of rows it changed. Put your precondition in the <code>WHERE</code> clause and that return value becomes a verdict: <strong>zero rows means the precondition was no longer true when the write landed.</strong> Microsoft documents this as a way of "implementing concurrency control yourself". It is also the cleanest way to let many instances of a Web API share one job table without ever processing the same job twice.
    </div>

    <p className={styles.lead}>
      This is the last part of the series. In <a href="/blog/aspnet-core-stateful-assumptions" className={styles.link}>part one</a> I mapped the state hiding inside a Web API process, and in <a href="/blog/aspnet-core-stateless-web-api" className={styles.link}>part two</a> I moved it into shared infrastructure. Background workers survived both. Rather than start from the bug, I want to start from the tool - one small, well-documented EF Core behaviour - and then show the class of problem it quietly solves.
    </p>

    <img
      src="/images/jobclaiming.png"
      alt="Two workers competing to claim the same background job"
      style={{ width: '100%', borderRadius: '12px', margin: '1.5rem 0' }}
    />

    <h2>What does a conditional UPDATE actually guarantee?</h2>
    <p>
      Start with the mechanism, because everything else follows from it.
    </p>
    <p>
      <code>ExecuteUpdate</code> and <code>ExecuteDelete</code> are, in the words of the docs, "a way to save data to the database without using EF's traditional change tracking and <code>SaveChanges()</code> method". The call "executes very efficiently in the database, without loading any data from the database or involving EF's change tracker", and it "takes effect immediately, at the point in which it is invoked".
    </p>
    <p>
      The interesting part is the return value. Both methods "return the number of rows that were affected by the operation; this can come particularly handy for <strong>implementing concurrency control yourself</strong>". Microsoft's own example in that section looks like this:
    </p>
    <pre className={styles.code}>{`// (load the ID and concurrency token for a Blog in the database)

var numUpdated = await context.Blogs
    .Where(b => b.Id == id && b.ConcurrencyToken == concurrencyToken)
    .ExecuteUpdateAsync(/* ... */);

if (numUpdated == 0)
{
    throw new Exception("Update failed!");
}`}</pre>
    <p>
      Read what that <code>WHERE</code> clause is doing. It is not selecting a row - it is stating a <em>condition under which the write is allowed</em>. The database evaluates it at the instant of the write. If the condition no longer holds, no row matches, and the update touches nothing.
    </p>
    <p>
      That gives you a guarantee you cannot get any other way in application code: <strong>the check and the write happen as one indivisible operation.</strong> There is no window between deciding and acting, because there is no "deciding" step in your process at all - the database decides, and reports the verdict as a row count.
    </p>
    <div className={styles.callout}>
      <strong>The primitive, stated plainly.</strong> A conditional <code>UPDATE</code> plus a rows-affected check is a compare-and-swap against the database. One caller wins, everyone else is told they changed zero rows. Zero is not an error - it is the answer.
    </div>

    <h2>What problem does that solve?</h2>
    <p>
      It solves <em>check-then-act</em>, which is one of the most common ways concurrent code goes wrong.
    </p>
    <p>
      Any time your code reads shared data, decides something based on what it read, and then writes - the read and the write are two separate trips to the database, and anything can happen in the gap. The value you based your decision on may no longer be true by the time you act on it.
    </p>
    <pre className={styles.code}>{`// The shape of the bug, in the abstract
var row = await db.Things.FirstOrDefaultAsync(t => t.IsFree, ct);  // check
if (row is null) return;

row.IsFree = false;          // act
await db.SaveChangesAsync(ct);`}</pre>
    <p>
      Two callers can both pass the check before either one acts. Both writes then succeed, because each is a perfectly legal update. Nothing throws, no constraint is violated, and the system never tells you anything went wrong. That is what makes this class of bug hard to catch: <strong>the failure is silent, and it only appears under concurrency.</strong>
    </p>
    <p>
      The conditional <code>UPDATE</code> removes the gap by refusing to separate the check from the act.
    </p>

    <h2>Where does this bite in a scaled-out Web API?</h2>
    <p>
      Most sharply in background workers - and this is where part one comes back to haunt you.
    </p>
    <p>
      A <code>BackgroundService</code> runs inside the app host, and every instance of your API is its own app host. Run four instances and you have four copies of the worker, all polling the same table, none of them aware of the others. On one instance this is invisible. On four, the worker is no longer a background task - it is a distributed system you did not sit down and design.
    </p>
    <p>
      Now give those four workers the check-then-act shape and watch it fail:
    </p>
    <pre className={styles.code}>{`// BROKEN as soon as more than one instance runs this
var job = await db.Jobs
    .FirstOrDefaultAsync(j => j.Status == JobStatus.Pending, ct);

if (job is null)
    return;

job.Status = JobStatus.Processing;
await db.SaveChangesAsync(ct);

await ProcessAsync(job, ct);`}</pre>
    <ol>
      <li>Worker A reads job 42 and sees <code>Pending</code>.</li>
      <li>A millisecond later worker B reads job 42. It also sees <code>Pending</code>, because A has not saved yet.</li>
      <li>A writes <code>Processing</code>. The write succeeds.</li>
      <li>B writes <code>Processing</code>. That write also succeeds.</li>
      <li>Both workers run the job.</li>
    </ol>
    <p>
      The result is work done twice: a webhook delivered twice, an invoice generated twice, a payment captured twice. The code passes review, passes tests, and behaves correctly for months on a single instance - until a deployment raises the replica count.
    </p>

    <h2>How do you apply the technique to job claiming?</h2>
    <p>
      Take the primitive from the top of the article and make the precondition "this job is free". A job is free if it is <code>Pending</code>, or if some worker claimed it but its lease has since run out.
    </p>
    <pre className={styles.code}>{`var now = DateTimeOffset.UtcNow;
var leaseUntil = now.AddMinutes(5);

var claimed = await db.Jobs
    .Where(j => j.Id == candidateId
                && (j.Status == JobStatus.Pending
                    || (j.Status == JobStatus.Processing
                        && j.LeaseExpiresAt < now)))
    .ExecuteUpdateAsync(s => s
        .SetProperty(j => j.Status, JobStatus.Processing)
        .SetProperty(j => j.ClaimedBy, workerId)
        .SetProperty(j => j.LeaseExpiresAt, leaseUntil), ct);

if (claimed == 0)
{
    // Another worker took it first. Expected, not an error.
    return;
}

// We hold the lease. No other worker can be in here for this job.
await ProcessAsync(candidateId, ct);`}</pre>
    <p>
      Structurally this is Microsoft's concurrency-control example with a different precondition. Instead of "the concurrency token still matches", it says "the job is still available". The rows-affected check does the same job: <code>claimed == 0</code> means another worker won the race, and the correct response is to shrug and move on.
    </p>
    <p>
      For <code>workerId</code>, anything identifying the instance works. The <code>Environment.MachineName</code> and <code>Environment.ProcessId</code> pair from part one is a good choice, and it makes the table readable during an incident: you can see which instance holds which job.
    </p>
    <p>
      To be precise about where the line sits: EF Core documents the <em>mechanism</em> - conditional update, rows-affected check - as a way to implement concurrency control yourself. Applying it to job claiming with expiring leases is ordinary engineering on top of that mechanism, not a pattern Microsoft ships.
    </p>

    <h2>Why the lease must expire, and completion must check ownership</h2>
    <p>
      That second half of the <code>WHERE</code> clause is not a nicety. It is crash recovery.
    </p>
    <p>
      Workers die - a pod is evicted, a deployment rolls, a process is killed. If a worker dies holding job 42 and leases never expire, job 42 sits in <code>Processing</code> permanently and nothing ever picks it up again. An expiring lease returns abandoned work to the pool on its own.
    </p>
    <p>
      Which creates the mirror problem. A worker whose lease quietly expired may still be running, still believing it owns the job. If it finishes and marks the job complete, it overwrites the work of the worker that legitimately re-claimed it. So completion needs the same primitive - a conditional update, with ownership as the precondition.
    </p>
    <pre className={styles.code}>{`var completed = await db.Jobs
    .Where(j => j.Id == jobId && j.ClaimedBy == workerId)
    .ExecuteUpdateAsync(s => s
        .SetProperty(j => j.Status, JobStatus.Completed)
        .SetProperty(j => j.CompletedAt, DateTimeOffset.UtcNow), ct);

if (completed == 0)
{
    // Our lease expired and another worker took over.
    // Do not overwrite their state.
    logger.LogWarning("Lost the lease on job {JobId}", jobId);
}`}</pre>
    <p>
      The same guard belongs on every other transition - marking a job failed, releasing it for retry. Each one asks the database "do I still own this?" and accepts the answer. The rule that falls out of all of it: <strong>never let a worker conclude on its own that it owns a job.</strong>
    </p>

    <h2>Where the technique stops helping</h2>
    <p>
      Atomic claiming guarantees one worker processes a job <em>at a time</em>. It does not guarantee the job runs <em>once, ever</em>, and no conditional update will.
    </p>
    <p>
      Consider the window. A worker claims job 42, delivers the webhook, and crashes before recording that the job is done. The lease expires, another worker sees a claimable job, and runs it. The system is behaving correctly - abandoned work must be retried - but the webhook has already gone out once.
    </p>
    <p>
      So the retry has to be harmless. The usual approach gives the side effect a unique key and lets the database refuse the duplicate.
    </p>
    <pre className={styles.code}>{`// Unique index on EventId - a second insert cannot succeed
db.WebhookDeliveries.Add(new WebhookDelivery
{
    EventId = eventId,
    ClaimedForDeliveryAt = DateTimeOffset.UtcNow
});

try
{
    await db.SaveChangesAsync(ct);
}
catch (DbUpdateException ex) when (ex.IsUniqueConstraintViolation())
{
    // A previous run already claimed this delivery, so this run is a
    // retry of work that at least started. Nothing to do.
    return;
}

await webhookSender.PostAsync(eventId, ct);`}</pre>
    <p>
      <strong>Read the ordering carefully, because it is a choice.</strong> Recording first and sending second means a crash in the gap <em>loses</em> the webhook: the row already exists, so every later retry hits the unique constraint and returns. Flip the two - send first, record second - and a crash in the gap <em>duplicates</em> it instead. Neither ordering closes the window; you are only picking which failure you would rather have.
    </p>
    <p>
      For most webhooks duplication is the safer failure, which is precisely why receivers are expected to deduplicate by event ID. Note also the exception filter: <code>IsUniqueConstraintViolation</code> is a small extension method that checks the provider-specific error (SqlState <code>23505</code> on PostgreSQL, error <code>2601</code> or <code>2627</code> on SQL Server). Catching <code>DbUpdateException</code> unconditionally would treat a deadlock or an unrelated constraint as "already delivered" and quietly abandon the job.
    </p>
    <p>
      So be clear about what any of this buys: it narrows the window, it does not close it. The database record and the outgoing call are still two different systems, and a crash between them either repeats the call or loses it. Closing the gap properly means the outbox pattern, or a broker with real delivery guarantees. What does not work is assuming exactly-once and building on the assumption.
    </p>

    <h2>When does something else fit better?</h2>
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Approach</th>
            <th>How work is claimed</th>
            <th>Use it when</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Database job table</td>
            <td>Conditional <code>UPDATE</code>, rows-affected check</td>
            <td>You already have the database, volume is moderate, and you want job state next to your business data.</td>
          </tr>
          <tr>
            <td>Optimistic concurrency</td>
            <td>A concurrency token such as <code>rowversion</code> goes into the <code>WHERE</code>; <code>SaveChanges</code> throws <code>DbUpdateConcurrencyException</code> when zero rows match</td>
            <td>You are updating an entity you loaded and want EF Core to apply the same guarantee for you automatically.</td>
          </tr>
          <tr>
            <td>Queue or message broker</td>
            <td>The broker hands each message to a single consumer</td>
            <td>High volume, retries, dead-lettering, fan-out. The coordination problem is already solved for you.</td>
          </tr>
          <tr>
            <td>Distributed lock</td>
            <td>A lease held in Redis or a similar store</td>
            <td>What you need to guard is not naturally a row you can attach a <code>WHERE</code> clause to.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      One EF Core detail if you take the job-table route: <code>ExecuteUpdate</code> and <code>ExecuteDelete</code> "do not implicitly start a transaction when they're invoked". Each call runs in its own. The single <code>UPDATE</code> is still atomic by itself, which is all the claim needs - but if a claim must succeed or fail together with another write, open a transaction explicitly.
    </p>

    <h2>Where this leaves the series</h2>
    <p>
      Part two ended on a test: can you kill any instance, at any moment, without losing anything that matters? Background workers are where that test usually fails - a worker that dies does not merely lose its memory, it can leave work half-finished and nobody able to touch it.
    </p>
    <p>
      Once claiming is atomic, leases expire on their own, and side effects tolerate a retry, the answer turns into yes. The worker stops being a process you have to keep alive and becomes one of several interchangeable consumers of a queue that happens to be a table. You can add one, remove one, or restart one without thinking about it - which was the point of scaling out in the first place.
    </p>

    <h2>Frequently asked questions</h2>
    <div className={styles.faq}>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What does ExecuteUpdateAsync actually return, and why does it matter?</strong>
        <p className={styles.faqA}>It returns the number of rows the UPDATE affected. EF Core's docs present this as a way of implementing concurrency control yourself: put a precondition in the WHERE clause, and if the call reports zero rows, the precondition was no longer true when the write reached the database. That row count is the whole safety mechanism.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Why is reading a row and then updating it unsafe?</strong>
        <p className={styles.faqA}>Because the check and the act are two separate trips to the database, and anything can happen in the gap. Two callers can both pass the check before either one writes, and both writes then succeed because each is a legal update. Nothing throws, so the failure is silent. A conditional UPDATE removes the gap by making the check part of the write.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Do background services run on every instance of my app?</strong>
        <p className={styles.faqA}>Yes. A BackgroundService or IHostedService runs inside the app host, and every instance is its own host. Four instances means four copies of the worker running at the same time. If the worker polls for jobs, they all compete for the same rows.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Why do job leases need an expiry?</strong>
        <p className={styles.faqA}>Because workers crash. If a worker dies while holding a job and the lease never expires, that job stays locked forever and nothing picks it up again. An expiry makes abandoned jobs claimable once more. The trade-off is that a worker whose lease expired may still be running, which is why completion also has to verify ownership with the same conditional update.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Can I guarantee a job runs exactly once?</strong>
        <p className={styles.faqA}>No, and designing as though you can is the mistake. A worker can always crash after doing the work but before recording that it did, and the retry that follows is correct behaviour. Design for at-least-once execution and make the side effects idempotent - usually with a unique key that makes a duplicate insert fail - so that a retry cannot corrupt anything.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Does ExecuteUpdateAsync run inside a transaction?</strong>
        <p className={styles.faqA}>Not on its own. The EF Core docs state that ExecuteUpdate and ExecuteDelete do not implicitly start a transaction, so each call runs in its own. The single UPDATE is still atomic by itself, which is all the claim requires. If a claim must succeed or fail together with another write, start a transaction explicitly.</p>
      </div>
    </div>

    <h2>Official resources</h2>
    <ul>
      <li><a href="https://learn.microsoft.com/en-us/ef/core/saving/execute-insert-update-delete#concurrency-control-and-rows-affected" target="_blank" rel="noopener noreferrer" className={styles.link}>ExecuteUpdate and ExecuteDelete: concurrency control and rows affected - EF Core, Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/ef/core/saving/concurrency" target="_blank" rel="noopener noreferrer" className={styles.link}>Handling concurrency conflicts - EF Core, Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/aspnet/core/fundamentals/host/hosted-services" target="_blank" rel="noopener noreferrer" className={styles.link}>Background tasks with hosted services in ASP.NET Core - Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/ef/core/saving/transactions" target="_blank" rel="noopener noreferrer" className={styles.link}>Using transactions - EF Core, Microsoft Learn</a></li>
    </ul>

  </div>
);

export default AspNetCoreBackgroundJobsRaceConditions;
