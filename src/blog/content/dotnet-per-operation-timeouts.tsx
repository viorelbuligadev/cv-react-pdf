import React from 'react';
import styles from './Article.module.css';

const DotnetPerOperationTimeouts = () => (
  <div className={styles.article}>

    <div className={styles.quickAnswer}>
      <strong>Quick answer:</strong> <code>HttpClient.Timeout</code> is a property of the infrastructure - it applies the same budget to every call. A per-operation timeout is a property of the use case - you set it per call using <code>CancellationTokenSource</code> and combine it with the caller's token via <code>CreateLinkedTokenSource</code>. The linked token fires when <strong>either</strong> the time budget expires <strong>or</strong> the caller cancels, whichever comes first.
    </div>

    <p className={styles.lead}>
      Your API's latency is only as good as your slowest dependency - unless you draw a timed boundary around it. I keep coming back to the same pattern in .NET services that call external APIs: move the timeout from the HTTP client to the operation, combine it with the caller's token, and always know who cancelled. Here is how it works and why it matters.
    </p>

    <img
      src="/images/timeoutboundary.png"
      alt="Per-operation timeout boundary illustration"
      style={{ width: '100%', borderRadius: '12px', margin: '1.5rem 0' }}
    />

    <h2>What is wrong with HttpClient.Timeout?</h2>
    <p>
      Nothing is technically wrong with <code>HttpClient.Timeout</code> - it is just the wrong place to put the budget. It is a property of the infrastructure. It applies the same limit to every single call made through that client, regardless of context.
    </p>
    <p>
      Consider a service that uses the same <code>HttpClient</code> for two operations: getting a shipping quote and exporting a report. A shipping quote should fail fast - 3 seconds is generous. A report export might legitimately take 2 minutes. Setting one <code>HttpClient.Timeout</code> means you either kill the export too early or wait too long on a hung quote endpoint.
    </p>
    <pre className={styles.code}>{`// This applies the same timeout to every call - too blunt
services.AddHttpClient<IGatewayClient, GatewayClient>(client =>
{
    client.BaseAddress = new Uri(gatewayUrl);
    client.Timeout = TimeSpan.FromSeconds(3);  // kills the report export
});`}</pre>
    <p>
      The fix: set <code>HttpClient.Timeout</code> to <code>Timeout.InfiniteTimeSpan</code> and move the timeout to the operation level, where it belongs.
    </p>

    <h2>How do you set a per-operation timeout?</h2>
    <p>
      Each call gets its own <code>CancellationTokenSource</code> with a time budget. You then combine it with the caller's cancellation token - typically <code>HttpContext.RequestAborted</code> in ASP.NET Core - using <code>CreateLinkedTokenSource</code>. The resulting token is passed down to the gateway call.
    </p>
    <pre className={styles.code}>{`// HttpClient has no deadline of its own
services.AddHttpClient<IGatewayClient, GatewayClient>(client =>
{
    client.BaseAddress = new Uri(options.BaseUrl);
    client.Timeout = Timeout.InfiniteTimeSpan;  // boundaries live at the call site
});

// In your service / use case handler
public async Task<ShippingQuote> GetQuoteAsync(
    QuoteRequest request,
    CancellationToken callerToken)   // HttpContext.RequestAborted in ASP.NET Core
{
    using var timeoutCts = new CancellationTokenSource(
        TimeSpan.FromMilliseconds(_options.TimeoutMilliseconds));

    using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(
        callerToken,
        timeoutCts.Token);

    return await _gateway.GetQuoteAsync(request, linkedCts.Token);
}`}</pre>
    <p>
      Each operation now carries its own budget. The shipping quote handler gets 3 seconds; the report export handler gets 2 minutes. Same HTTP client, different boundaries - exactly what the business logic requires.
    </p>

    <h2>How does CreateLinkedTokenSource work?</h2>
    <p>
      <code>CancellationTokenSource.CreateLinkedTokenSource</code> creates a new token that is cancelled when <em>any</em> of the source tokens cancel. It is a logical OR.
    </p>
    <pre className={styles.code}>{`using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(3));
using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(
    callerToken,     // fires if the HTTP client disconnects
    timeoutCts.Token // fires after 3 seconds
);

// linkedCts.Token is cancelled when EITHER fires - whichever comes first
await _gateway.GetQuoteAsync(request, linkedCts.Token);`}</pre>
    <p>
      This means the operation stops at the tightest active boundary. If the caller disconnects at 1 second and the timeout is 3 seconds, the operation stops at 1 second. If the caller is still connected but the gateway hangs, the operation stops at 3 seconds.
    </p>
    <div className={styles.callout}>
      <strong>Boundaries compose hierarchically.</strong> Incoming request carries a deadline. The gateway call adds a tighter budget. A retry attempt inside the gateway call inherits both. Each layer respects the tightest active boundary without needing to know about the others.
    </div>

    <h2>How do you tell who cancelled?</h2>
    <p>
      When <code>OperationCanceledException</code> is thrown, you do not always know which token fired. But you need to know - the correct response depends on the cause.
    </p>
    <ul>
      <li><strong>Timeout fired:</strong> the gateway was too slow. Return <code>504 Gateway Timeout</code> or a fallback value.</li>
      <li><strong>Caller cancelled:</strong> the client closed the connection. Nobody is listening - skip the response, just log and stop.</li>
    </ul>
    <pre className={styles.code}>{`try
{
    var quote = await _gateway.GetQuoteAsync(request, linkedCts.Token);
    return Results.Ok(quote);
}
catch (OperationCanceledException)
{
    if (timeoutCts.IsCancellationRequested && !callerToken.IsCancellationRequested)
    {
        // Our budget expired - the gateway was too slow
        _logger.LogWarning("Gateway timeout after {Ms}ms", _options.TimeoutMilliseconds);
        return Results.StatusCode(504);
    }

    // Caller closed the connection - no point sending a response
    _logger.LogInformation("Request cancelled by caller.");
    return Results.Empty;
}`}</pre>
    <p>
      Checking <code>timeoutCts.IsCancellationRequested</code> and the caller's token separately gives you a clean fork. No guessing, no ambiguous catch blocks.
    </p>

    <h2>Why must you dispose the linked CancellationTokenSource?</h2>
    <p>
      <code>CreateLinkedTokenSource</code> registers callbacks on the parent tokens. Those callbacks keep the linked <code>CTS</code> alive in memory. If you do not dispose it, the callbacks are never removed - and on a service handling thousands of requests against a long-lived <code>HttpContext</code> token, that is a memory leak on every request.
    </p>
    <pre className={styles.code}>{`// WRONG - linked CTS never disposed, callbacks accumulate
var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(callerToken, timeoutCts.Token);
await _gateway.GetQuoteAsync(request, linkedCts.Token);

// CORRECT - using statement disposes both CTS instances after the call
using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(3));
using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(callerToken, timeoutCts.Token);
await _gateway.GetQuoteAsync(request, linkedCts.Token);`}</pre>
    <div className={styles.callout}>
      <strong>Rule:</strong> every <code>CancellationTokenSource</code> you create must be disposed. The <code>using</code> keyword is the safest way to guarantee this - it disposes even when an exception is thrown.
    </div>

    <h2>What happens without any timeout boundary?</h2>
    <p>
      Without a boundary, a hung dependency holds your connections hostage indefinitely. Thread-pool threads block waiting for a response that never comes. Under load, the blocked threads pile up faster than they are released. Eventually, the thread pool is exhausted and every incoming request queues behind the hung ones.
    </p>
    <p>
      One slow external gateway can take down your entire service - not because of high traffic, but because of missing boundaries. Fail fast beats waiting forever.
    </p>

    <h2>Frequently asked questions</h2>
    <div className={styles.faq}>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Why set HttpClient.Timeout to Timeout.InfiniteTimeSpan?</strong>
        <p className={styles.faqA}>Because the timeout belongs at the operation level, not the infrastructure level. Setting HttpClient.Timeout applies the same budget to every call. Moving the timeout to a per-call CancellationTokenSource lets each operation define its own budget based on what the business logic actually requires.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What does CreateLinkedTokenSource actually do?</strong>
        <p className={styles.faqA}>It creates a new CancellationTokenSource that is cancelled when any of the source tokens cancel - a logical OR. The resulting token stops the operation at whichever boundary fires first: the caller disconnecting, the time budget expiring, or any other token in the chain.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>How do I know if the timeout or the caller cancelled?</strong>
        <p className={styles.faqA}>Check timeoutCts.IsCancellationRequested and the caller's token separately after catching OperationCanceledException. If timeoutCts fired but the caller's token did not, it was your budget. If the caller's token fired, the client closed the connection and no response is needed.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What happens if I don't dispose the linked CancellationTokenSource?</strong>
        <p className={styles.faqA}>CreateLinkedTokenSource registers callbacks on the parent tokens. Without disposal those callbacks are never removed, keeping the linked CTS alive in memory. On a high-throughput service this becomes a memory leak on every request.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Should I use raw CancellationTokenSource or Polly?</strong>
        <p className={styles.faqA}>For simple timeout-only scenarios, raw CancellationTokenSource is fine. When you need retry, circuit breaking, and timeout composing together, Polly is the better choice. Either way, understanding the raw mechanism helps you configure and debug the abstraction correctly.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Where does the caller's CancellationToken come from in ASP.NET Core?</strong>
        <p className={styles.faqA}>It is HttpContext.RequestAborted, which ASP.NET Core injects automatically when you declare a CancellationToken parameter in a minimal API handler or controller action. It fires when the client closes the connection or the request times out at the server level.</p>
      </div>
    </div>

    <h2>Official resources</h2>
    <ul>
      <li><a href="https://learn.microsoft.com/en-us/dotnet/api/system.threading.cancellationtokensource.createlinkedtokensource" target="_blank" rel="noopener noreferrer" className={styles.link}>CancellationTokenSource.CreateLinkedTokenSource - Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/dotnet/fundamentals/networking/http/httpclient-guidelines" target="_blank" rel="noopener noreferrer" className={styles.link}>HttpClient guidelines - Microsoft Learn</a></li>
      <li><a href="https://www.pollydocs.org/strategies/timeout" target="_blank" rel="noopener noreferrer" className={styles.link}>Polly Timeout Strategy - Polly Docs</a></li>
      <li><a href="https://learn.microsoft.com/en-us/dotnet/api/system.threading.cancellationtoken" target="_blank" rel="noopener noreferrer" className={styles.link}>CancellationToken - Microsoft Learn</a></li>
    </ul>

  </div>
);

export default DotnetPerOperationTimeouts;
