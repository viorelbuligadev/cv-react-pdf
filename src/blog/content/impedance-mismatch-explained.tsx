import React from 'react';
import styles from './Article.module.css';

const ImpedanceMismatchExplained = () => (
  <div className={styles.article}>

    <div className={styles.quickAnswer}>
      <strong>Quick answer:</strong> Impedance mismatch in software describes the friction you get when two systems are built on fundamentally different models - so you need a translation layer between them and lose something in the process. The most common example is the <strong>object-relational impedance mismatch</strong>: objects have references, graphs, and inheritance; relational databases have rows, foreign keys, and joins. ORMs like EF Core exist to bridge the gap, but the bridge is never perfect.
    </div>

    <p className={styles.lead}>
      The term comes from electrical engineering. When two parts of a circuit have different impedance values, power does not transfer cleanly - you get reflected signals and energy loss. The fix is an impedance-matching component that bridges the two. Software borrowed the metaphor, and it fits surprisingly well.
    </p>
    <img
      src="/images/impedance_mismatch.png"
      alt="Impedance mismatch - two systems with different models connected by a translation layer"
      style={{ width: '100%', borderRadius: '12px', margin: '1.5rem 0' }}
    />

    <h2>What is impedance mismatch in software?</h2>
    <p>
      In software, impedance mismatch describes what happens when two systems are built on fundamentally different paradigms and do not naturally fit together. You need a translation layer - and that layer adds overhead, introduces bugs, and leaks abstractions.
    </p>
    <p>
      The key word is <em>fundamentally</em>. This is not about different naming conventions or slightly different data formats. It is about two models that conceptualise the same reality in incompatible ways. No amount of mapping code makes them identical - you always trade something.
    </p>

    <h2>What is the object-relational impedance mismatch?</h2>
    <p>
      This is the classic case. Objects and relational tables model data differently in several important ways:
    </p>
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Object world</th>
            <th>Relational world</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>References and object graphs</td>
            <td>Foreign keys and joins</td>
          </tr>
          <tr>
            <td>Inheritance and polymorphism</td>
            <td>No native concept - faked with TPH, TPT, TPC</td>
          </tr>
          <tr>
            <td>Identity by reference (same object in memory)</td>
            <td>Identity by primary key value</td>
          </tr>
          <tr>
            <td>Collections as first-class properties</td>
            <td>One-to-many via foreign key in child table</td>
          </tr>
          <tr>
            <td>Encapsulation - behaviour lives with data</td>
            <td>Tables are passive data containers</td>
          </tr>
          <tr>
            <td>One aggregate can be one class</td>
            <td>One aggregate often spans several tables</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      These are not minor differences. They reflect two genuinely different ways of thinking about data. Objects are designed for in-memory computation; relational tables are designed for persistent, set-based querying. Neither is wrong - they are built for different jobs.
    </p>

    <h2>How does EF Core try to bridge the gap?</h2>
    <p>
      EF Core is, in essence, the impedance-matching layer. It lets you write C# classes and query them with LINQ, while behind the scenes translating everything to SQL. For most CRUD scenarios it works well enough that you rarely think about it.
    </p>
    <pre className={styles.code}>{`// You write this
var orders = await _context.Orders
    .Where(o => o.CustomerId == customerId && o.Total > 100)
    .ToListAsync();

// EF Core generates something like this
// SELECT * FROM Orders WHERE CustomerId = @p0 AND Total > @p1`}</pre>
    <p>
      The translation handles the object-to-row mapping, tracks changes, generates INSERT/UPDATE/DELETE, and manages relationships. For simple cases, you almost forget you are talking to a database.
    </p>

    <h2>Is an ORM an implementation of the Adapter pattern?</h2>
    <p>
      Yes - an ORM is a textbook example of the <strong>Adapter pattern</strong>. The Adapter pattern bridges two incompatible interfaces so they can work together without changing either side. That is exactly what an ORM does:
    </p>
    <ul>
      <li><strong>Adaptee</strong> - the relational database (tables, rows, foreign keys, SQL)</li>
      <li><strong>Target</strong> - the object model (classes, references, graphs, LINQ)</li>
      <li><strong>Adapter</strong> - the ORM (EF Core, SQLAlchemy, Hibernate)</li>
    </ul>
    <p>
      Neither side changes. Your C# classes do not become tables, and the database does not learn to speak objects. The ORM sits in the middle and translates. The impedance mismatch is the reason the Adapter pattern is needed in the first place - and the bigger the mismatch, the more complex and leaky the adapter becomes. The N+1 problem, the <code>IQueryable</code> vs <code>IEnumerable</code> trap, and the inheritance mapping compromises are all symptoms of an adapter that cannot fully hide what it is bridging.
    </p>

    <h2>Where does the abstraction leak?</h2>
    <p>
      The abstraction leaks wherever the mapping is not 1:1. And that happens more often than you would like.
    </p>

    <h3>IEnumerable vs IQueryable</h3>
    <p>
      This is one of the most common surprises. <code>IQueryable</code> builds an expression tree that EF Core translates to SQL. <code>IEnumerable</code> executes immediately and then filters in memory. Mix them up and you pull the entire table across the wire.
    </p>
    <pre className={styles.code}>{`// IQueryable - filter happens in the database (correct)
var result = await _context.Products
    .Where(p => p.Price > 50)
    .ToListAsync();

// IEnumerable - loads ALL products into memory first, then filters (expensive)
IEnumerable<Product> products = _context.Products;
var result = products.Where(p => p.Price > 50).ToList();`}</pre>

    <h3>N+1 queries</h3>
    <p>
      Load a list of orders, then access each order's customer - and EF Core fires a separate query for every customer. One query becomes N+1 queries without you noticing.
    </p>
    <pre className={styles.code}>{`// N+1 problem - one query for orders, then one per customer
var orders = await _context.Orders.ToListAsync();
foreach (var order in orders)
{
    Console.WriteLine(order.Customer.Name);  // triggers a query each time
}

// Fix - eager load with Include
var orders = await _context.Orders
    .Include(o => o.Customer)
    .ToListAsync();`}</pre>

    <h3>Inheritance mapping</h3>
    <p>
      Relational databases have no concept of inheritance. EF Core gives you three strategies to fake it - Table Per Hierarchy (TPH), Table Per Type (TPT), and Table Per Concrete (TPC) - and each one involves compromises. TPH puts all subclass columns in one wide table with a lot of nulls. TPT is clean but requires joins for every query. The mismatch never fully disappears; you just choose which trade-off hurts less.
    </p>

    <h2>How does the same mismatch look in Python with SQLAlchemy?</h2>
    <p>
      SQLAlchemy is Python's equivalent of EF Core - an ORM that maps classes to tables and lets you query them with Python expressions. The impedance mismatch is identical; only the syntax differs.
    </p>

    <h3>Basic query translation</h3>
    <pre className={styles.code}>{`# You write this
orders = session.query(Order).filter(
    Order.customer_id == customer_id,
    Order.total > 100
).all()

# SQLAlchemy generates something like this
# SELECT * FROM orders WHERE customer_id = :p0 AND total > :p1`}</pre>

    <h3>N+1 queries in SQLAlchemy</h3>
    <p>
      The N+1 problem looks exactly the same. Access a relationship attribute on a lazily loaded object and SQLAlchemy fires a query for each one.
    </p>
    <pre className={styles.code}>{`# N+1 problem - one query for orders, then one per customer
orders = session.query(Order).all()
for order in orders:
    print(order.customer.name)  # triggers a separate query each time

# Fix - eager load with joinedload
from sqlalchemy.orm import joinedload

orders = (
    session.query(Order)
    .options(joinedload(Order.customer))
    .all()
)`}</pre>

    <h3>Lazy loading vs eager loading</h3>
    <p>
      SQLAlchemy relationships are lazy by default - related objects are loaded on first access. For collections with many items, <code>subqueryload</code> is usually more efficient than <code>joinedload</code> because it avoids duplicating rows in the result set.
    </p>
    <pre className={styles.code}>{`from sqlalchemy.orm import subqueryload

# Load orders with all their items in two queries instead of N+1
orders = (
    session.query(Order)
    .options(subqueryload(Order.items))
    .all()
)`}</pre>

    <h3>The modern SQLAlchemy 2.0 style</h3>
    <p>
      SQLAlchemy 2.0 introduced a new query API that is closer to SQL in structure and avoids some of the older API's ambiguities:
    </p>
    <pre className={styles.code}>{`from sqlalchemy import select
from sqlalchemy.orm import selectinload

stmt = (
    select(Order)
    .where(Order.total > 100)
    .options(selectinload(Order.items))
)

orders = session.scalars(stmt).all()`}</pre>
    <div className={styles.callout}>
      <strong>Same rules apply:</strong> whether you are using EF Core in C# or SQLAlchemy in Python, the underlying mismatch is identical. Know what SQL your ORM generates. Use eager loading when you know you will access related data. Drop to raw SQL when the ORM fights you.
    </div>

    <h2>Does impedance mismatch appear anywhere else in software?</h2>
    <p>
      Yes - whenever two paradigms have to talk to each other. Some common examples:
    </p>
    <ul>
      <li><strong>Sync vs async:</strong> a synchronous caller that needs to consume an async API (or vice versa) always introduces awkward wrapping code, deadlock risk, or thread waste.</li>
      <li><strong>REST API vs domain model:</strong> a REST API thinks in resources and HTTP verbs; a domain model thinks in aggregates and commands. Mapping one to the other means either bending your domain to fit the HTTP model, or writing a translation layer that adds complexity.</li>
      <li><strong>Two services with different world views:</strong> two microservices that each have a <code>Customer</code> entity but define it differently - one includes shipping address, the other does not. Every integration point between them is a translation layer where data can be lost or misread.</li>
      <li><strong>JSON serialisation:</strong> JSON is flat and typeless; C# objects have types, inheritance, and value semantics. <code>JsonSerializer</code> and the options you need to configure for polymorphic serialisation are all symptoms of the mismatch.</li>
    </ul>

    <h2>How do you minimise the pain?</h2>
    <p>
      You cannot eliminate impedance mismatch - you can only choose where to pay the cost and make that cost visible.
    </p>
    <ul>
      <li><strong>Be explicit about the boundary.</strong> Name your translation layer. If you have an EF Core entity and a domain object, keep them separate and have a mapper between them. Do not pretend they are the same thing.</li>
      <li><strong>Do not let the database model leak into the domain.</strong> Your business logic should not know about foreign key columns, navigation properties, or TPH discriminators.</li>
      <li><strong>Prefer explicit loading over lazy loading.</strong> Lazy loading hides queries and makes the N+1 problem invisible until it hits production. Use <code>Include</code> and know exactly what SQL you are generating.</li>
      <li><strong>Write raw SQL when the ORM fights you.</strong> EF Core supports <code>FromSqlRaw</code> and <code>ExecuteSqlRaw</code>. Complex reports, bulk operations, and recursive CTEs are often cleaner in SQL than in LINQ.</li>
    </ul>
    <div className={styles.callout}>
      <strong>Rule of thumb:</strong> the ORM is a tool for the common case. When you find yourself fighting it to express something the relational model handles naturally - aggregations, window functions, recursive queries - write the SQL directly. The abstraction exists to help you, not to constrain you.
    </div>

    <h2>Frequently asked questions</h2>
    <div className={styles.faq}>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Where does the term "impedance mismatch" come from?</strong>
        <p className={styles.faqA}>It comes from electrical engineering, where impedance mismatch between circuit components causes power loss and signal reflection. The software community borrowed the metaphor because the idea maps well - two systems with incompatible "shapes" that need a bridging component, at the cost of some loss.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Does using an ORM solve the object-relational impedance mismatch?</strong>
        <p className={styles.faqA}>It reduces the manual work but does not eliminate the mismatch. An ORM is the translation layer - and translation layers always have edge cases, performance surprises, and leaky abstractions. You trade writing SQL by hand for learning the ORM's behaviour in detail.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What is the N+1 query problem?</strong>
        <p className={styles.faqA}>It happens when you load a list of N entities and then trigger one additional query for each entity to load a related object. One query becomes N+1 queries. In EF Core the fix is to use Include() to eager-load the related data in a single query.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What is the difference between IQueryable and IEnumerable in EF Core?</strong>
        <p className={styles.faqA}>IQueryable builds an expression tree that EF Core translates to SQL - filtering and sorting happen in the database. IEnumerable triggers execution immediately and any subsequent operations happen in memory. Using IEnumerable where IQueryable is expected can load entire tables into memory.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Should I always use an ORM?</strong>
        <p className={styles.faqA}>Not always. ORMs are well suited for CRUD-heavy applications with straightforward data models. For read-heavy reporting, complex aggregations, or bulk data operations, raw SQL or a micro-ORM like Dapper often gives you better control and performance.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Is impedance mismatch only relevant to databases?</strong>
        <p className={styles.faqA}>No. The concept appears anywhere two systems with fundamentally different models need to communicate - sync vs async boundaries, REST APIs vs domain models, microservices with overlapping entities, and even serialisation formats. Wherever you see a translation layer, there is probably a mismatch underneath it.</p>
      </div>
    </div>

    <h2>Official resources</h2>
    <ul>
      <li><a href="https://learn.microsoft.com/en-us/ef/core/" target="_blank" rel="noopener noreferrer" className={styles.link}>Entity Framework Core - Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/ef/core/querying/related-data/eager" target="_blank" rel="noopener noreferrer" className={styles.link}>Eager loading of related data in EF Core - Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/ef/core/modeling/inheritance" target="_blank" rel="noopener noreferrer" className={styles.link}>Inheritance mapping in EF Core - Microsoft Learn</a></li>
    </ul>

  </div>
);

export default ImpedanceMismatchExplained;
