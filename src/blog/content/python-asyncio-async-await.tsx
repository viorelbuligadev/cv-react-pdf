import React from 'react';
import styles from './Article.module.css';

const PythonAsyncioAsyncAwait = () => (
  <div className={styles.article}>

    <div className={styles.quickAnswer}>
      <strong>Quick answer:</strong> <code>async</code> and <code>await</code> let you write non-blocking Python code that can pause at I/O operations and let other tasks run in the meantime. The <code>asyncio</code> library manages an <strong>event loop</strong> that keeps a single thread busy with useful work instead of sitting idle waiting for a file, database, or network response.
    </div>

    <p className={styles.lead}>
      I used to reach for threads whenever I needed to handle multiple network calls at once. Then I started using <code>asyncio</code> and it changed how I think about concurrency. One thread, one event loop, no locking headaches - and the code reads almost like regular sequential Python. This article explains how async/await works in Python, what the event loop actually does, and when you should - and should not - use asyncio.
    </p>

    <h2>What is asyncio and why does it exist?</h2>
    <p>
      <strong>asyncio</strong> is a Python standard library module that provides infrastructure for writing concurrent code using the <code>async</code>/<code>await</code> syntax. It was designed in <a href="https://peps.python.org/pep-3156/" target="_blank" rel="noopener noreferrer" className={styles.link}>PEP 3156</a>, and the <code>async</code>/<code>await</code> keywords were introduced in <strong>Python 3.5</strong> via <a href="https://peps.python.org/pep-0492/" target="_blank" rel="noopener noreferrer" className={styles.link}>PEP 492</a>. Both keywords became reserved keywords in Python 3.7.
    </p>
    <p>
      The problem asyncio solves is <strong>I/O-bound waiting</strong>. When your program makes an HTTP request or reads from a database, the CPU sits idle for milliseconds to seconds waiting for a response. With traditional sequential code, nothing else can happen during that wait. asyncio lets Python switch to another task during the wait, so the thread stays productive.
    </p>
    <p>
      The result is that you can handle many concurrent I/O operations in a single thread without the complexity of managing multiple threads or processes.
    </p>

    <h2>What is a coroutine in Python?</h2>
    <p>
      A <strong>coroutine</strong> is a function defined with <code>async def</code>. Unlike a regular function, calling a coroutine does not execute its body immediately - it returns a coroutine object. You need to <em>await</em> it (or schedule it as a task) to actually run it.
    </p>
    <pre className={styles.code}>{`import asyncio

async def greet(name: str) -> str:
    await asyncio.sleep(1)  # non-blocking pause - simulates I/O
    return f"Hello, {name}"

# Calling greet() returns a coroutine object, nothing runs yet
coro = greet("Viorel")

# asyncio.run() starts the event loop and runs the coroutine to completion
result = asyncio.run(greet("Viorel"))
print(result)  # Hello, Viorel`}</pre>
    <p>
      The <code>await</code> keyword can only be used inside an <code>async def</code> function. It pauses the current coroutine and hands control back to the event loop, which can then run other tasks. Execution resumes when the awaited operation completes.
    </p>
    <p>
      <code>asyncio.run()</code> is the standard entry point, available since <strong>Python 3.7</strong>. It creates a new event loop, runs the given coroutine until it finishes, and then closes the loop.
    </p>

    <h2>How does the event loop work?</h2>
    <p>
      The <strong>event loop</strong> is the engine at the center of asyncio. It runs in a single thread - typically the main thread - and executes all callbacks and tasks in that thread. The loop keeps a queue of tasks that are ready to run and cycles through them.
    </p>
    <p>
      Here is what happens step by step when a coroutine hits an <code>await</code>:
    </p>
    <ol>
      <li>The current coroutine is <strong>suspended</strong> at the <code>await</code> expression.</li>
      <li>The event loop picks the next task that is ready to run.</li>
      <li>When the awaited I/O operation finishes, the original coroutine is marked as ready.</li>
      <li>The event loop resumes the coroutine from where it paused.</li>
    </ol>
    <p>
      This is cooperative multitasking - a coroutine runs until it voluntarily yields control with <code>await</code>. No other coroutine can interrupt it in the middle.
    </p>
    <pre className={styles.code}>{`import asyncio

async def fetch_data(label: str, delay: float) -> str:
    print(f"{label}: starting")
    await asyncio.sleep(delay)  # yields control to the event loop
    print(f"{label}: done after {delay}s")
    return label

async def main():
    # Create two tasks - they are scheduled but not yet awaited
    task_a = asyncio.create_task(fetch_data("A", 2))
    task_b = asyncio.create_task(fetch_data("B", 1))
    # Now await both - B finishes first even though A started first
    result_a = await task_a
    result_b = await task_b
    print(result_a, result_b)

asyncio.run(main())
# A: starting
# B: starting
# B: done after 1s
# A: done after 2s
# A B`}</pre>
    <p>
      Both tasks start immediately because <code>asyncio.create_task()</code> schedules them on the event loop right away. The total time is about 2 seconds, not 3, because both tasks run concurrently.
    </p>

    <h2>How do you run multiple coroutines at the same time?</h2>
    <p>
      You have two main tools for concurrency in asyncio:
    </p>
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Tool</th>
            <th>What it does</th>
            <th>Use it when</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>asyncio.create_task()</code></td>
            <td>Wraps a coroutine in a Task and schedules it immediately. Returns the Task object.</td>
            <td>You want to start a task and continue other work before collecting the result.</td>
          </tr>
          <tr>
            <td><code>asyncio.gather(*coros)</code></td>
            <td>Runs multiple awaitables concurrently. Returns a list of results in the same order as the inputs.</td>
            <td>You have a fixed list of coroutines and want all results at once.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <pre className={styles.code}>{`import asyncio

async def fetch(url: str) -> str:
    await asyncio.sleep(0.5)  # simulates a network request
    return f"response from {url}"

async def main():
    urls = ["https://api.example.com/a", "https://api.example.com/b", "https://api.example.com/c"]
    # All three run concurrently; results come back in the same order as urls
    results = await asyncio.gather(*[fetch(url) for url in urls])
    for r in results:
        print(r)

asyncio.run(main())`}</pre>
    <p>
      By default, if any coroutine in <code>gather()</code> raises an exception, the exception propagates immediately to the caller. Set <code>return_exceptions=True</code> to collect exceptions as regular return values instead of letting them abort the whole gather.
    </p>

    <h2>What is the difference between asyncio, threading, and multiprocessing?</h2>
    <p>
      Python gives you three ways to do concurrent work. The right choice depends on what your code is waiting for:
    </p>
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Approach</th>
            <th>Concurrency model</th>
            <th>Best for</th>
            <th>Not ideal for</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>asyncio</strong></td>
            <td>Single thread, cooperative switching at <code>await</code></td>
            <td>Many concurrent I/O operations (HTTP, DB, file reads)</td>
            <td>CPU-heavy computation</td>
          </tr>
          <tr>
            <td><strong>threading</strong></td>
            <td>Multiple OS threads, GIL limits true parallelism</td>
            <td>Blocking I/O libraries that are not async-native</td>
            <td>CPU-bound work (GIL prevents parallel CPU use)</td>
          </tr>
          <tr>
            <td><strong>multiprocessing</strong></td>
            <td>Multiple OS processes, each with its own GIL</td>
            <td>CPU-bound computation (image processing, ML inference)</td>
            <td>High-concurrency I/O (process overhead is too high)</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      asyncio is a great fit for network services, web scrapers, API clients, and anything that waits for external systems. If a function performs a CPU-intensive calculation, it will block the event loop and delay all other tasks - for that, you need a separate process.
    </p>
    <p>
      If you must call a blocking (non-async) library from asyncio code, use <code>asyncio.to_thread()</code> (Python 3.9+) to run it in a thread pool without blocking the event loop:
    </p>
    <pre className={styles.code}>{`import asyncio

def blocking_read(filename: str) -> str:
    with open(filename) as f:
        return f.read()

async def main():
    # Runs blocking_read in a thread pool, event loop stays free
    content = await asyncio.to_thread(blocking_read, "data.txt")
    print(content)

asyncio.run(main())`}</pre>

    <div className={styles.callout}>
      <strong>Important:</strong> asyncio is not magic parallelism. It is <em>concurrency</em> in a single thread. The speed gain comes from using wait time productively, not from running CPU work in parallel. For CPU-bound tasks, use <code>concurrent.futures.ProcessPoolExecutor</code> with <code>loop.run_in_executor()</code>, or the <code>multiprocessing</code> module directly.
    </div>

    <h2>When should you use asyncio?</h2>
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Use asyncio when...</th>
            <th>Consider alternatives when...</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>You make many concurrent HTTP or API calls</td><td>Your bottleneck is CPU computation, not waiting</td></tr>
          <tr><td>You write a web server or API (FastAPI, aiohttp, Starlette all use asyncio)</td><td>You rely on a library that has no async version and cannot be run in a thread</td></tr>
          <tr><td>You connect to a database asynchronously (asyncpg, aiomysql)</td><td>Your script is a simple one-off sequential script with no I/O concurrency needed</td></tr>
          <tr><td>You build a chat server, message queue consumer, or WebSocket handler</td><td>Your team is not familiar with cooperative multitasking and async debugging</td></tr>
        </tbody>
      </table>
    </div>
    <p>
      A practical signal: if you have code like <em>"call A, wait, call B, wait, call C, wait"</em> and A, B, C do not depend on each other, asyncio can make them run at the same time instead of one after another.
    </p>

    <h2>Frequently asked questions</h2>
    <div className={styles.faq}>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>When was async/await introduced in Python?</strong>
        <p className={styles.faqA}>The async and await syntax was introduced in Python 3.5 via PEP 492. Both keywords became fully reserved keywords in Python 3.7. The asyncio module itself was added in Python 3.4 via PEP 3156, initially using generator-based coroutines before the async/await syntax existed.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What does await do exactly?</strong>
        <p className={styles.faqA}>await pauses the current coroutine and gives control back to the event loop. The event loop can then run other tasks. When the awaited operation finishes, the event loop resumes the coroutine from the exact point it paused.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What is the difference between asyncio and threading?</strong>
        <p className={styles.faqA}>asyncio uses a single thread with cooperative switching - coroutines yield control at await points. threading uses multiple OS threads with preemptive switching. asyncio has lower overhead and avoids race conditions, but requires async-compatible libraries. Both are limited by the GIL for CPU-bound work.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Can asyncio speed up CPU-bound code?</strong>
        <p className={styles.faqA}>No. asyncio only helps with I/O-bound work where the bottleneck is waiting for external operations. CPU-bound work blocks the event loop and delays all other tasks. For CPU-bound concurrency, use multiprocessing or concurrent.futures.ProcessPoolExecutor.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What is asyncio.gather()?</strong>
        <p className={styles.faqA}>asyncio.gather() runs multiple awaitables concurrently and returns a list of their results in the same order as the inputs. If any coroutine raises an exception and return_exceptions is False (the default), the exception propagates immediately to the caller.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What is asyncio.run()?</strong>
        <p className={styles.faqA}>asyncio.run() is the standard entry point for async programs, available since Python 3.7. It creates a new event loop, runs the given top-level coroutine to completion, closes the loop, and returns the result. You should call it once at the top level of your script, not inside a running event loop.</p>
      </div>
    </div>

    <h2>Official resources</h2>
    <ul>
      <li><a href="https://docs.python.org/3/library/asyncio.html" target="_blank" rel="noopener noreferrer" className={styles.link}>asyncio - Asynchronous I/O - Python Docs</a></li>
      <li><a href="https://docs.python.org/3/library/asyncio-task.html" target="_blank" rel="noopener noreferrer" className={styles.link}>Coroutines and Tasks - Python Docs</a></li>
      <li><a href="https://docs.python.org/3/howto/a-conceptual-overview-of-asyncio.html" target="_blank" rel="noopener noreferrer" className={styles.link}>A Conceptual Overview of asyncio - Python Docs</a></li>
      <li><a href="https://peps.python.org/pep-0492/" target="_blank" rel="noopener noreferrer" className={styles.link}>PEP 492 - Coroutines with async and await syntax - Python.org</a></li>
      <li><a href="https://peps.python.org/pep-3156/" target="_blank" rel="noopener noreferrer" className={styles.link}>PEP 3156 - Asynchronous IO Support Rebooted: the asyncio Module - Python.org</a></li>
      <li><a href="https://docs.python.org/3/library/asyncio-dev.html" target="_blank" rel="noopener noreferrer" className={styles.link}>Developing with asyncio - Python Docs</a></li>
    </ul>

  </div>
);

export default PythonAsyncioAsyncAwait;
