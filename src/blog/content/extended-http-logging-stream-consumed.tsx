import React from 'react';
import styles from './Article.module.css';

const ExtendedHttpLoggingStreamConsumed = () => (
  <div className={styles.article}>

    <div className={styles.quickAnswer}>
      <strong>Quick answer:</strong> On <code>Microsoft.Extensions.Http.Diagnostics</code> 9.1 and later (including 10.x), enabling <code>AddExtendedHttpClientLogging</code> with <code>LogBody = true</code> can leave the response body unreadable for your own code - the logging handler reads the content stream, and the caller then hits "The stream was already consumed." In my case, switching from <code>GetAsync</code> to <code>SendAsync</code> with <code>HttpCompletionOption.ResponseHeadersRead</code> fixed it. This is a field note, not a confirmed library bug - I could not reproduce it in isolation.
    </div>

    <p className={styles.lead}>
      This one cost me an afternoon, so I am writing it down in case it saves you one. A .NET 10 service of mine started throwing when reading HTTP responses, and the trigger turned out to be the extended HTTP logging handler - not my code, and not the API I was calling. I want to be upfront: I have a reliable workaround but not a clean reproduction, so treat this as an experience report, not a verified defect.
    </p>

    <img
      src="/images/httpstream.png"
      alt="An HTTP response body stream consumed by the logging handler before the caller can read it"
      style={{ width: '100%', borderRadius: '12px', margin: '1.5rem 0' }}
    />

    <h2>What are the symptoms?</h2>
    <p>
      A call that had worked for months started failing at the point where I read the response body:
    </p>
    <pre className={styles.code}>{`System.InvalidOperationException:
  The stream was already consumed. It cannot be read again.`}</pre>
    <p>
      The throw is not in my deserialisation code - it comes from trying to read <code>HttpResponseMessage.Content</code> a second time. The first read is the diagnostics handler reading the body to log it. By the time <code>ReadFromJsonAsync</code> (or <code>ReadAsStringAsync</code>) runs, the content stream has already been consumed.
    </p>

    <h2>What environment triggers it?</h2>
    <ul>
      <li>.NET 10, <code>HttpClient</code> resolved through <code>IHttpClientFactory</code>.</li>
      <li><code>Microsoft.Extensions.Http.Diagnostics</code> <strong>9.1 or later</strong>, including 10.x. I did not see it on 9.0 or below.</li>
      <li>The extended logging handler registered with body logging on.</li>
      <li>Standard calls - <code>GetAsync</code>, <code>PostAsJsonAsync</code> - which default to <code>HttpCompletionOption.ResponseContentRead</code>, i.e. "complete after reading the entire response including the content".</li>
    </ul>

    <h2>The configuration that sets it off</h2>
    <p>
      The handler only reads the body when you ask it to. <code>LogBody</code> is the switch; the other options bound how much it reads and which content types it treats as text.
    </p>
    <pre className={styles.code}>{`services.AddHttpClient("orders-api")
    .AddExtendedHttpClientLogging(o =>
    {
        o.LogBody = true;                         // <- reads the body
        o.BodySizeLimit = 32 * 1024;              // max bytes read for logging
        o.BodyReadTimeout = TimeSpan.FromSeconds(5);
        o.ResponseBodyContentTypes.Add("application/json"); // treated as text
    });`}</pre>
    <p>
      Set <code>LogBody</code> back to <code>false</code> and the problem disappears - which is the clearest sign the body logging is what consumes the stream. But losing response-body logging is usually not the trade you want.
    </p>

    <h2>The workaround</h2>
    <p>
      What worked for me was to stop asking <code>HttpClient</code> to read the whole response before handing it back. <code>GetAsync</code> and <code>PostAsJsonAsync</code> use <code>ResponseContentRead</code>. Dropping to <code>SendAsync</code> with <code>ResponseHeadersRead</code> - "complete as soon as a response is available and headers are read; the content is not read yet" - left the stream readable for both the handler and my code.
    </p>
    <p><strong>Before - throws:</strong></p>
    <pre className={styles.code}>{`// Defaults to HttpCompletionOption.ResponseContentRead
var response = await client.GetAsync("/orders", ct);
response.EnsureSuccessStatusCode();

var orders = await response.Content
    .ReadFromJsonAsync<List<Order>>(ct);   // stream already consumed`}</pre>
    <p><strong>After - works:</strong></p>
    <pre className={styles.code}>{`using var request =
    new HttpRequestMessage(HttpMethod.Get, "/orders");

var response = await client.SendAsync(
    request, HttpCompletionOption.ResponseHeadersRead, ct);
response.EnsureSuccessStatusCode();

var orders = await response.Content
    .ReadFromJsonAsync<List<Order>>(ct);   // reads fine`}</pre>
    <div className={styles.callout}>
      <strong>One caveat that comes with <code>ResponseHeadersRead</code>.</strong> The docs warn that with this option, <code>HttpClient.Timeout</code> "applies only up to where the headers end and the content starts". Reading the content is no longer covered by that timeout, so guard the body read yourself - a <code>CancellationToken</code> from a <code>CancellationTokenSource</code> with its own deadline.
    </div>

    <h2>Why is a minimal repro so hard?</h2>
    <p>
      Here is the honest part: I built a standalone project with the same package version, the same logging configuration, and the same workaround - and it would <em>not</em> reproduce the failure reliably. So something in the real pipeline matters that a two-file sample does not capture. My suspects, in rough order:
    </p>
    <ul>
      <li><strong>Handler ordering.</strong> Where the diagnostics handler sits relative to other <code>DelegatingHandler</code>s changes who reads the stream first.</li>
      <li><strong>Other handlers touching the body.</strong> An OAuth or retry handler that inspects or buffers the response can interact with the logging handler in ways a bare client never triggers.</li>
      <li><strong>Response characteristics.</strong> Content type, transfer encoding (chunked vs content-length), and body size all influence whether the stream is buffered or streamed.</li>
    </ul>
    <p>
      Until one of those is pinned down, I cannot call this a definitive bug - only a reproducible-in-production, not-in-isolation problem with a workaround that holds.
    </p>

    <h2>Should you report it?</h2>
    <p>
      Yes - to <a href="https://github.com/dotnet/extensions/issues" target="_blank" rel="noopener noreferrer" className={styles.link}>dotnet/extensions</a>, which owns this package. Search first; if nothing matches, open an issue with your package version, the handler registration order, and any other <code>DelegatingHandler</code>s in the chain. Even without a minimal repro, the ordering and handler details are exactly what maintainers need to narrow it down. If you do find a reliable reproduction, that is the single most valuable thing you can attach.
    </p>

    <h2>Frequently asked questions</h2>
    <div className={styles.faq}>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What causes "The stream was already consumed" with extended HTTP logging?</strong>
        <p className={styles.faqA}>With LogBody enabled, the diagnostics handler reads the response content stream to log it. If the caller then reads HttpResponseMessage.Content again, the stream has already been consumed and the second read throws. It surfaces with the default ResponseContentRead completion option used by GetAsync and PostAsJsonAsync.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Which package versions are affected?</strong>
        <p className={styles.faqA}>I observed it on Microsoft.Extensions.Http.Diagnostics 9.1 and later, including 10.x, on .NET 10. I did not see it on 9.0 or earlier. Because I could not build a reliable standalone repro, treat these bounds as what I saw rather than a confirmed range.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Does switching to ResponseHeadersRead have downsides?</strong>
        <p className={styles.faqA}>Yes. With ResponseHeadersRead, HttpClient.Timeout only covers reading the headers, not the body. You must enforce a timeout on the content read yourself, typically with a CancellationToken carrying its own deadline. Otherwise a server that sends headers quickly but stalls on the body can hang the read.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Can I just turn off body logging instead?</strong>
        <p className={styles.faqA}>Setting LogBody to false does avoid the problem, since nothing reads the body for logging. It is the right fix if you do not need response bodies in your logs. If you do need them, the SendAsync plus ResponseHeadersRead workaround keeps both the logging and your own read working.</p>
      </div>
    </div>

    <h2>Official resources</h2>
    <ul>
      <li><a href="https://learn.microsoft.com/en-us/dotnet/api/microsoft.extensions.http.logging.loggingoptions" target="_blank" rel="noopener noreferrer" className={styles.link}>LoggingOptions class - Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/dotnet/api/system.net.http.httpcompletionoption" target="_blank" rel="noopener noreferrer" className={styles.link}>HttpCompletionOption enum - Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/dotnet/core/extensions/httpclient-factory" target="_blank" rel="noopener noreferrer" className={styles.link}>IHttpClientFactory with .NET - Microsoft Learn</a></li>
      <li><a href="https://github.com/dotnet/extensions" target="_blank" rel="noopener noreferrer" className={styles.link}>dotnet/extensions - the repository that owns this package</a></li>
    </ul>

  </div>
);

export default ExtendedHttpLoggingStreamConsumed;
