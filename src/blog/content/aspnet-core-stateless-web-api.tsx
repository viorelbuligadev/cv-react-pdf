import React from 'react';
import styles from './Article.module.css';

const AspNetCoreStatelessWebApi = () => (
  <div className={styles.article}>

    <div className={styles.quickAnswer}>
      <strong>Quick answer:</strong> To make an ASP.NET Core Web API stateless, move the state that must be shared out of the web process and into infrastructure built for it. In practice: a distributed cache (Redis or SQL Server) instead of <code>IMemoryCache</code>, <code>HybridCache</code> as the modern front end for it, a Redis-backed output cache, and shared object storage instead of local disk. Careful: <code>AddDistributedMemoryCache</code> sounds distributed but is not - the docs say plainly it "isn't an actual distributed cache".
    </div>

    <p className={styles.lead}>
      In the <a href="/blog/aspnet-core-stateful-assumptions" className={styles.link}>first part of this series</a> I mapped out the state that quietly lives inside a Web API process - the built-in rate limiter, the output cache, <code>IMemoryCache</code>, singletons, local files. Knowing it is there is half the job. This part is the other half: where that state should live instead, what it costs you, and what you can safely leave alone.
    </p>

    <img
      src="/images/distributedstate.png"
      alt="ASP.NET Core Web API instances sharing state through a distributed cache"
      style={{ width: '100%', borderRadius: '12px', margin: '1.5rem 0' }}
    />

    <h2>What does a stateless Web API actually mean?</h2>
    <p>
      It does not mean the API has no state. It means the <em>web process does not privately own</em> the state that has to survive a restart, be visible to every instance, or coordinate work.
    </p>
    <p>
      The practical test is brutal and simple: <strong>can you kill any instance at any moment without losing anything that matters?</strong> If yes, the process is disposable, and you can scale it, redeploy it, and replace it freely. If no, you have found state that needs to move.
    </p>

    <h2>How do you share cached data across instances?</h2>
    <p>
      A distributed cache is, in the words of the docs, "a cache shared by multiple app servers", maintained as an external service. That gives you two properties that an in-process cache can never have. Cached data:
    </p>
    <ul>
      <li>is <strong>coherent</strong> (consistent) across requests to multiple servers,</li>
      <li>and <strong>survives server restarts and app deployments</strong>.</li>
    </ul>
    <p>
      You talk to it through <code>IDistributedCache</code>, regardless of the backing store. Redis is the common choice; SQL Server and Postgres are supported too.
    </p>
    <pre className={styles.code}>{`builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration =
        builder.Configuration.GetConnectionString("Redis");
});`}</pre>
    <div className={styles.callout}>
      <strong>The trap in the name.</strong> <code>AddDistributedMemoryCache</code> is an <code>IDistributedCache</code> implementation, so it compiles and injects like the real thing - but the docs state it "isn't an actual distributed cache. The app instance stores the cached items on the server where the app is running." It is meant for development and testing. Shipping it to a scaled-out production API gives you per-instance caching with a name that says otherwise.
    </div>

    <h2>Why is HybridCache the better default?</h2>
    <p>
      Raw <code>IDistributedCache</code> works, but it is a <code>byte[]</code> API, you serialize by hand, and every read is a network call - even for data you just fetched a millisecond ago. <code>HybridCache</code> (ASP.NET Core 9 and later) sits on top and solves both problems.
    </p>
    <p>
      It is a two-level cache. L1 is in-process memory; L2 is the distributed cache. <code>GetOrCreateAsync</code> checks L1, then L2, and only calls your factory if both miss - then populates both.
    </p>
    <pre className={styles.code}>{`builder.Services.AddHybridCache();

// If an IDistributedCache (for example Redis) is registered,
// HybridCache automatically uses it as the L2 cache.

public class OrderService(HybridCache cache, IOrderRepository repo)
{
    public Task<Order> GetAsync(int id, CancellationToken ct = default) =>
        cache.GetOrCreateAsync(
            $"order/{id}",
            async token => await repo.LoadAsync(id, token),
            cancellationToken: ct);
}`}</pre>
    <p>
      The feature that earns its place, though, is <strong>stampede protection</strong>. When a popular key expires under load, a plain cache lets every concurrent request miss and hammer the database at once. HybridCache does not: it "ensures that only one concurrent caller for a given key calls the factory method, and all other callers wait for the result of that call". You get that even with no distributed cache configured at all.
    </p>
    <div className={styles.callout}>
      <strong>The subtle one, straight from the docs.</strong> When you invalidate an entry by key or tag, it is removed on the <em>current</em> server and in the distributed store - but "the in-memory cache in other servers isn't affected". Their L1 copies live on until they expire. If a value must go stale everywhere at once, keep <code>LocalCacheExpiration</code> short, or do not cache it in L1 at all.
    </div>

    <h2>Where does the rest of the state go?</h2>
    <p>
      Caching is the biggest piece, but the other per-process state from part one has somewhere to go too.
    </p>
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Per-process state</th>
            <th>Move it to</th>
            <th>How</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>In-memory cache</td>
            <td>Distributed cache</td>
            <td><code>HybridCache</code> over a Redis or SQL Server <code>IDistributedCache</code>.</td>
          </tr>
          <tr>
            <td>Output cache</td>
            <td>Redis-backed output cache</td>
            <td><code>AddStackExchangeRedisOutputCache</code> instead of the default in-process store.</td>
          </tr>
          <tr>
            <td>Rate limiter</td>
            <td>A shared store, or the gateway</td>
            <td>There is no built-in distributed limiter. Use a Redis-based limiter, or enforce global limits at the API gateway or ingress. (Only needed if the limit is meant to be global - see part one.)</td>
          </tr>
          <tr>
            <td>Local files</td>
            <td>Object storage</td>
            <td>Blob storage or an equivalent, so any instance can read what another wrote.</td>
          </tr>
          <tr>
            <td>Background job state</td>
            <td>Database or queue</td>
            <td>Workers must claim work atomically. That is the subject of part three.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <pre className={styles.code}>{`// output cache, shared across instances
builder.Services.AddStackExchangeRedisOutputCache(options =>
{
    options.Configuration =
        builder.Configuration.GetConnectionString("Redis");
});`}</pre>

    <h2>What does moving state out cost you?</h2>
    <p>
      This is not free, and pretending otherwise leads to bad designs. Be honest about the bill:
    </p>
    <ul>
      <li><strong>A network hop.</strong> A memory read becomes a call to another machine. That is microseconds turning into milliseconds. HybridCache's L1 is what softens this.</li>
      <li><strong>Serialization.</strong> Anything going to L2 must be serialized - <code>System.Text.Json</code> by default. Your cached type needs to survive a round trip.</li>
      <li><strong>Size limits.</strong> HybridCache defaults to a 1 MB maximum payload. Larger entries are logged and simply not cached, which is easy to miss until you wonder why your cache hit rate is zero.</li>
      <li><strong>A new dependency.</strong> Redis is now something that can be slow, be down, or fail over. Your API's behaviour when the cache is unavailable is a design decision, not an accident.</li>
    </ul>

    <h2>What should you move, and what should you leave alone?</h2>
    <p>
      Do not externalize everything reflexively. Apply the test from the top of the article.
    </p>
    <ul>
      <li><strong>Leave it local</strong> when the instance can rebuild it cheaply and nobody is harmed by two instances disagreeing for a few seconds. A read-through cache over a database is the classic case - the database is still the source of truth.</li>
      <li><strong>Move it out</strong> when the state must be coherent across instances, must survive a restart, or must coordinate work: a global rate limit, an output cache you rely on for consistency, records like receipts, and any job that must run exactly once.</li>
    </ul>
    <p>
      Get that split right and the process becomes disposable. You can add an instance, remove one, or deploy over one, and the system carries on - because nothing important was living inside it.
    </p>

    <h2>Frequently asked questions</h2>
    <div className={styles.faq}>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Does AddDistributedMemoryCache actually distribute anything?</strong>
        <p className={styles.faqA}>No. The docs are explicit: the distributed memory cache "isn't an actual distributed cache. The app instance stores the cached items on the server where the app is running." It implements IDistributedCache so you can swap in a real provider later, and it is useful for development and testing, but in a scaled-out deployment it gives you a per-instance cache.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Should I use HybridCache or IDistributedCache directly?</strong>
        <p className={styles.faqA}>Prefer HybridCache for new code. It gives you a two-level cache (in-process L1 plus your distributed L2), handles serialization, and adds stampede protection. It uses whatever IDistributedCache you registered as its secondary store, so you still choose Redis, SQL Server, or Postgres underneath.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What is a cache stampede, and how does HybridCache prevent it?</strong>
        <p className={styles.faqA}>A stampede happens when a popular cache entry expires and many concurrent requests all miss at once, so they all hit the database to rebuild the same value. HybridCache ensures that only one concurrent caller for a given key calls the factory method, and all other callers wait for that result. You get this even without a distributed cache configured.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>If I invalidate a cache entry, do all instances see it immediately?</strong>
        <p className={styles.faqA}>Not entirely. Removing by key or tag invalidates the entry on the current server and in the distributed store, but the docs note that the in-memory cache on other servers is not affected. Their L1 copies survive until they expire. If a value must go stale everywhere at once, use a short LocalCacheExpiration or avoid caching it locally.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Do I need Redis just to run more than one instance?</strong>
        <p className={styles.faqA}>Not necessarily. It depends on which state must actually be shared. If your API is token-based and its caches are read-through over a database, several instances can run happily with only local caches. You need a shared store when correctness depends on instances agreeing - global rate limits, shared output cache, coordinated background work.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Is there a size limit on what I can cache?</strong>
        <p className={styles.faqA}>Yes. HybridCache has a MaximumPayloadBytes option that defaults to 1 MB, and a MaximumKeyLength that defaults to 1024 characters. Attempts to store values above the limit are logged and the value is not cached - so a silently empty cache is often an oversized payload.</p>
      </div>
    </div>

    <h2>Official resources</h2>
    <ul>
      <li><a href="https://learn.microsoft.com/en-us/aspnet/core/performance/caching/hybrid" target="_blank" rel="noopener noreferrer" className={styles.link}>HybridCache library in ASP.NET Core - Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/aspnet/core/performance/caching/distributed" target="_blank" rel="noopener noreferrer" className={styles.link}>Distributed caching in ASP.NET Core - Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/aspnet/core/performance/caching/output" target="_blank" rel="noopener noreferrer" className={styles.link}>Output caching middleware in ASP.NET Core - Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit" target="_blank" rel="noopener noreferrer" className={styles.link}>Rate limiting middleware in ASP.NET Core - Microsoft Learn</a></li>
    </ul>

  </div>
);

export default AspNetCoreStatelessWebApi;
