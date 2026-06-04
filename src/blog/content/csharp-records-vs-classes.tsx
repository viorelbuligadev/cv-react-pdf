import React from 'react';
import styles from './Article.module.css';

const CsharpRecordsVsClasses = () => (
  <div className={styles.article}>

    <div className={styles.quickAnswer}>
      <strong>Quick answer:</strong> A <strong>record</strong> in C# is a type that uses <strong>value equality</strong> by default - two records with the same data are considered equal. A <strong>class</strong> uses <strong>reference equality</strong> by default - two class instances are only equal if they point to the same object. Use records for immutable data models; use classes for objects with identity and behavior.
    </div>

    <p className={styles.lead}>
      When C# 9 introduced records, it changed how I model data in .NET. Instead of writing boilerplate <code>Equals</code> and <code>GetHashCode</code> overrides, I can declare a record in one line and get value equality, a clean <code>ToString</code>, and nondestructive mutation for free. This article explains what records are, how they differ from classes, and when to use each.
    </p>

    <h2>What is a record in C#?</h2>
    <p>
      A <strong>record</strong> is a special type introduced in <strong>C# 9</strong> that tells the compiler to generate value-based equality, a formatted <code>ToString</code>, and support for <code>with</code> expressions automatically. You declare one with the <code>record</code> keyword.
    </p>
    <p>
      The simplest form is the <strong>positional record</strong>, where you list the properties in the declaration line:
    </p>
    <pre className={styles.code}>{`// Positional record - C# 9+
public record Person(string FirstName, string LastName);

// Equivalent to writing a class with:
// - public init-only properties FirstName and LastName
// - value-based Equals, GetHashCode, ==, !=
// - formatted ToString like: Person { FirstName = Grace, LastName = Hopper }
// - a Deconstruct method`}</pre>
    <p>
      You can also use <strong>nominal syntax</strong> if you need more control over property declarations:
    </p>
    <pre className={styles.code}>{`public record Person
{
    public required string FirstName { get; init; }
    public required string LastName { get; init; }
}`}</pre>
    <p>
      Both forms produce the same compiler-generated members. The positional form is more concise; the nominal form gives you more flexibility.
    </p>

    <h2>How does value equality work in records?</h2>
    <p>
      By default, classes compare by <strong>reference</strong> - two variables are only equal if they point to the same object in memory. Records compare by <strong>value</strong> - two record instances are equal if all their properties have equal values.
    </p>
    <p>
      The compiler generates <code>Equals</code>, <code>GetHashCode</code>, <code>==</code>, and <code>!=</code> automatically for records, comparing every property.
    </p>
    <pre className={styles.code}>{`// Class - reference equality
public class PersonClass
{
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
}

var c1 = new PersonClass { FirstName = "Grace", LastName = "Hopper" };
var c2 = new PersonClass { FirstName = "Grace", LastName = "Hopper" };
Console.WriteLine(c1 == c2); // False - different objects in memory

// Record - value equality
public record PersonRecord(string FirstName, string LastName);

var r1 = new PersonRecord("Grace", "Hopper");
var r2 = new PersonRecord("Grace", "Hopper");
Console.WriteLine(r1 == r2); // True - same property values`}</pre>
    <p>
      This makes records ideal for use as dictionary keys, in comparisons, and anywhere you care about the data inside the object rather than which object it is.
    </p>

    <h2>How do you modify a record with a with expression?</h2>
    <p>
      Because positional record class properties are <code>init</code>-only (you cannot set them after construction), you use a <strong>with expression</strong> to create a modified copy. The original record is never changed.
    </p>
    <pre className={styles.code}>{`public record Person(string FirstName, string LastName);

var original = new Person("Grace", "Hopper");
var updated  = original with { FirstName = "Margaret" };

Console.WriteLine(original); // Person { FirstName = Grace, LastName = Hopper }
Console.WriteLine(updated);  // Person { FirstName = Margaret, LastName = Hopper }`}</pre>
    <p>
      The <code>with</code> expression creates a shallow copy of the record and applies the specified changes. The original remains untouched. This is called <strong>nondestructive mutation</strong>.
    </p>
    <p>
      For a property to be changeable in a <code>with</code> expression, it must have an <code>init</code> or <code>set</code> accessor. Positional record properties always have <code>init</code>, so they work automatically.
    </p>

    <h2>What is the difference between record class and record struct?</h2>
    <p>
      C# 10 added <strong>record struct</strong>. The type of record determines how it is stored in memory and how copying behaves:
    </p>
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Feature</th>
            <th>record / record class</th>
            <th>record struct</th>
            <th>readonly record struct</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Introduced in</td><td>C# 9</td><td>C# 10</td><td>C# 10</td></tr>
          <tr><td>Memory</td><td>Heap (reference type)</td><td>Stack (value type)</td><td>Stack (value type)</td></tr>
          <tr><td>Default equality</td><td>Value equality</td><td>Value equality</td><td>Value equality</td></tr>
          <tr><td>Positional properties</td><td>init-only (immutable)</td><td>read-write</td><td>init-only (immutable)</td></tr>
          <tr><td>Inheritance</td><td>Can inherit from record class</td><td>Not supported</td><td>Not supported</td></tr>
          <tr><td>with expression</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>
        </tbody>
      </table>
    </div>
    <pre className={styles.code}>{`// C# 10+
public record struct Point(int X, int Y);           // mutable record struct
public readonly record struct Size(int Width, int Height); // immutable record struct`}</pre>
    <p>
      Use <code>record struct</code> for small, self-contained value types where stack allocation matters. Use <code>record class</code> (or just <code>record</code>) for larger data objects or when you need inheritance.
    </p>

    <h2>Can records inherit from other types?</h2>
    <p>
      Record classes support <strong>inheritance from other record classes</strong>. There are important restrictions:
    </p>
    <ul>
      <li>A record class <strong>can</strong> inherit from another record class.</li>
      <li>A record class <strong>cannot</strong> inherit from a regular class.</li>
      <li>A regular class <strong>cannot</strong> inherit from a record class.</li>
      <li>Record structs <strong>cannot</strong> inherit from anything (structs never support inheritance).</li>
    </ul>
    <pre className={styles.code}>{`public record Animal(string Name);
public record Dog(string Name, string Breed) : Animal(Name);

var dog = new Dog("Rex", "Labrador");
Console.WriteLine(dog); // Dog { Name = Rex, Breed = Labrador }`}</pre>
    <p>
      Value equality in derived records includes all properties from the base record. Two <code>Dog</code> instances are only equal if both <code>Name</code> and <code>Breed</code> match, and both are of type <code>Dog</code> at runtime.
    </p>

    <div className={styles.callout}>
      <strong>Note:</strong> Record immutability is <em>shallow</em>. If a record property holds a reference type (like a <code>List&lt;string&gt;</code>), the reference itself cannot be reassigned after construction - but the contents of the list can still be changed. For deep immutability, use immutable collection types.
    </div>

    <h2>When should you use records vs classes?</h2>
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr><th>Use records when...</th><th>Use classes when...</th></tr>
        </thead>
        <tbody>
          <tr><td>The type's primary purpose is storing data</td><td>The type has behavior and mutable state</td></tr>
          <tr><td>Two instances with the same values should be equal</td><td>Identity matters - two objects with the same data are different things</td></tr>
          <tr><td>You want immutability by default</td><td>You need to change properties after construction freely</td></tr>
          <tr><td>You want auto-generated ToString for logging or debugging</td><td>You need custom ToString logic</td></tr>
          <tr><td>You are modeling DTOs, API responses, domain value objects</td><td>You are modeling entities, services, or domain aggregates</td></tr>
        </tbody>
      </table>
    </div>
    <p>
      A good rule of thumb: if you find yourself writing <code>new MyClass { ... }</code> just to hold some data and pass it around, a record is probably the better fit.
    </p>

    <h2>Frequently asked questions</h2>
    <div className={styles.faq}>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>When were records introduced in C#?</strong>
        <p className={styles.faqA}>Record classes were introduced in C# 9 (released with .NET 5 in November 2020). Record structs and readonly record structs were added in C# 10 (released with .NET 6 in November 2021).</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Are records immutable in C#?</strong>
        <p className={styles.faqA}>Positional record class properties are init-only by default, meaning they cannot be changed after the object is constructed. However, you can declare a record with mutable set properties if needed. Record structs are mutable by default - use readonly record struct for immutability.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What does the with expression do?</strong>
        <p className={styles.faqA}>A with expression creates a new record instance that is a shallow copy of an existing one, with one or more properties changed. The original is never modified. For example: var updated = original with {"{ Name = \"New Name\" }"};</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Can I use a record as a dictionary key?</strong>
        <p className={styles.faqA}>Yes. Because records implement value equality and override GetHashCode, two records with the same data produce the same hash code and are treated as equal keys in a dictionary.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What is the difference between record and record class?</strong>
        <p className={styles.faqA}>They are identical. The record keyword on its own defines a reference type, which is the same as writing record class explicitly. The explicit record class form was introduced in C# 10 to make the distinction from record struct clearer.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Can a regular class inherit from a record?</strong>
        <p className={styles.faqA}>No. A regular class cannot inherit from a record, and a record cannot inherit from a regular class. Records can only inherit from other records.</p>
      </div>
    </div>

    <h2>Official resources</h2>
    <ul>
      <li><a href="https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/record" target="_blank" rel="noopener noreferrer" className={styles.link}>Records - C# reference - Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/records" target="_blank" rel="noopener noreferrer" className={styles.link}>C# record types - Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-9" target="_blank" rel="noopener noreferrer" className={styles.link}>What's new in C# 9 - Microsoft Learn</a></li>
      <li><a href="https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/" target="_blank" rel="noopener noreferrer" className={styles.link}>Classes, structs, and records - Microsoft Learn</a></li>
    </ul>

  </div>
);

export default CsharpRecordsVsClasses;
