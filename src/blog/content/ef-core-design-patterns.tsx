import React from 'react';
import styles from './Article.module.css';

const EfCoreDesignPatterns = () => (
  <div className={styles.article}>

    <div className={styles.quickAnswer}>
      <strong>Quick answer:</strong> EF Core implements at least 11 design patterns. The three most fundamental are <strong>Unit of Work</strong> (DbContext), <strong>Repository</strong> (DbSet&lt;T&gt;), and <strong>Identity Map</strong> (change tracker). Understanding these patterns explains most of EF Core's behaviour - and most of its surprises. The rest - Builder, Strategy, Factory, Object Pool, Interceptor, Template Method, Query Object, Value Object - explain everything else.
    </div>

    <p className={styles.lead}>
      Working with EF Core daily, I started recognising the same patterns everywhere - in how DbContext tracks changes, in how ModelBuilder configures entities, in how lazy loading proxies work. EF Core is not just a data access library. It is a textbook of enterprise patterns in working code.
    </p>

    <img
      src="/images/efcorepatterns.png"
      alt="EF Core design patterns illustration"
      style={{ width: '100%', borderRadius: '12px', margin: '1.5rem 0' }}
    />

    <h2>Which design patterns does EF Core implement?</h2>
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Pattern</th>
            <th>Where in EF Core</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Unit of Work</td><td><code>DbContext</code> + <code>SaveChanges()</code></td></tr>
          <tr><td>Repository</td><td><code>DbSet&lt;T&gt;</code></td></tr>
          <tr><td>Identity Map</td><td>Change tracker (one instance per key per context)</td></tr>
          <tr><td>Strategy</td><td>Execution strategies, database providers</td></tr>
          <tr><td>Builder</td><td><code>ModelBuilder</code>, <code>EntityTypeBuilder</code>, <code>DbContextOptionsBuilder</code></td></tr>
          <tr><td>Factory</td><td><code>IDbContextFactory&lt;T&gt;</code></td></tr>
          <tr><td>Object Pool</td><td><code>AddDbContextPool</code></td></tr>
          <tr><td>Decorator / Interceptor</td><td><code>IDbCommandInterceptor</code>, <code>ISaveChangesInterceptor</code></td></tr>
          <tr><td>Template Method</td><td><code>OnModelCreating</code>, <code>OnConfiguring</code></td></tr>
          <tr><td>Query Object</td><td><code>IQueryable&lt;T&gt;</code> + LINQ</td></tr>
          <tr><td>Value Object</td><td>Owned entities, value conversions</td></tr>
        </tbody>
      </table>
    </div>

    <h2>Unit of Work - why DbContext is the heart of EF Core</h2>
    <p>
      The Unit of Work pattern groups a set of operations into a single transaction that either commits all at once or rolls back entirely. <code>DbContext</code> is the Unit of Work in EF Core. It tracks every change you make - additions, modifications, deletions - and when you call <code>SaveChanges()</code>, it wraps everything in a single database transaction.
    </p>
    <pre className={styles.code}>{`var context = new AppDbContext();

context.Orders.Add(new Order { Total = 150 });
context.Customers.Update(customer);
context.Products.Remove(obsoleteProduct);

// All three operations commit in one transaction, or none do
await context.SaveChangesAsync();`}</pre>
    <p>
      This is why <code>DbContext</code> is registered as <code>Scoped</code> in ASP.NET Core by default - one context per HTTP request, one unit of work per request. If you register it as <code>Singleton</code>, you share the same unit across all requests, which causes thread-safety issues and stale data.
    </p>
    <div className={styles.callout}>
      <strong>Consequence:</strong> everything you load within the same <code>DbContext</code> instance is part of the same unit of work. Changes to any tracked entity are automatically included in the next <code>SaveChanges()</code> call - even if you did not intend to save them.
    </div>

    <h2>Repository - is DbSet&lt;T&gt; already a repository?</h2>
    <p>
      The Repository pattern abstracts the data access layer and provides a collection-like interface for querying and persisting domain objects. <code>DbSet&lt;T&gt;</code> already does exactly this.
    </p>
    <pre className={styles.code}>{`// DbSet<T> is a repository - you query, add, update, and remove through it
var pending = await context.Orders
    .Where(o => o.Status == OrderStatus.Pending)
    .ToListAsync();

context.Orders.Add(new Order { ... });
context.Orders.Remove(order);`}</pre>
    <p>
      This is the source of the long-running debate: <strong>should you add another Repository layer on top of EF Core?</strong>
    </p>
    <ul>
      <li><strong>Arguments for:</strong> hides EF Core from the domain layer, makes unit testing easier (mock the repository, not DbContext), enforces a consistent query API. In DDD specifically, the Repository interface lives in the domain layer while the EF Core implementation lives in infrastructure - this keeps the domain free of any infrastructure dependency. DDD also restricts repositories to Aggregate Roots only, which prevents you from accidentally querying child entities directly and bypassing aggregate boundaries. Repository method names can express domain language (<code>GetPendingOrdersForCustomer</code>) instead of leaking LINQ expressions into the domain.</li>
      <li><strong>Arguments against:</strong> you are wrapping a repository with another repository. You lose <code>IQueryable</code> composability, you have to replicate every method you need, and mocking DbContext is already straightforward with <code>UseInMemoryDatabase</code>.</li>
    </ul>
    <p>
      My take: for most applications, wrapping EF Core in a Repository adds boilerplate without much gain. The cases where it makes sense are when you need to swap out the data access layer entirely - for example, switching from EF Core to Dapper for a specific aggregate.
    </p>

    <h2>Identity Map - how the change tracker prevents duplicate instances</h2>
    <p>
      The Identity Map pattern ensures that within a single unit of work, each entity is loaded only once and always returns the same object instance for the same key. EF Core's change tracker implements this.
    </p>
    <pre className={styles.code}>{`var order1 = await context.Orders.FindAsync(1);
var order2 = await context.Orders.FindAsync(1);  // no second DB query

Console.WriteLine(ReferenceEquals(order1, order2));  // True - same instance`}</pre>
    <p>
      <code>FindAsync</code> checks the change tracker first before going to the database. <code>FirstOrDefaultAsync</code> does not - it always queries the database, then merges the result with whatever is already tracked.
    </p>
    <div className={styles.callout}>
      <strong>Common surprise:</strong> you modify an entity in memory, then query it again with <code>FirstOrDefaultAsync</code>, expecting fresh data from the database. You get the modified in-memory version instead, because the change tracker already holds that entity. This is the Identity Map at work.
    </div>

    <h2>Strategy - providers and execution strategies</h2>
    <p>
      The Strategy pattern defines a family of interchangeable algorithms. EF Core uses it in two places.
    </p>
    <h3>Database providers as strategies</h3>
    <p>
      The database provider (SQL Server, PostgreSQL, SQLite, In-Memory) is a strategy. You swap it by changing a single line in configuration, without touching any other code.
    </p>
    <pre className={styles.code}>{`options.UseSqlServer(connectionString);  // production
options.UseNpgsql(connectionString);     // PostgreSQL
options.UseSqlite(connectionString);     // integration tests
options.UseInMemoryDatabase("test");     // unit tests`}</pre>

    <h3>Execution strategies</h3>
    <p>
      An execution strategy defines how EF Core handles transient failures - network blips, connection timeouts, deadlocks. <code>EnableRetryOnFailure</code> sets a built-in retry strategy; you can also implement <code>IExecutionStrategy</code> yourself.
    </p>
    <pre className={styles.code}>{`options.UseSqlServer(connectionString, sql =>
    sql.EnableRetryOnFailure(
        maxRetryCount: 5,
        maxRetryDelay: TimeSpan.FromSeconds(10),
        errorNumbersToAdd: null));`}</pre>

    <h2>Builder - fluent configuration in EF Core</h2>
    <p>
      The Builder pattern constructs complex objects step by step through a fluent API. EF Core has three builders, each for a different scope.
    </p>
    <pre className={styles.code}>{`// DbContextOptionsBuilder - configures the context itself
var options = new DbContextOptionsBuilder<AppDbContext>()
    .UseSqlServer(connectionString)
    .EnableSensitiveDataLogging()
    .EnableDetailedErrors()
    .Options;

// ModelBuilder - configures the entire model in OnModelCreating
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    modelBuilder.HasDefaultSchema("app");
}

// EntityTypeBuilder - configures a single entity
modelBuilder.Entity<Order>(entity =>
{
    entity.HasKey(o => o.Id);
    entity.Property(o => o.Total).HasPrecision(18, 2).IsRequired();
    entity.HasIndex(o => o.CustomerId);
    entity.HasMany(o => o.Items).WithOne(i => i.Order).OnDelete(DeleteBehavior.Cascade);
});`}</pre>

    <h2>Factory and Object Pool - controlling context lifetime</h2>

    <h3>Factory - IDbContextFactory&lt;T&gt;</h3>
    <p>
      The standard <code>AddDbContext</code> gives you a scoped context tied to the HTTP request. In Blazor Server, or in background services where you need multiple short-lived contexts, that model does not work. <code>IDbContextFactory&lt;T&gt;</code> gives you a factory you can call on demand.
    </p>
    <pre className={styles.code}>{`// Registration
builder.Services.AddDbContextFactory<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

// In a Blazor component or background service
@inject IDbContextFactory<AppDbContext> DbFactory

async Task LoadData()
{
    using var context = DbFactory.CreateDbContext();  // explicit lifetime
    Orders = await context.Orders.ToListAsync();
}`}</pre>

    <h3>Object Pool - AddDbContextPool</h3>
    <p>
      Creating a <code>DbContext</code> has overhead - setting up the change tracker, loading the model, opening the connection. <code>AddDbContextPool</code> maintains a pool of pre-created, reset contexts and hands them out per request instead of creating new ones each time.
    </p>
    <pre className={styles.code}>{`builder.Services.AddDbContextPool<AppDbContext>(options =>
    options.UseSqlServer(connectionString),
    poolSize: 128);  // default is 1024`}</pre>
    <div className={styles.callout}>
      <strong>Constraint:</strong> pooled contexts cannot have instance-level state (fields, injected services stored in the context). The pool resets the change tracker between uses but does not call your constructor again. If your <code>DbContext</code> stores anything beyond EF Core's own state, use <code>AddDbContext</code> instead.
    </div>

    <h2>Decorator and Template Method - hooks into EF Core's pipeline</h2>

    <h3>Interceptors as Decorators</h3>
    <p>
      <code>IDbCommandInterceptor</code> and <code>ISaveChangesInterceptor</code> wrap EF Core's internal operations and let you add behaviour before or after without modifying the source. Classic Decorator pattern.
    </p>
    <pre className={styles.code}>{`public class QueryLoggingInterceptor : DbCommandInterceptor
{
    public override DbDataReader ReaderExecuted(
        DbCommand command,
        CommandExecutedEventData eventData,
        DbDataReader result)
    {
        Console.WriteLine($"[{eventData.Duration.TotalMs}ms] {command.CommandText}");
        return base.ReaderExecuted(command, eventData, result);
    }
}

// Registration
options.AddInterceptors(new QueryLoggingInterceptor());`}</pre>

    <h3>Template Method - OnModelCreating and OnConfiguring</h3>
    <p>
      The Template Method pattern defines the skeleton of an algorithm in a base class and lets subclasses fill in specific steps. <code>DbContext</code> calls <code>OnModelCreating</code> and <code>OnConfiguring</code> at defined points during initialisation. You override them to inject your configuration - the framework controls when they are called.
    </p>
    <pre className={styles.code}>{`public class AppDbContext : DbContext
{
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
            optionsBuilder.UseSqlServer("fallback-connection");
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);  // always call base
        modelBuilder.ApplyConfigurationsFromAssembly(GetType().Assembly);
    }
}`}</pre>

    <h2>Query Object and Value Object - data modeling patterns</h2>

    <h3>Query Object - IQueryable as a composable query</h3>
    <p>
      The Query Object pattern represents a database query as an object that can be built incrementally and executed later. <code>IQueryable&lt;T&gt;</code> is exactly this - an expression tree that EF Core translates to SQL only when enumerated.
    </p>
    <pre className={styles.code}>{`IQueryable<Order> query = context.Orders.AsQueryable();

// Build the query progressively based on runtime conditions
if (customerId.HasValue)
    query = query.Where(o => o.CustomerId == customerId);

if (status.HasValue)
    query = query.Where(o => o.Status == status);

if (fromDate.HasValue)
    query = query.Where(o => o.CreatedAt >= fromDate);

// Single SQL query generated here - all conditions combined
var results = await query.OrderByDescending(o => o.CreatedAt).ToListAsync();`}</pre>
    <p>
      This is also why the <code>IEnumerable</code> vs <code>IQueryable</code> distinction matters so much - returning <code>IEnumerable</code> from a repository method materialises the query immediately and loses the ability to compose further conditions in SQL.
    </p>

    <h3>Value Object - owned entities and value conversions</h3>
    <p>
      A Value Object is defined by its properties, not its identity - two addresses with the same street and city are equal. EF Core maps Value Objects with <code>OwnsOne</code> / <code>OwnsMany</code>, storing their columns in the owner's table rather than a separate table with a primary key.
    </p>
    <pre className={styles.code}>{`public class Order
{
    public int Id { get; set; }
    public Address ShippingAddress { get; set; }  // Value Object - no Id
}

public class Address
{
    public string Street { get; set; }
    public string City { get; set; }
    public string PostalCode { get; set; }
}

// Configuration
modelBuilder.Entity<Order>().OwnsOne(o => o.ShippingAddress, addr =>
{
    addr.Property(a => a.Street).HasColumnName("ShippingStreet");
    addr.Property(a => a.City).HasColumnName("ShippingCity");
});
// Stored as ShippingStreet, ShippingCity, ShippingPostalCode columns in Orders table`}</pre>

    <h2>Frequently asked questions</h2>
    <div className={styles.faq}>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Is DbContext a Unit of Work or a Repository?</strong>
        <p className={styles.faqA}>Both. DbContext is the Unit of Work - it tracks changes and commits them in one transaction via SaveChanges(). DbSet&lt;T&gt; is the Repository - it provides the collection-like interface for querying and persisting a specific entity type. They are separate but work together.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Should I add a Repository layer on top of EF Core?</strong>
        <p className={styles.faqA}>For most applications, no. DbSet&lt;T&gt; is already a repository, and wrapping it adds boilerplate without much benefit. A custom Repository layer makes sense when you need to fully hide EF Core from your domain (for example, to swap data access libraries) or when you want to enforce a strict set of allowed queries across the team.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What is the difference between AddDbContext and AddDbContextPool?</strong>
        <p className={styles.faqA}>AddDbContext creates a new DbContext instance per scope (per request). AddDbContextPool maintains a pool of pre-created instances and resets them between uses, reducing the overhead of construction. Use AddDbContextPool when your context has no custom constructor state and you need to reduce allocation pressure under high load.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>When should I use IDbContextFactory instead of injecting DbContext directly?</strong>
        <p className={styles.faqA}>Use IDbContextFactory when the standard scoped lifetime does not fit - Blazor Server components, background services, or any scenario where you need multiple short-lived contexts within the same scope. It gives you explicit control over the context lifetime via using blocks.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What is the difference between OwnsOne and HasOne in EF Core?</strong>
        <p className={styles.faqA}>OwnsOne maps a Value Object - the owned type has no identity of its own and its columns live in the owner's table. HasOne maps a relationship between two independent entities that each have their own primary key and table. Use OwnsOne for things like Address or Money that only exist as part of a parent entity.</p>
      </div>
    </div>

    <h2>Official resources</h2>
    <ul>
      <li><a href="https://learn.microsoft.com/en-us/ef/core/dbcontext-configuration/" target="_blank" rel="noopener noreferrer" className={styles.link}>DbContext configuration and lifetime - Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/ef/core/querying/related-data/lazy" target="_blank" rel="noopener noreferrer" className={styles.link}>Lazy loading of related data - Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/ef/core/modeling/owned-entities" target="_blank" rel="noopener noreferrer" className={styles.link}>Owned entity types - Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/ef/core/logging-events-diagnostics/interceptors" target="_blank" rel="noopener noreferrer" className={styles.link}>Interceptors in EF Core - Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/ef/core/miscellaneous/connection-resiliency" target="_blank" rel="noopener noreferrer" className={styles.link}>Connection resiliency and execution strategies - Microsoft Learn</a></li>
    </ul>

  </div>
);

export default EfCoreDesignPatterns;
