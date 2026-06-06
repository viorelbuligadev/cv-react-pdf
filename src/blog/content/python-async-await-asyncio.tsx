import React from 'react';
import styles from './Article.module.css';

const PythonAsyncAwaitAsyncio = () => (
  <div className={styles.article}>

    <div className={styles.quickAnswer}>
      <strong>Quick answer:</strong> <code>async</code>/<code>await</code> in Python lets you write concurrent code on a single thread. The event loop runs multiple coroutines by switching between them whenever one is waiting - for example, for a network response. Use it for I/O-bound work like HTTP calls, database queries, and file reads. For CPU-heavy computation, use <code>multiprocessing</code> instead.
    </div>

    <p className={styles.lead}>
      I first reached for asyncio when building a FastAPI service that had to call three external APIs before it could respond. Running them one after another was too slow. With <code>async</code>/<code>await</code>, I fired all three at once on a single thread - no thread pool, no locks. This article explains how Python's asyncio model works and when it is the right tool.
    </p>

    <h2>What is asyncio and why does Python need it?</h2>
    <p>
      <strong>asyncio</strong> is Python's built-in library for writing <strong>asynchronous I/O</strong> code. It was introduced as a provisional module in <strong>Python 3.4</strong> and is used as a foundation for multiple Python asynchronous frameworks that provide high-performance network and web servers, database connection libraries, and distributed task queues.
    </p>
    <p>
      Python normally runs one instruction at a time. When your code makes a network request, the thread just waits - doing nothing - until the server replies. asyncio solves this by letting a coroutine <em>yield control</em> while it waits, so other coroutines can run in the meantime.
    </p>
    <p>
      The result is <strong>concurrency without threads</strong>. One thread drives many tasks by cooperatively switching between them at each <code>await</code> point.
    </p>

    <h2>What does async def mean and how does await work?</h2>
    <p>
      Declaring a function with <code>async def</code> makes it a <strong>coroutine function</strong>. Calling it does <em>not</em> run it - it returns a <strong>coroutine object</strong>. You must either <code>await</code> it inside another coroutine, or schedule it with <code>asyncio.run()</code> or <code>asyncio.create_task()</code>.
    </p>
    <pre className={styles.code}>{`import asyncio

async def fetch_data():
    print("Start fetch")
    await asyncio.sleep(1)   # simulates a network call
    print("Fetch done")
    return {"status": "ok"}

async def main():
    result = await fetch_data()
    print(result)

asyncio.run(main())`}</pre>
    <p>
      The <code>await</code> keyword does two things at once:
    </p>
    <ul>
      <li>It pauses the current coroutine until the awaited value is ready.</li>
      <li>It hands control back to the event loop, which can run other tasks while this one waits.</li>
    </ul>
    <p>
      <code>asyncio.run()</code> was added in <strong>Python 3.7</strong>. It creates a new event loop, runs the top-level coroutine, and closes the loop when it finishes. For most programs, this is the only place you touch the event loop directly.
    </p>

    <h2>What is the event loop?</h2>
    <p>
      The <strong>event loop</strong> is the core of every asyncio application. It keeps a queue of tasks and callbacks, runs them one at a time, and tracks which ones are waiting for I/O. When a task hits an <code>await</code>, the event loop suspends it and picks up the next ready task.
    </p>
    <p>
      This is <strong>cooperative multitasking</strong> - each coroutine voluntarily yields at <code>await</code> points. If a coroutine runs a long CPU calculation with no <code>await</code> in sight, it blocks the entire loop until it finishes. No other task can run during that time.
    </p>

    <h2>How do you run multiple tasks at the same time?</h2>
    <p>
      Awaiting coroutines one by one is still sequential. To run them <em>concurrently</em>, schedule them as <strong>Tasks</strong> first.
    </p>
    <p>
      <strong>Option 1 - <code>asyncio.create_task()</code></strong>: schedules a coroutine and returns a Task object immediately. The coroutine starts running in the background right away.
    </p>
    <pre className={styles.code}>{`async def main():
    task1 = asyncio.create_task(fetch_data())
    task2 = asyncio.create_task(fetch_data())
    result1 = await task1
    result2 = await task2
    # Both fetch_data() calls ran concurrently`}</pre>
    <p>
      <strong>Option 2 - <code>asyncio.gather()</code></strong>: runs multiple awaitables concurrently and collects their results in a list.
    </p>
    <pre className={styles.code}>{`async def main():
    results = await asyncio.gather(
        fetch_data(),
        fetch_data(),
        fetch_data(),
    )
    print(results)  # [{"status": "ok"}, {"status": "ok"}, {"status": "ok"}]`}</pre>
    <p>
      Note: if one coroutine passed to <code>gather()</code> raises an exception, the others are <strong>not</strong> automatically cancelled - they keep running in the background.
    </p>

    <h2>What is asyncio.TaskGroup and when should you use it?</h2>
    <p>
      <strong><code>asyncio.TaskGroup</code></strong> was added in <strong>Python 3.11</strong> as the preferred modern way to manage groups of tasks. It is an async context manager that:
    </p>
    <ul>
      <li>Waits for all tasks in the group to finish before the <code>async with</code> block exits.</li>
      <li>If <em>any</em> task raises an exception, it <strong>cancels all remaining tasks</strong> in the group, then raises an <code>ExceptionGroup</code>.</li>
    </ul>
    <pre className={styles.code}>{`async def main():
    async with asyncio.TaskGroup() as tg:
        task1 = tg.create_task(fetch_data())
        task2 = tg.create_task(fetch_data())
    # Reaches here only when both tasks are done - or both are cancelled`}</pre>
    <p>
      This pattern - cancelling sibling tasks when one fails - is called <strong>structured concurrency</strong> and makes error handling much safer than <code>asyncio.gather()</code>.
    </p>

    <h2>What is the difference between asyncio, threading, and multiprocessing?</h2>
    <p>
      Python has three main tools for running work concurrently or in parallel. They solve different problems:
    </p>
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Approach</th>
            <th>Best for</th>
            <th>Threads / processes</th>
            <th>Bypasses GIL</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>asyncio</code></td>
            <td>I/O-bound work (HTTP, DB, files)</td>
            <td>1 thread (event loop)</td>
            <td>No - not needed</td>
          </tr>
          <tr>
            <td><code>threading</code></td>
            <td>I/O-bound work with blocking libraries</td>
            <td>Multiple threads</td>
            <td>No</td>
          </tr>
          <tr>
            <td><code>multiprocessing</code></td>
            <td>CPU-bound work (math, image processing)</td>
            <td>Multiple processes</td>
            <td>Yes</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      The <strong>GIL (Global Interpreter Lock)</strong> prevents two Python threads from executing Python bytecode at the same time. For I/O-bound work this does not matter much - threads mostly wait anyway. For CPU-bound work, the GIL is a real bottleneck. <code>multiprocessing</code> bypasses it by running separate Python processes.
    </p>
    <p>
      asyncio avoids GIL issues entirely because it runs on a single thread - there is no thread contention to worry about.
    </p>

    <div className={styles.callout}>
      <strong>Common mistake:</strong> Calling a blocking function - like <code>requests.get()</code> or <code>time.sleep()</code> - inside an async function blocks the entire event loop. Use async-native libraries (like <code>httpx</code> or <code>aiohttp</code>), or wrap blocking calls with <code>asyncio.to_thread()</code> to run them in a thread pool without stalling other tasks.
    </div>

    <h2>When should you use asyncio?</h2>
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Use asyncio when...</th>
            <th>Do not use asyncio when...</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>You make many HTTP requests (APIs, web scraping)</td>
            <td>Your bottleneck is CPU (data processing, ML training)</td>
          </tr>
          <tr>
            <td>You query databases and want to interleave queries</td>
            <td>Your libraries are not async-compatible and blocking calls dominate</td>
          </tr>
          <tr>
            <td>You build a web server or API (FastAPI, aiohttp)</td>
            <td>Your task list is short and sequential code is simple enough</td>
          </tr>
          <tr>
            <td>You need to handle many connections with low overhead</td>
            <td>You need true parallelism across CPU cores</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2>Frequently asked questions</h2>
    <div className={styles.faq}>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>When was asyncio added to Python?</strong>
        <p className={styles.faqA}>asyncio was introduced as a provisional module in Python 3.4. The async and await keywords (PEP 492) were added in Python 3.5. asyncio.run() arrived in Python 3.7, and asyncio.TaskGroup was added in Python 3.11.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Is asyncio faster than threading for I/O-bound work?</strong>
        <p className={styles.faqA}>For I/O-bound work, asyncio is typically more efficient because it uses a single thread with no context-switching overhead. However, asyncio cannot run truly blocking code without freezing the event loop, while threads handle that naturally.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What happens if I forget to await a coroutine?</strong>
        <p className={styles.faqA}>Python emits a RuntimeWarning: coroutine 'your_function' was never awaited. The coroutine never runs. Always await coroutines or schedule them as tasks with asyncio.create_task().</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Can I use asyncio with synchronous blocking code?</strong>
        <p className={styles.faqA}>Yes. Use asyncio.to_thread() to run a blocking synchronous function in a separate thread without blocking the event loop. This lets you mix async code with libraries that do not support async natively.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What is the difference between asyncio.gather() and asyncio.TaskGroup?</strong>
        <p className={styles.faqA}>gather() runs awaitables concurrently but does not cancel remaining tasks when one fails. TaskGroup (Python 3.11+) cancels all remaining tasks in the group if any one of them raises an exception - making it safer and the preferred modern approach.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Does asyncio bypass the GIL?</strong>
        <p className={styles.faqA}>No. asyncio runs on a single thread so the GIL is not a concern - there is no contention between threads. To bypass the GIL for CPU-bound work, use multiprocessing instead.</p>
      </div>
    </div>

    <h2>Official resources</h2>
    <ul>
      <li><a href="https://docs.python.org/3/library/asyncio.html" target="_blank" rel="noopener noreferrer" className={styles.link}>asyncio - Asynchronous I/O - Python 3 docs</a></li>
      <li><a href="https://docs.python.org/3/library/asyncio-task.html" target="_blank" rel="noopener noreferrer" className={styles.link}>Coroutines and tasks - Python 3 docs</a></li>
      <li><a href="https://docs.python.org/3/howto/a-conceptual-overview-of-asyncio.html" target="_blank" rel="noopener noreferrer" className={styles.link}>A Conceptual Overview of asyncio - Python 3 docs</a></li>
      <li><a href="https://peps.python.org/pep-0492/" target="_blank" rel="noopener noreferrer" className={styles.link}>PEP 492 - Coroutines with async and await syntax</a></li>
      <li><a href="https://docs.python.org/3/library/asyncio-dev.html" target="_blank" rel="noopener noreferrer" className={styles.link}>Developing with asyncio - Python 3 docs</a></li>
    </ul>

  </div>
);

export default PythonAsyncAwaitAsyncio;
