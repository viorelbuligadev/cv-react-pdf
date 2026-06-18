import React from 'react';
import styles from './Article.module.css';

const DotnetTaskAsyncAwait = () => (
  <div className={styles.article}>

    <div className={styles.quickAnswer}>
      <strong>Quick answer:</strong> A <strong>Task</strong> in .NET is not a thread - it is a promise that some work will complete in the future. <strong>await</strong> suspends the method and hands control back to the caller without blocking anything. Most async bugs come from three habits: blocking with <code>.Result</code> or <code>.Wait()</code>, using <code>async void</code>, and forgetting to pass <code>CancellationToken</code> down the chain.
    </div>

    <p className={styles.lead}>
      I have been writing .NET for years and I still remember the first time I introduced a deadlock in production. A perfectly reasonable-looking line - <code>GetDataAsync().Result</code> - froze an entire ASP.NET request for thirty seconds until the load balancer killed it. I had no idea why. This article is everything I wish someone had explained to me before that incident.
    </p>
    <p>
      <code>Task</code> is one of those APIs that looks simple on the surface - you slap <code>await</code> in front of it and move on. But underneath sits the Task Parallel Library, a compiler-generated state machine, the thread pool, and a handful of behaviours that, when misunderstood, produce bugs that are genuinely difficult to reproduce.
    </p>

    <h2>What is a Task, actually?</h2>
    <p>
      A <code>Task</code> is a promise that some work will complete in the future. That is it. It is not a thread. It does not necessarily run on a different thread at all. It is an object that tracks an operation and carries three things: a <strong>status</strong>, an optional <strong>result</strong>, and an optional <strong>exception</strong>.
    </p>
    <p>There are two flavours:</p>
    <ul>
      <li><code>Task</code> - represents work that completes but produces no value (the async equivalent of <code>void</code>).</li>
      <li><code>{'Task<TResult>'}</code> - represents work that completes and produces a value.</li>
    </ul>
    <pre className={styles.code}>{`Task            save      = SaveToDatabaseAsync();
Task<decimal>   price     = CalculatePriceAsync();`}</pre>
    <p>
      The mental model that clicked for me: a <code>Task</code> is a <em>handle to an operation</em>, completely decoupled from what actually performs it. That could be the thread pool, an I/O completion port, a timer, or nothing at all - a task that is already finished before you even look at it.
    </p>

    <h2>How do you create a Task?</h2>

    <h3>From an async method</h3>
    <p>
      This is the case you will hit 95% of the time. Mark a method <code>async</code>, return <code>Task</code> or <code>{'Task<T>'}</code>, and the compiler builds a state machine that drives the method and completes the task when it returns. You do not create the task yourself - the compiler does.
    </p>
    <pre className={styles.code}>{`public async Task<Customer> GetCustomerAsync(int id)
{
    var row = await _db.QuerySingleAsync(id);   // no thread blocked during I/O
    return Map(row);
}`}</pre>
    <p>
      While the database call is in flight, no thread is sitting there waiting. The method suspends, the thread goes back to the pool, and the runtime picks up where it left off when the I/O completes.
    </p>

    <h3>Task.Run - for CPU-bound work only</h3>
    <p>
      When you have heavy computation that would block the current thread - image processing, cryptography, a tight loop - use <code>Task.Run</code> to push it to the thread pool.
    </p>
    <pre className={styles.code}>{`var result = await Task.Run(() => ProcessImage(rawBytes));`}</pre>
    <div className={styles.callout}>
      <strong>Common mistake:</strong> wrapping an already-async I/O call inside <code>Task.Run</code>. That burns a thread-pool thread just to sit there waiting for I/O that never needed a thread in the first place. <code>Task.Run</code> is for CPU-bound work - not for making synchronous code look async.
    </div>

    <h3>Pre-completed tasks</h3>
    <p>
      Sometimes you know the answer immediately - a cache hit, a validation short-circuit. Return a completed task instead of going async:
    </p>
    <pre className={styles.code}>{`Task.CompletedTask              // done, no value
Task.FromResult(42)             // done, holds 42
Task.FromException(new IOException())
Task.FromCanceled(token)`}</pre>
    <p>
      Awaiting a <code>Task.FromResult</code> is essentially free - the compiler sees it is already complete and continues synchronously without suspension.
    </p>

    <h2>How does await actually work?</h2>
    <p>
      This is the part that trips people up. <code>await</code> does not mean "wait here." It means "suspend this method, return control to my caller, and schedule the rest of this method to run when the task finishes."
    </p>
    <p>The compiler rewrites your async method into a state machine. Each <code>await</code> is a checkpoint. When you hit an await on an incomplete task:</p>
    <ul>
      <li>The rest of the method is captured as a continuation.</li>
      <li>Control goes back to whoever called this method.</li>
      <li>When the task finishes, the continuation is scheduled to run - by default on the captured <code>SynchronizationContext</code>, if there is one.</li>
    </ul>
    <p>
      If the task is <em>already complete</em> when you await it, there is no suspension - execution continues straight through. This is why awaiting cached results is fast.
    </p>

    <h2>What are the Task lifecycle states?</h2>
    <p>
      A task exposes its state through the <code>Status</code> property (<code>TaskStatus</code>). It starts somewhere around <code>WaitingForActivation</code> and ends in one of three terminal states:
    </p>
    <ul>
      <li><strong>RanToCompletion</strong> - finished successfully.</li>
      <li><strong>Canceled</strong> - cancellation was requested and the task honoured it.</li>
      <li><strong>Faulted</strong> - an unhandled exception occurred inside the task.</li>
    </ul>
    <div className={styles.callout}>
      <strong>Gotcha:</strong> <code>IsCompleted</code> is <code>true</code> for <em>all three</em> terminal states - including faulted and canceled. If you need to confirm the task actually succeeded, use <code>IsCompletedSuccessfully</code>.
    </div>

    <h2>How does exception handling work?</h2>
    <p>
      A faulted task stores its exception inside an <code>AggregateException</code>. How that exception reaches you depends on how you consume the task:
    </p>
    <pre className={styles.code}>{`// await unwraps the AggregateException and rethrows the actual exception
try
{
    await DoWorkAsync();
}
catch (IOException ex)   // you get the real type, clean and simple
{
    // handle it
}

// .Wait() / .Result throw the AggregateException wrapper - messy
try
{
    DoWorkAsync().Wait();
}
catch (AggregateException ax)
{
    foreach (var inner in ax.InnerExceptions) { /* dig through it */ }
}`}</pre>
    <p>
      Always use <code>await</code>. The exception handling alone is reason enough.
    </p>

    <h2>How do you run multiple Tasks at the same time?</h2>
    <p>
      This is where async really pays off. If you have three independent HTTP calls, there is no reason to run them one after another.
    </p>
    <pre className={styles.code}>{`// Sequential - total time = A + B + C
var a = await GetOrderAsync(1);
var b = await GetOrderAsync(2);
var c = await GetOrderAsync(3);

// Concurrent - total time = max(A, B, C)
var tasks = new[] { GetOrderAsync(1), GetOrderAsync(2), GetOrderAsync(3) };
var results = await Task.WhenAll(tasks);`}</pre>
    <p>
      I have seen codebases where every async call was sequential even though the operations had no dependency on each other. Switching to <code>WhenAll</code> cut response times in half with a two-line change.
    </p>
    <p>
      <code>Task.WhenAny</code> is useful for timeouts - race the real operation against a <code>Task.Delay</code>:
    </p>
    <pre className={styles.code}>{`var work  = FetchDataAsync();
var delay = Task.Delay(TimeSpan.FromSeconds(5));

if (await Task.WhenAny(work, delay) == delay)
    throw new TimeoutException();

var result = await work;`}</pre>

    <h2>How does cancellation work?</h2>
    <p>
      .NET uses cooperative cancellation. A <code>CancellationToken</code> is just a signal - it is up to each operation to check for it and stop. Nothing is cancelled automatically.
    </p>
    <pre className={styles.code}>{`public async Task ProcessAsync(CancellationToken ct)
{
    foreach (var item in items)
    {
        ct.ThrowIfCancellationRequested();
        await HandleAsync(item, ct);   // pass it down every time
    }
}

using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
await ProcessAsync(cts.Token);`}</pre>
    <p>
      The most common mistake: accepting a <code>CancellationToken</code> at the top-level method but never passing it to any of the inner calls. The token does nothing if it never reaches the operation that is actually doing the work.
    </p>

    <h2>What are the pitfalls that actually hurt in production?</h2>

    <h3>Blocking with .Result or .Wait()</h3>
    <p>
      This was my production deadlock. In any environment with a <code>SynchronizationContext</code> - classic ASP.NET, WPF, WinForms - calling <code>.Result</code> or <code>.Wait()</code> creates a deadlock. The calling thread blocks waiting for the task. The task's continuation needs that same thread to resume. Neither can proceed.
    </p>
    <pre className={styles.code}>{`// Deadlock waiting to happen in a UI / classic ASP.NET context
var data = GetDataAsync().Result;   // don't do this`}</pre>
    <p>The fix is always the same: <code>await</code> it.</p>

    <h3>async void</h3>
    <p>
      Never use <code>async void</code> outside of event handlers. An <code>async void</code> method returns nothing, so there is no task to observe. If it throws, the exception crashes the process. If it finishes, you have no way of knowing.
    </p>
    <pre className={styles.code}>{`public async void DoSomething()      // bad - fire, forget, and pray
public async Task DoSomethingAsync() // good`}</pre>

    <h3>Starting a task and not awaiting it</h3>
    <pre className={styles.code}>{`SendEmailAsync();          // compiles, runs, exceptions disappear silently
await SendEmailAsync();    // correct`}</pre>
    <p>
      The compiler does warn you about this now, but older codebases are full of fire-and-forget calls that swallow exceptions silently.
    </p>

    <h3>ConfigureAwait(false) in library code</h3>
    <p>
      By default, <code>await</code> captures the current <code>SynchronizationContext</code> and resumes the continuation on it. In application code that is usually what you want. In <em>library</em> code you do not care which context you resume on - and capturing it adds overhead and increases deadlock risk for callers.
    </p>
    <pre className={styles.code}>{`var response = await _http.GetAsync(url).ConfigureAwait(false);`}</pre>
    <p>Add <code>ConfigureAwait(false)</code> to every await in library code. It is a small habit that prevents a whole category of bugs for the people using your library.</p>

    <h2>When should you reach for ValueTask?</h2>
    <p>
      Every <code>Task</code> is a heap allocation. On most code paths that is completely fine. But on genuinely hot paths - a method called millions of times per second, where the result is usually available synchronously - that allocation adds up.
    </p>
    <pre className={styles.code}>{`public ValueTask<Customer> GetAsync(int id)
{
    if (_cache.TryGetValue(id, out var c))
        return new ValueTask<Customer>(c);    // synchronous, zero allocation

    return new ValueTask<Customer>(LoadFromDbAsync(id));
}`}</pre>
    <div className={styles.callout}>
      <strong>Rule:</strong> use <code>Task</code> by default. Only reach for <code>{'ValueTask<T>'}</code> when profiling shows allocation pressure from a specific hot path. And when you do use it - await it exactly once, do not store it, do not block on it.
    </div>

    <h2>Quick reference</h2>
    <ul>
      <li>Always <code>await</code> - never <code>.Result</code> or <code>.Wait()</code>.</li>
      <li>Return <code>Task</code>, not <code>async void</code> (except event handlers).</li>
      <li><code>Task.Run</code> is for CPU-bound work only - not for wrapping I/O.</li>
      <li>Use <code>Task.WhenAll</code> for independent operations that can run in parallel.</li>
      <li>Pass <code>CancellationToken</code> through every async call in the chain.</li>
      <li>Add <code>ConfigureAwait(false)</code> in library code.</li>
      <li>Observe every task you start - unobserved exceptions are bugs.</li>
    </ul>

    <h2>Frequently asked questions</h2>
    <div className={styles.faq}>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What is the difference between Task and Thread in .NET?</strong>
        <p className={styles.faqA}>A Thread is an OS-level execution unit. A Task is a higher-level abstraction representing an operation that may or may not use a thread. Many tasks - especially I/O-bound ones - complete without ever blocking a thread.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>When should I use Task.Run?</strong>
        <p className={styles.faqA}>Use Task.Run only for CPU-bound work you want to offload from the current thread. Do not use it to wrap I/O-bound async calls - that wastes a thread-pool thread waiting for I/O that did not need one.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What causes a deadlock in async .NET code?</strong>
        <p className={styles.faqA}>Calling .Result or .Wait() on a Task in an environment with a SynchronizationContext (WPF, WinForms, classic ASP.NET). The calling thread blocks waiting for the Task, but the Task's continuation needs that same thread to run - so neither can proceed.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What is the difference between await and .Result?</strong>
        <p className={styles.faqA}>await suspends the method without blocking a thread and unwraps the AggregateException, rethrowing the actual exception type. .Result blocks the calling thread and throws the full AggregateException wrapper.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What is ConfigureAwait(false) and when should I use it?</strong>
        <p className={styles.faqA}>ConfigureAwait(false) tells the runtime not to capture the current SynchronizationContext when resuming after an await. Use it in library code to avoid unnecessary context switching and reduce deadlock risk for callers.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What is ValueTask and when should I use it?</strong>
        <p className={styles.faqA}>ValueTask is a struct alternative to Task that avoids a heap allocation when the result is already available synchronously. Use it on hot paths where the operation frequently completes synchronously. Always await it exactly once.</p>
      </div>
    </div>

    <h2>Official resources</h2>
    <ul>
      <li><a href="https://learn.microsoft.com/en-us/dotnet/standard/parallel-programming/task-based-asynchronous-programming" target="_blank" rel="noopener noreferrer" className={styles.link}>Task-based Asynchronous Programming - Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/" target="_blank" rel="noopener noreferrer" className={styles.link}>Asynchronous programming in C# - Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/dotnet/api/system.threading.tasks.task" target="_blank" rel="noopener noreferrer" className={styles.link}>Task Class - Microsoft Learn</a></li>
    </ul>

  </div>
);

export default DotnetTaskAsyncAwait;
