import React from 'react';
import styles from './Article.module.css';

const AspNetCoreStatefulAssumptions = () => (
  <div className={styles.article}>

    <div className={styles.quickAnswer}>
      <strong>Quick answer:</strong> An ASP.NET Core Web API is supposed to be stateless, but several defaults are not. Run two instances behind a load balancer and the built-in rate limiter, the output cache, and the in-memory cache each keep their own copy per process. A "100 requests per minute" limit becomes 100 <em>per instance</em>, and a response cached on one instance is missing on another. The fix is to move shared state into a distributed store like Redis.
    </div>

    <p className={styles.lead}>
      A Web API is the easiest kind of app to scale horizontally - no server-side UI state, usually token-based auth, requests that should not care which instance answers them. That is the theory. In practice a few framework defaults quietly assume a single process, and they only misbehave once a load balancer puts a second instance in front of your API. This is the first part of a short series on horizontal scale. Here I map out which state still lives inside the web process.
    </p>

    <img
      src="/images/statelessapps.png"
      alt="Multiple ASP.NET Core Web API instances behind a load balancer, each with its own memory"
      style={{ width: '100%', borderRadius: '12px', margin: '1.5rem 0' }}
    />

    <h2>What changes when you add a second instance?</h2>
    <p>
      Horizontal scaling means running several copies of the same API behind a load balancer, instead of one bigger process. The load balancer spreads requests across the instances. It is one of the cheapest ways to add throughput and availability.
    </p>
    <p>
      The catch is one assumption. Each instance is a separate operating system process, often on a separate machine or container, with its own memory and its own disk. With a single process, every request hits the same state. With many processes, request one might land on instance A and request two on instance B. Unless you pin a caller to one instance with sticky sessions - which the Microsoft docs note hurts scalability - you cannot assume any two requests share the same process. So the real fix is to stop depending on process-local state at all.
    </p>

    <h2>Which built-in features break first?</h2>
    <p>
      The surprising part is that you can hit this without writing any code that looks stateful. Three framework features that are common in a Web API rely on per-process state by default.
    </p>

    <h3>Rate limiting</h3>
    <p>
      The built-in rate limiting middleware keeps its counters in the memory of the process. There is no distributed store behind it, so each instance enforces the limit on its own. Whether that is a problem depends on what the limit is protecting.
    </p>
    <p>
      If the limit protects each instance's own capacity - say, this process can handle a certain load of heavy work before it degrades - then per-instance enforcement is exactly right. Two instances giving twice the total throughput is the whole point of scaling, and you need nothing extra.
    </p>
    <p>
      It breaks when the limit is meant to be global: a per-caller quota you promised ("100 requests per minute per API key"), or protection for a shared resource like a single database or a paid third-party API. There, the load balancer spreads one caller's requests across instances, so with four instances that caller gets roughly 400 requests per minute before any single instance says no - four times the intended limit.
    </p>
    <pre className={styles.code}>{`builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("per-user", opt =>
    {
        opt.PermitLimit = 100;                 // 100 requests...
        opt.Window = TimeSpan.FromMinutes(1);  // ...per minute
    });
});`}</pre>
    <p>
      To enforce a global limit you have two common options: a distributed rate limiter backed by a shared store such as Redis, or rate limiting at the gateway or ingress layer - an API gateway or reverse proxy - where all traffic passes through one place before it reaches your instances.
    </p>

    <h3>Output caching</h3>
    <p>
      Output caching has the same shape, and the docs are explicit about it: the default store keeps cached responses in-process, so <em>each server has a separate cache that is lost whenever the server process restarts</em>. A response cached on instance A does nothing for a request served by instance B. To share the cache across instances, back it with Redis.
    </p>
    <pre className={styles.code}>{`// default store is in-memory, per instance
builder.Services.AddOutputCache();

// shared across instances via Redis
builder.Services.AddStackExchangeRedisOutputCache(options =>
{
    options.Configuration = "localhost:6379";
});`}</pre>

    <h3>In-memory cache</h3>
    <p>
      <code>IMemoryCache</code> lives inside the process too, so each instance keeps its own copy. For a read-through cache over a database this is usually fine - the source of truth is still the database, and each instance rebuilding its own entries is acceptable. It only becomes a bug when you treat the cache as if every instance sees the same entries. When you do need shared cache state, use a distributed cache (or <code>HybridCache</code> with a distributed backing store).
    </p>

    <h2>Which of your own code carries the same trap?</h2>
    <p>
      Beyond the framework features, the same rule applies to anything you store in the process yourself.
    </p>
    <p>
      A singleton or static field that holds data is per process - an in-memory counter, an ID generator, or a cached dictionary lives in one instance only, and the others never see it. Local files have the same problem, one step removed: writing a generated export to <code>Path.GetTempPath()</code> on one instance works until a later request to download it lands on a different instance, where the file does not exist. And background workers run per instance - a <code>BackgroundService</code> starts inside every app host, so if the worker polls for jobs, two instances can grab the same job at the same time. Making that safe is its own topic, which I will cover later in this series.
    </p>

    <div className={styles.callout}>
      <strong>The mental model:</strong> the API process is disposable. Any state that must survive a restart, be visible to every instance, or coordinate work has to live outside the process - in a database, a distributed cache, or shared storage. State the process can safely rebuild on its own can stay local. To prove it in a running system, expose an endpoint that returns <code>Environment.MachineName</code> and <code>Environment.ProcessId</code>, then watch the values flip between calls through the load balancer.
    </div>

    <h2>Which mechanisms carry hidden state?</h2>
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Mechanism</th>
            <th>Real scope</th>
            <th>Typical symptom after scaling</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Rate limiter (built-in)</td>
            <td>Per process</td>
            <td>A global limit multiplies by instance count</td>
          </tr>
          <tr>
            <td>Output cache (default store)</td>
            <td>Per process</td>
            <td>Response cached on one instance, recomputed on another</td>
          </tr>
          <tr>
            <td>IMemoryCache</td>
            <td>Per process</td>
            <td>Inconsistent cached values across instances</td>
          </tr>
          <tr>
            <td>Singleton / static field</td>
            <td>Per process</td>
            <td>Counters and throttles out of sync</td>
          </tr>
          <tr>
            <td>Local file</td>
            <td>Per machine / container</td>
            <td>File written on one instance, missing on another</td>
          </tr>
          <tr>
            <td>Background worker</td>
            <td>Per instance</td>
            <td>Same job processed more than once</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2>When is per-process state actually fine?</h2>
    <p>
      Not all local state is a bug. The test is whether the state must be shared, must survive a restart, or must coordinate work across instances. If the answer is no, keeping it local is fine and often faster.
    </p>
    <ul>
      <li><strong>Fine to keep local:</strong> a read-through cache in front of a database, where each instance rebuilding its own copy is acceptable because the database is still the source of truth.</li>
      <li><strong>Must be shared:</strong> rate limits that exist for fairness or cost, output cache you rely on for consistency, counters used for correctness, and any job that should run exactly once.</li>
    </ul>
    <p>
      A stateless service is not a service with no state. It is a service whose important state does not privately belong to the web process. That state still exists - it just lives in shared infrastructure. Moving it there is the subject of the next article in this series.
    </p>

    <h2>Frequently asked questions</h2>
    <div className={styles.faq}>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Does the built-in ASP.NET Core rate limiter work across multiple instances?</strong>
        <p className={styles.faqA}>Each instance enforces the limit in its own process memory, with no distributed store behind it. That is fine when the limit protects each instance's own capacity - the total throughput simply scales with the number of instances. It is a problem when the limit is meant to be global, like a per-caller quota or protection for a shared resource, because one caller's requests are spread across instances and the effective limit multiplies. For a global limit, use a distributed rate limiter backed by Redis, or enforce it at the gateway or ingress layer.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Is output caching shared across servers?</strong>
        <p className={styles.faqA}>Not by default. The default output cache store is in-process, so each server has a separate cache that is lost when the process restarts. To share cached responses across instances, use the Redis-backed store via AddStackExchangeRedisOutputCache.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Is IMemoryCache shared between instances?</strong>
        <p className={styles.faqA}>No. IMemoryCache lives inside the web process, so each instance keeps its own cache. For read-through caching over a database this is usually acceptable, since the database remains the source of truth. For shared cache state, use a distributed cache or HybridCache with a distributed backing store.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Do I need sticky sessions for a Web API?</strong>
        <p className={styles.faqA}>Usually not. A token-based, stateless API does not need stickiness. You only need it if you keep per-user state in process memory, and even then the Microsoft docs recommend externalizing that state to a distributed store instead, because sticky sessions hurt scalability and complicate deployments.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Are singletons and background services per instance?</strong>
        <p className={styles.faqA}>Yes. A singleton is one object per process, not per deployment, so two instances have two separate singletons. A BackgroundService starts inside every app host, so every instance runs its own copy of the worker. Both are safe on one process and need care once you scale out.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>My API uses cookie auth - why do users get logged out after scaling?</strong>
        <p className={styles.faqA}>Because each instance generates its own Data Protection key ring by default, and cookies encrypted by one instance cannot be decrypted by another. If your API issues auth cookies or antiforgery tokens, persist a shared key ring (file share, Blob, Redis, or database) and set the same application name on every instance.</p>
      </div>
    </div>

    <h2>Official resources</h2>
    <ul>
      <li><a href="https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit" target="_blank" rel="noopener noreferrer" className={styles.link}>Rate limiting middleware in ASP.NET Core - Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/aspnet/core/performance/caching/output" target="_blank" rel="noopener noreferrer" className={styles.link}>Output caching middleware in ASP.NET Core - Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/aspnet/core/performance/caching/memory" target="_blank" rel="noopener noreferrer" className={styles.link}>Cache in-memory in ASP.NET Core - Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/aspnet/core/fundamentals/dependency-injection" target="_blank" rel="noopener noreferrer" className={styles.link}>Dependency injection in ASP.NET Core (service lifetimes) - Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/aspnet/core/fundamentals/host/hosted-services" target="_blank" rel="noopener noreferrer" className={styles.link}>Background tasks with hosted services in ASP.NET Core - Microsoft Learn</a></li>
    </ul>

  </div>
);

export default AspNetCoreStatefulAssumptions;
