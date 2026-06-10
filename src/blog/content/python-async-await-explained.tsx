import React from 'react';
import styles from './Article.module.css';

const PythonAsyncAwaitExplained = () => (
  <div className={styles.article}>

    <div className={styles.quickAnswer}>
      <strong>Quick answer:</strong> <code>async</code> and <code>await</code> let you write Python code that pauses at I/O operations - like network requests or file reads - without blocking the rest of your program. The <code>asyncio</code> library manages an <strong>event loop</strong> that runs these paused tasks concurrently on a single thread.
    </div>

    <p className={styles.lead}>
      When I started building APIs with FastAPI, I kept seeing <code>async def</code> everywhere and copy-pasting it without really understanding what it did. Then I ran into a bug where my "concurrent" code was still running one task at a time. That pushed me to actually read the official docs. This article explains what async/await does in Python, how the event loop works, and when to use it - based on the Python 3.14 documentation.
    </p>

    <h2>What is async/await in Python?</h2>
    <p>
      <code>async</code> and <code>await</code> are keywords introduced in <strong>Python 3.5</strong> via <a href="https://peps.python.org/pep-0492/" target="_blank" rel="noopener noreferrer" className={styles.link}>PEP 492</a>. They let you write <strong>asynchronous code</strong> in a style that looks like regular sequential code.
    </p>
    <p>
      A function defined with <code>async def</code> becomes a <strong>coroutine function</strong>. Calling it does not run the function - it returns a <strong>coroutine object</strong>. The coroutine only runs when it is scheduled and awaited.
    </p>
    <pre className={styles.code}>{`import asyncio

async def greet(name: str) -> str:
    await asyncio.sleep(1)   # pause here for 1 second without blocking
    return f"Hello, {name}!"

# Calling the function does NOT run it - it creates a coroutine object
coro = greet("World")        # nothing printed yet

# asyncio.run() schedules and runs the coroutine
result = asyncio.run(greet("World"))
print(result)                # Hello, World!`}</pre>
    <p>
      The <code>await</code> keyword can only be used inside an <code>async def</code> function. Using it elsewhere is a <code>SyntaxError</code>. When Python hits an <code>await</code>, the current coroutine pauses and hands control back to the event loop, which can then run other ready tasks.
    </p>

    <h2>What is the asyncio event loop?</h2>
    <p>
      The <strong>event loop</strong> is the core of every asyncio application. According to the official documentation, it runs asynchronous tasks and callbacks, performs network I/O operations, and runs subprocesses.
    </p>
    <p>
      You can think of it as a scheduler that keeps a list of tasks to run. When a task hits an <code>await</code> and pauses, the loop picks up the next ready task. When the I/O completes, the paused task is put back on the ready list.
    </p>
    <p>
      <code>asyncio.run()</code> is the standard entry point. It creates a new event loop, runs your coroutine until it finishes, and then closes the loop. You should call it once at the top level of your program.
    </p>
    <pre className={styles.code}>{`import asyncio

async def main():
    print("start")
    await asyncio.sleep(0)   # yield control to the event loop
    print("end")

asyncio.run(main())
# start
# end`}</pre>

    <h2>What are coroutines, tasks, and futures?</h2>
    <p>
      The official documentation defines three main types of <strong>awaitable objects</strong> - objects you can use with <code>await</code>:
    </p>
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Awaitable</th>
            <th>What it is</th>
            <th>How you create it</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Coroutine</strong></td>
            <td>The result of calling an <code>async def</code> function</td>
            <td><code>my_coroutine()</code></td>
          </tr>
          <tr>
            <td><strong>Task</strong></td>
            <td>A coroutine wrapped and scheduled to run on the event loop</td>
            <td><code>asyncio.create_task(coro)</code></td>
          </tr>
          <tr>
            <td><strong>Future</strong></td>
            <td>A low-level object representing an eventual result</td>
            <td>Usually returned by library internals</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      The key difference between a coroutine and a task is timing. A bare coroutine only runs when you await it directly. A task is scheduled immediately when you call <code>asyncio.create_task()</code>, so it can start running before you explicitly await it. The official documentation recommends using <code>asyncio.create_task()</code> as the primary way to create tasks.
    </p>
    <pre className={styles.code}>{`import asyncio

async def step(name: str) -> None:
    print(f"{name}: started")
    await asyncio.sleep(1)
    print(f"{name}: done")

async def main():
    # create_task schedules both immediately
    task_a = asyncio.create_task(step("A"))
    task_b = asyncio.create_task(step("B"))

    await task_a
    await task_b

asyncio.run(main())
# A: started
# B: started     <- B starts before A finishes
# A: done
# B: done`}</pre>
    <p>
      Both tasks start right away because <code>create_task()</code> registers them on the event loop. The total wait time is ~1 second, not 2 seconds.
    </p>

    <h2>How does asyncio.gather() work?</h2>
    <p>
      <code>asyncio.gather()</code> runs multiple awaitable objects concurrently. If you pass coroutines, it automatically wraps them in tasks. When all awaitables finish, it returns their results in the same order you passed them.
    </p>
    <pre className={styles.code}>{`import asyncio

async def fetch(label: str, delay: float) -> str:
    await asyncio.sleep(delay)    # simulates a network request
    return f"{label} result"

async def main():
    results = await asyncio.gather(
        fetch("users", 1.0),
        fetch("posts", 0.5),
        fetch("comments", 0.8),
    )
    print(results)
    # ['users result', 'posts result', 'comments result']
    # total time ~1.0s, not 2.3s

asyncio.run(main())`}</pre>
    <p>
      The results list preserves the input order regardless of which coroutine finishes first.
    </p>

    <h2>What is asyncio.to_thread() used for?</h2>
    <p>
      Not all code is async-aware. Some libraries - like standard file I/O or certain database drivers - are blocking by nature. Running them directly inside a coroutine blocks the entire event loop, pausing all other tasks.
    </p>
    <p>
      <code>asyncio.to_thread()</code> (added in Python 3.9) runs a blocking function in a separate thread without blocking the event loop:
    </p>
    <pre className={styles.code}>{`import asyncio
import time

def blocking_read(path: str) -> str:
    time.sleep(2)             # blocks - cannot use await here
    return f"contents of {path}"

async def main():
    # run the blocking function in a thread pool
    result = await asyncio.to_thread(blocking_read, "/data/file.txt")
    print(result)

asyncio.run(main())`}</pre>
    <p>
      For CPU-bound work (heavy computation), the official documentation recommends running it in a <strong>process pool</strong> using <code>loop.run_in_executor()</code> with a <code>ProcessPoolExecutor</code>, because threads in Python share the GIL and do not speed up CPU-bound code.
    </p>

    <div className={styles.callout}>
      <strong>Important:</strong> Never call blocking or CPU-intensive code directly inside a coroutine. The official docs state: "Blocking (CPU-bound) code should not be called directly. For example, if a function performs a CPU-intensive calculation for 1 second, all concurrent asyncio Tasks and IO operations would be delayed by 1 second." Use <code>asyncio.to_thread()</code> for blocking I/O and a process pool for CPU work.
    </div>

    <h2>When should you use async/await?</h2>
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr><th>Use async/await when...</th><th>Stick with regular code when...</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>You make multiple HTTP requests and can run them in parallel</td>
            <td>Your code is CPU-bound (image processing, number crunching)</td>
          </tr>
          <tr>
            <td>You are building a web server or API (FastAPI, aiohttp)</td>
            <td>Your script is simple and sequential with no I/O bottleneck</td>
          </tr>
          <tr>
            <td>You query a database with an async driver (asyncpg, aiomysql)</td>
            <td>You use libraries that are not async-aware and wrapping them adds complexity</td>
          </tr>
          <tr>
            <td>You handle many concurrent WebSocket or TCP connections</td>
            <td>You need true parallelism - use multiprocessing instead</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      The official asyncio documentation sums it up: asyncio is often a perfect fit for <strong>I/O-bound and high-level structured network code</strong>. If your program spends most of its time waiting for the network, a database, or a file system, async/await is the right tool.
    </p>

    <h2>Frequently asked questions</h2>
    <div className={styles.faq}>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>When was async/await introduced in Python?</strong>
        <p className={styles.faqA}>The async and await keywords were introduced in Python 3.5 through PEP 492. The asyncio module itself was first added in Python 3.4 as a provisional library, and asyncio.run() was added in Python 3.7.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Does calling an async function run it?</strong>
        <p className={styles.faqA}>No. Calling an async def function returns a coroutine object but does not execute the body. You must schedule and await the coroutine - for example with asyncio.run() at the top level, or with await inside another coroutine.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What is the difference between asyncio.create_task() and await?</strong>
        <p className={styles.faqA}>await runs a coroutine to completion before moving on. asyncio.create_task() schedules a coroutine as a Task on the event loop immediately, so it can run in the background while other code runs. You can await the task later to get its result.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Can I use async/await with regular (synchronous) functions?</strong>
        <p className={styles.faqA}>The await keyword can only be used inside an async def function. If you need to run a blocking synchronous function without blocking the event loop, use asyncio.to_thread() to run it in a thread pool.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Does async/await use multiple threads?</strong>
        <p className={styles.faqA}>No. By default asyncio runs on a single thread. Tasks run concurrently by taking turns on the event loop - one task pauses at an await, and the loop runs another. For true parallelism across CPU cores, use the multiprocessing module or run_in_executor with a ProcessPoolExecutor.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Is async/await faster than threading for I/O-bound code?</strong>
        <p className={styles.faqA}>It can be, especially at high concurrency. asyncio tasks are lighter than OS threads because they do not require context switches managed by the operating system. The official documentation positions asyncio as well-suited for high-performance network and web servers. Performance always depends on the specific workload and libraries used.</p>
      </div>
    </div>

    <h2>Official resources</h2>
    <ul>
      <li><a href="https://docs.python.org/3/library/asyncio.html" target="_blank" rel="noopener noreferrer" className={styles.link}>asyncio - Asynchronous I/O - Python 3 documentation</a></li>
      <li><a href="https://docs.python.org/3/library/asyncio-task.html" target="_blank" rel="noopener noreferrer" className={styles.link}>Coroutines and Tasks - Python 3 documentation</a></li>
      <li><a href="https://docs.python.org/3/howto/a-conceptual-overview-of-asyncio.html" target="_blank" rel="noopener noreferrer" className={styles.link}>A Conceptual Overview of asyncio - Python 3 documentation</a></li>
      <li><a href="https://docs.python.org/3/library/asyncio-dev.html" target="_blank" rel="noopener noreferrer" className={styles.link}>Developing with asyncio - Python 3 documentation</a></li>
      <li><a href="https://peps.python.org/pep-0492/" target="_blank" rel="noopener noreferrer" className={styles.link}>PEP 492 - Coroutines with async and await syntax</a></li>
    </ul>

  </div>
);

export default PythonAsyncAwaitExplained;
