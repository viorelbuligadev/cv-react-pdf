import React from 'react';
import styles from './Article.module.css';

const Ca2012ValueTaskCorrectly = () => (
  <div className={styles.article}>

    <div className={styles.quickAnswer}>
      <strong>Quick answer:</strong> CA2012 is a <strong>.NET Roslyn analyser rule</strong> (Reliability category) that fires when you misuse a <strong>ValueTask</strong> - by awaiting it more than once, storing it and using it later, accessing <code>.Result</code> before it completes, or discarding it entirely. The fix is almost always the same: <strong>await it once, directly, at the call site</strong>. If you need to await the result multiple times, call <code>.AsTask()</code> first and use the returned <code>Task</code>.
    </div>

    <p className={styles.lead}>
      CA2012 is a <strong>.NET Roslyn analyser rule</strong> in the Reliability category. It analyses your code at compile time and flags any call site where a <code>ValueTask</code> is consumed in a way that breaks its one-shot contract. <code>ValueTask</code> was introduced as a performance optimisation - a way to avoid heap allocations on hot paths where an async operation frequently completes synchronously. But that optimisation comes with strict rules. Break them and you get exceptions, data corruption, or subtle performance regressions that are hard to reproduce.
    </p>
    <p>
      This article walks through every misuse pattern CA2012 detects, explains why each one is dangerous, and shows the correct alternative.
    </p>

    <h2>Why does ValueTask exist?</h2>
    <p>
      Every <code>Task</code> or <code>{'Task<T>'}</code> is a reference type - it lives on the heap. For most code that is fine. But imagine an interface method like <code>{'IValueTaskSource<T>'}</code> that is implemented by a high-throughput cache or a socket read loop. If 99% of calls hit the cache synchronously, you are allocating a <code>Task</code> object for every call just to return an already-known value.
    </p>
    <p>
      <code>{'ValueTask<T>'}</code> is a struct that can hold <em>either</em> a synchronous result or a pointer to an underlying <code>Task</code>. In the synchronous case, no heap object is created. The trade-off is that <code>ValueTask</code> is a one-shot value - it can only be consumed once and only in specific ways. <code>Task</code> is a shared object; <code>ValueTask</code> is a receipt you hand in once and throw away.
    </p>

    <h2>The ValueTask consumption contract</h2>
    <p>
      Microsoft documents three rules for consuming a <code>ValueTask</code>. Violating any of them is undefined behaviour:
    </p>
    <ul>
      <li><strong>Await it at most once.</strong> The underlying value source may be recycled from a pool after the first await. A second await could read stale or recycled data.</li>
      <li><strong>Do not call <code>.GetAwaiter().GetResult()</code> (or <code>.Result</code>) unless you know it has already completed.</strong> Blocking on an incomplete <code>ValueTask</code> is not supported and may deadlock or throw.</li>
      <li><strong>Do not discard it without observing it.</strong> Unlike a <code>Task</code>, a discarded <code>ValueTask</code> cannot be observed through the finaliser - you lose any exception silently.</li>
    </ul>
    <div className={styles.callout}>
      <strong>Mental model:</strong> treat a <code>ValueTask</code> like a single-use voucher. Once redeemed (awaited), it is gone. You can convert it to a reusable <code>Task</code> with <code>.AsTask()</code> before the first await if you need to use it multiple times.
    </div>

    <h2>What CA2012 catches</h2>
    <p>
      CA2012 (<em>Use ValueTasks correctly</em>) is in the <strong>Reliability</strong> category and is enabled by default as a suggestion from .NET 10 onward. It detects the following patterns at the call site - that is, where the <code>ValueTask</code> is returned from a method and immediately misused.
    </p>

    <h3>Pattern 1: Awaiting the same ValueTask twice</h3>
    <p>This is the most common violation. A <code>ValueTask</code> is stored in a local variable and then awaited more than once.</p>
    <pre className={styles.code}>{`// ❌ CA2012 violation - double await
public async Task UseValueTaskIncorrectlyAsync()
{
    ValueTask<int> task = GetNumberAsync();

    int first  = await task;   // first await - ok
    int second = await task;   // second await - undefined behaviour
}

// ✅ Correct - call the method twice
public async Task UseValueTaskCorrectlyAsync()
{
    int first  = await GetNumberAsync();
    int second = await GetNumberAsync();
}`}</pre>
    <p>
      The reason the second await is unsafe: <code>GetNumberAsync</code> might be backed by a pooled <code>IValueTaskSource</code>. After the first await, the pool may have already reclaimed and reused that source object. The second await reads whatever data happens to be in the recycled slot.
    </p>

    <h3>Pattern 2: Storing a ValueTask and awaiting it later</h3>
    <p>Storing a <code>ValueTask</code> in a field or returning it while also keeping a reference is equally dangerous - the underlying source may have been recycled by the time the stored value is awaited.</p>
    <pre className={styles.code}>{`// ❌ CA2012 violation - stored in a field, used later
private ValueTask<int> _pending;

public void Start()
{
    _pending = GetNumberAsync();   // stored, not immediately awaited
}

public async Task<int> GetResultAsync()
{
    return await _pending;         // awaited much later - unsafe
}

// ✅ Correct - convert to Task if you need to store it
private Task<int> _pending;

public void Start()
{
    _pending = GetNumberAsync().AsTask();   // Task is safe to store and await multiple times
}

public async Task<int> GetResultAsync()
{
    return await _pending;
}`}</pre>

    <h3>Pattern 3: Accessing .Result before completion is confirmed</h3>
    <p>
      Unlike <code>Task</code>, which you can safely poll with <code>IsCompleted</code> and then read <code>.Result</code> synchronously in a fast path, doing the same on a <code>ValueTask</code> is only safe if you have obtained the <code>ValueTask</code> and confirmed <code>IsCompleted</code> on the <em>same instance</em> without any intervening suspension points.
    </p>
    <pre className={styles.code}>{`// ❌ Risky - reading .Result without confirming completion first
ValueTask<int> vt = GetNumberAsync();
int value = vt.GetAwaiter().GetResult();   // may block or throw

// ✅ Correct - check IsCompleted first (synchronous fast path)
ValueTask<int> vt = GetNumberAsync();
if (vt.IsCompleted)
{
    int value = vt.GetAwaiter().GetResult();  // safe: already done
}
else
{
    int value = await vt;   // still awaited at most once
}`}</pre>

    <h3>Pattern 4: Discarding a ValueTask without observing it</h3>
    <p>
      Calling a method that returns a <code>ValueTask</code> and ignoring the return value means you will never see any exception the operation throws. With <code>Task</code> this is also bad practice, but the runtime can surface the exception via the <code>TaskScheduler.UnobservedTaskException</code> event. With a discarded <code>ValueTask</code> there is no such safety net.
    </p>
    <pre className={styles.code}>{`// ❌ CA2012 violation - ValueTask discarded
GetNumberAsync();   // return value ignored entirely

// ✅ Correct - await it
await GetNumberAsync();

// ✅ Also acceptable - if you genuinely want fire-and-forget,
// convert to Task and discard that (you still lose the exception,
// but at least the Task-based safety net may catch it)
_ = GetNumberAsync().AsTask();`}</pre>

    <h2>The AsTask() escape hatch</h2>
    <p>
      If you have a legitimate reason to await the same result multiple times - for example, you are fanning out the same result to multiple consumers - call <code>.AsTask()</code> immediately after obtaining the <code>ValueTask</code>. This converts it into a regular <code>Task</code>, which is safe to share and await as many times as you like.
    </p>
    <pre className={styles.code}>{`ValueTask<int> numberValueTask = GetNumberAsync();

// Convert once, then use the Task freely
Task<int> numberTask = numberValueTask.AsTask();

int first  = await numberTask;   // fine
int second = await numberTask;   // also fine - Task is reusable`}</pre>
    <div className={styles.callout}>
      <strong>Note:</strong> Only call <code>.AsTask()</code> once per <code>ValueTask</code> instance. The same rule applies - you get one conversion. After that, use the returned <code>Task</code> however you like.
    </div>

    <h2>How to enable and configure CA2012</h2>
    <p>From .NET 10 onward, CA2012 is enabled as a suggestion by default. In earlier projects you may need to enable it explicitly.</p>

    <h3>Raise severity to a warning or error</h3>
    <pre className={styles.code}>{`# .editorconfig
[*.{cs,vb}]
dotnet_diagnostic.CA2012.severity = warning   # or error`}</pre>

    <h3>Enable the full reliability rule set</h3>
    <pre className={styles.code}>{`# .editorconfig
dotnet_analyzer_diagnostic.category-Reliability.severity = warning`}</pre>

    <h2>When to suppress CA2012</h2>
    <p>
      Suppression is only appropriate when you both <em>wrote</em> the method being called and <em>know for certain</em> that its <code>ValueTask</code> always wraps a plain <code>Task</code> (never a pooled <code>IValueTaskSource</code>). In that case the double-await or store-and-await pattern is technically safe, though still bad practice.
    </p>
    <pre className={styles.code}>{`#pragma warning disable CA2012
// Suppress for a single line only when you own the callee
// and you know it never uses IValueTaskSource pooling
ValueTask<int> vt = MyKnownSafeMethod();
int a = await vt;
int b = await vt;
#pragma warning restore CA2012`}</pre>
    <p>
      In the vast majority of cases, just fix the code. The suppression exists as an escape hatch, not a habit.
    </p>

    <h2>Summary of violations and fixes</h2>
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Violation</th>
            <th>Risk</th>
            <th>Fix</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Await the same <code>ValueTask</code> twice</td>
            <td>Undefined behaviour, data corruption</td>
            <td>Call the method twice, or convert with <code>.AsTask()</code></td>
          </tr>
          <tr>
            <td>Store <code>ValueTask</code> in a field</td>
            <td>Source may be recycled before second use</td>
            <td>Store <code>.AsTask()</code> instead</td>
          </tr>
          <tr>
            <td>Call <code>.GetResult()</code> without confirming completion</td>
            <td>Deadlock or exception</td>
            <td>Check <code>.IsCompleted</code> first, or just <code>await</code></td>
          </tr>
          <tr>
            <td>Discard without observing</td>
            <td>Silent exception loss</td>
            <td>Always <code>await</code>, or at minimum <code>_ = vt.AsTask()</code></td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2>Frequently asked questions</h2>
    <div className={styles.faq}>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Is CA2012 enabled by default?</strong>
        <p className={styles.faqA}>From .NET 10 it is enabled as a suggestion. In earlier SDK versions it may not be active. You can enable it explicitly in .editorconfig by setting dotnet_diagnostic.CA2012.severity to warning or error.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Why can I await a Task multiple times but not a ValueTask?</strong>
        <p className={styles.faqA}>Task is a class (reference type) and its completed state and result are stored on the heap indefinitely. ValueTask is a struct that may wrap a pooled IValueTaskSource - after the first await, the pool can reclaim and reuse that source object. A second await could read stale recycled data.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>When should I use AsTask() instead of just calling the method again?</strong>
        <p className={styles.faqA}>Use AsTask() when calling the method a second time would repeat work you do not want repeated - for example, if the method performs I/O or modifies state. If the operation is idempotent (a pure cache lookup, for instance), calling it twice is cleaner and avoids the Task allocation.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Does CA2012 catch misuse of ValueTask (non-generic) too?</strong>
        <p className={styles.faqA}>Yes. The rule applies to both ValueTask and ValueTask&lt;T&gt;. Both have the same one-shot consumption contract.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Can I suppress CA2012 at the project level?</strong>
        <p className={styles.faqA}>Yes, but you should not do this globally. CA2012 catches real bugs. If you find yourself suppressing it broadly, it is a sign that ValueTask is being misused throughout the codebase and the underlying code should be fixed instead.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Should I always prefer ValueTask over Task?</strong>
        <p className={styles.faqA}>No. Task is the right default. ValueTask is an optimisation for hot paths where the operation frequently completes synchronously and allocation pressure is measurable. Use Task unless profiling shows a real benefit from switching.</p>
      </div>
    </div>

    <h2>Official resources</h2>
    <ul>
      <li><a href="https://learn.microsoft.com/en-us/dotnet/fundamentals/code-analysis/quality-rules/ca2012" target="_blank" rel="noopener noreferrer" className={styles.link}>CA2012: Use ValueTasks correctly - Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/dotnet/api/system.threading.tasks.valuetask" target="_blank" rel="noopener noreferrer" className={styles.link}>ValueTask Struct - Microsoft Learn</a></li>
      <li><a href="https://devblogs.microsoft.com/dotnet/understanding-the-whys-whats-and-whens-of-valuetask/" target="_blank" rel="noopener noreferrer" className={styles.link}>Understanding the Whys, Whats, and Whens of ValueTask - .NET Blog</a></li>
    </ul>

  </div>
);

export default Ca2012ValueTaskCorrectly;
