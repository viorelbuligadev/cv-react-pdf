import React from 'react';
import styles from './Article.module.css';

const ExtendedHttpLoggingStreamConsumed = () => (
  <div className={styles.article}>

    <div className={styles.quickAnswer}>
      <strong>Quick answer:</strong> Adding <code>AddExtendedHttpClientLogging</code> with <code>LogBody = true</code> made every HTTP response unreadable in my services - the logging handler consumes the content stream, and my code then throws "The stream was already consumed." It only happens in <strong>Debug</strong> builds, and only from <code>Microsoft.Extensions.Http.Diagnostics</code> <strong>9.1 upwards</strong> - 9.0 is fine. Switching from <code>GetAsync</code> to <code>SendAsync</code> with <code>HttpCompletionOption.ResponseHeadersRead</code> restores the Release behaviour in Debug.
    </div>

    <p className={styles.lead}>
      I run a microservices solution on .NET 10 where services talk to each other synchronously over <code>HttpClient</code>. I wanted structured request and response logging across all of them, so I added the extended HTTP client logging from <code>Microsoft.Extensions.Http.Diagnostics</code>. Everything looked fine - until I ran it locally.
    </p>

    <img
      src="/images/httpstream.png"
      alt="An HTTP response body stream consumed by the logging handler before the caller can read it"
      style={{ width: '100%', borderRadius: '12px', margin: '1.5rem 0' }}
    />

    <h2>The tech stack</h2>
    <p>
      Worth being precise here, because the combination matters - swap any one of these and you may not see it.
    </p>
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Component</th>
            <th>Version / detail</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Runtime</td>
            <td>.NET 10</td>
          </tr>
          <tr>
            <td>Architecture</td>
            <td>Microservices, synchronous service-to-service HTTP calls</td>
          </tr>
          <tr>
            <td>HTTP client</td>
            <td><code>HttpClient</code> resolved through <code>IHttpClientFactory</code></td>
          </tr>
          <tr>
            <td>Logging package</td>
            <td><code>Microsoft.Extensions.Http.Diagnostics</code> <strong>9.1+</strong> (reproduced on 10.x too). Not on 9.0.</td>
          </tr>
          <tr>
            <td>Registration</td>
            <td><code>AddExtendedHttpClientLogging</code> with <code>LogBody = true</code>, plus <code>AddRedaction()</code>, which it requires</td>
          </tr>
          <tr>
            <td>Call style</td>
            <td><code>GetAsync</code> / <code>PostAsJsonAsync</code> - both default to <code>HttpCompletionOption.ResponseContentRead</code></td>
          </tr>
          <tr>
            <td>Build configuration</td>
            <td><strong>Debug</strong> - Release does not reproduce it</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2>The exception</h2>
    <p>
      As soon as the caller reads the response body, in Debug:
    </p>
    <pre className={styles.code}>{`System.InvalidOperationException:
  The stream was already consumed. It cannot be read again.`}</pre>
    <p>
      It does not come from my deserialisation code. It comes from reading <code>HttpResponseMessage.Content</code> a second time - the first read having been done by the diagnostics handler to log the body.
    </p>

    <h2>The configuration and the code that triggers it</h2>
    <p>
      The handler only reads the body if you ask it to. <code>LogBody</code> is the switch; the rest bound how much it reads and which content types it treats as text.
    </p>
    <pre className={styles.code}>{`// Required by AddExtendedHttpClientLogging - it will not
// resolve its dependencies without the redaction services.
builder.Services.AddRedaction();

builder.Services.AddHttpClient("ReproClient")
    .AddExtendedHttpClientLogging(options =>
    {
        options.LogBody = true;                    // <- reads the body
        options.BodySizeLimit = 1024;              // max bytes read for logging
        options.BodyReadTimeout = TimeSpan.FromSeconds(5);
        options.RequestBodyContentTypes.Add("application/json");
        options.ResponseBodyContentTypes.Add("application/json");
    });`}</pre>
    <p>
      And the calling code, which is about as ordinary as it gets:
    </p>
    <pre className={styles.code}>{`// GetAsync defaults to HttpCompletionOption.ResponseContentRead
using var response = await client.GetAsync($"{ApiUrl}/events");
response.EnsureSuccessStatusCode();

var raw = await response.Content.ReadAsStreamAsync();   // throws in Debug
var events = await JsonSerializer.DeserializeAsync<List<Event>>(
    raw, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });`}</pre>

    <h2>Debug fails, Release works</h2>
    <p>
      This is the detail that cost me the most time, and the one worth remembering even if you never touch this package. The exact same code, same configuration, same package version: <strong>Debug throws, Release does not</strong>.
    </p>
    <p>
      It behaves like a heisenbug. It disappears when you publish, so you start doubting the diagnosis; it comes back the moment you run locally, so you cannot ignore it. And if you write a small reproduction and happen to run it in Release, you conclude the problem is somewhere else entirely and go hunting for exotic causes.
    </p>
    <div className={styles.callout}>
      <strong>The lesson that generalises:</strong> when a failure will not reproduce in a clean project, compare the <em>build configuration</em> before you start blaming the handler pipeline. Debug and Release differ in JIT optimisation and therefore in timing - enough to change the behaviour of anything timing-sensitive, and this handler has a timing knob in <code>BodyReadTimeout</code>. I have not proven that is the mechanism, but it is the first thing I would test.
    </div>

    <h2>Narrowing it to the package version</h2>
    <p>
      Testing across versions put the boundary in a clear place: the failure appears from <code>Microsoft.Extensions.Http.Diagnostics</code> <strong>9.1 upwards</strong>, including the 10.x releases. On <strong>9.0</strong> the same code, in the same Debug build, works.
    </p>
    <p>
      So pinning the package to 9.0 is a valid fallback if you would rather not change your calling code. It just means giving up whatever else those versions brought.
    </p>

    <h2>The fix</h2>
    <p>
      What restored Debug to behaving like Release was to stop asking <code>HttpClient</code> to read the whole response before handing it back. <code>GetAsync</code> and <code>PostAsJsonAsync</code> use <code>ResponseContentRead</code> - "complete after reading the entire response including the content". Dropping to <code>SendAsync</code> with <code>ResponseHeadersRead</code> - "complete as soon as a response is available and headers are read; the content is not read yet" - leaves the stream readable for both the handler and my code.
    </p>
    <pre className={styles.code}>{`using var request =
    new HttpRequestMessage(HttpMethod.Get, $"{ApiUrl}/events");

using var response = await client.SendAsync(
    request, HttpCompletionOption.ResponseHeadersRead);
response.EnsureSuccessStatusCode();

var raw = await response.Content.ReadAsStreamAsync();   // works
var events = await JsonSerializer.DeserializeAsync<List<Event>>(
    raw, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });`}</pre>
    <p>
      Note what did <em>not</em> change: the logging configuration is identical in both versions. Only the way <code>HttpClient</code> is invoked differs.
    </p>
    <div className={styles.callout}>
      <strong>One caveat that comes with <code>ResponseHeadersRead</code>.</strong> The docs warn that with this option, <code>HttpClient.Timeout</code> "applies only up to where the headers end and the content starts". Reading the content is no longer covered by that timeout, so guard the body read yourself - a <code>CancellationToken</code> from a <code>CancellationTokenSource</code> with its own deadline.
    </div>

    <h2>Reproducing it</h2>
    <p>
      The reproduction needs nothing exotic - no OAuth handler, no retry policy, no unusual payload. Two projects are enough:
    </p>
    <ul>
      <li><strong>ReproApi</strong> - an ASP.NET Core Web API exposing a single <code>/events</code> endpoint that returns JSON.</li>
      <li><strong>ReproClient</strong> - a console app calling it through <code>IHttpClientFactory</code>, with the same package version and the same <code>AddExtendedHttpClientLogging</code> configuration.</li>
    </ul>
    <p>
      The client has a single <code>ApplyFix</code> flag at the top. Leave it <code>false</code> to take the <code>GetAsync</code> path and watch it throw; set it to <code>true</code> to take the <code>SendAsync</code> path and watch the same call succeed. Then run the whole thing in Release and the failing path stops failing.
    </p>
    <pre className={styles.code}>{`// ReproClient/Program.cs
//   false -> BUG: client.GetAsync(url)   (ResponseContentRead, the default)
//   true  -> FIX: client.SendAsync(request, ResponseHeadersRead)
const bool ApplyFix = false;`}</pre>
    <p>
      The full reproduction is on GitHub if you want to run it yourself: <a href="https://github.com/viorelbuligadev/StreamConsumedRepro" target="_blank" rel="noopener noreferrer" className={styles.link}>viorelbuligadev/StreamConsumedRepro</a>.
    </p>
    <p>
      If you hit this too, it is worth reporting to <a href="https://github.com/dotnet/extensions/issues" target="_blank" rel="noopener noreferrer" className={styles.link}>dotnet/extensions</a>, which owns the package - with the version, the logging configuration, and above all the fact that it is Debug-only.
    </p>

    <h2>Frequently asked questions</h2>
    <div className={styles.faq}>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What causes "The stream was already consumed" with extended HTTP logging?</strong>
        <p className={styles.faqA}>With LogBody enabled, the diagnostics handler reads the response content stream in order to log it. When the caller then reads HttpResponseMessage.Content again, the stream has already been consumed and the second read throws. It shows up with the default ResponseContentRead completion option used by GetAsync and PostAsJsonAsync.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Why does it only happen in Debug and not in Release?</strong>
        <p className={styles.faqA}>That is the observed behaviour: the same code throws in a Debug build and succeeds in a Release one. I have not proven the mechanism. Debug and Release differ in JIT optimisation and therefore in timing, which is enough to affect anything timing-sensitive - and this handler has a timing knob in BodyReadTimeout. That is a hypothesis to test, not a conclusion. The practical takeaway: if a failure will not reproduce in a clean project, check the build configuration first.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Which package versions are affected?</strong>
        <p className={styles.faqA}>Microsoft.Extensions.Http.Diagnostics from 9.1 upwards, including 10.x, on .NET 10. Version 9.0 does not reproduce it, so pinning to 9.0 is a valid fallback if you would rather not change your calling code.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Does switching to ResponseHeadersRead have downsides?</strong>
        <p className={styles.faqA}>Yes. With ResponseHeadersRead, HttpClient.Timeout only covers reading the headers, not the body. You must enforce a timeout on the content read yourself, typically with a CancellationToken carrying its own deadline. Otherwise a server that returns headers promptly but stalls on the content can hang the read.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Can I just turn off body logging instead?</strong>
        <p className={styles.faqA}>Setting LogBody to false does avoid the problem, since nothing reads the body for logging. It is the right fix if you do not need response bodies in your logs. If you do need them, the SendAsync plus ResponseHeadersRead change keeps both the logging and your own read working.</p>
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
