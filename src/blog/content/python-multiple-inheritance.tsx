import React from 'react';
import styles from './Article.module.css';

const PythonMultipleInheritance = () => (
  <div className={styles.article}>

    <div className={styles.quickAnswer}>
      <strong>Quick answer:</strong> Python supports four types of inheritance - <strong>simple</strong> (one parent), <strong>chain</strong> (a subclass becomes a parent itself), <strong>hierarchical</strong> (multiple subclasses from the same parent), and <strong>multiple</strong> (one class inherits from more than one parent). When method names conflict in multiple inheritance, Python uses the <strong>MRO</strong> (Method Resolution Order) to decide which version to call.
    </div>

    <p className={styles.lead}>
      When you start working with classes, inheritance feels like a simple concept - one class extends another and that is it. But as systems grow, the relationships between classes naturally become richer. You end up with deeper hierarchies, branching structures, and classes that combine behaviour from multiple sources. Python handles all of these cases, and understanding each form of inheritance helps you build code that is flexible, clean, and easy to extend.
    </p>

    <h2>What is simple inheritance?</h2>
    <p>
      Simple inheritance is the most basic form - one base class, one subclass. The subclass gets everything the parent has and can add or override whatever it needs.
    </p>
    <p>
      Imagine a notification system. We have a general <code>Notification</code> class that stores a title and a message. Then we create an <code>EmailNotification</code> subclass that adds a recipient address and a method to send the email.
    </p>
    <pre className={styles.code}>{`class Notification:
    def __init__(self, title, message):
        self.title = title
        self.message = message

    def summary(self):
        print(f"[{self.title}] {self.message}")


class EmailNotification(Notification):
    def __init__(self, title, message, recipient):
        super().__init__(title, message)
        self.recipient = recipient

    def send(self):
        print(f"Sending email to {self.recipient}:")
        self.summary()


n = EmailNotification("Welcome", "Thanks for signing up!", "user@example.com")
n.send()`}</pre>
    <p>Output:</p>
    <pre className={styles.code}>{`Sending email to user@example.com:
[Welcome] Thanks for signing up!`}</pre>
    <p>
      <code>EmailNotification</code> does not redefine <code>summary()</code> because it does not need to - it works perfectly as inherited. It only adds what is specific to email: a recipient and a <code>send()</code> method.
    </p>
    <p>
      Here is another example. A <code>Product</code> class holds the name and price of any product. A <code>DigitalProduct</code> inherits from it and adds a download link - the only thing that makes a digital product different:
    </p>
    <pre className={styles.code}>{`class Product:
    def __init__(self, name, price):
        self.name = name
        self.price = price

    def display(self):
        print(f"{self.name} - ${self.price}")


class DigitalProduct(Product):
    def __init__(self, name, price, download_url):
        super().__init__(name, price)
        self.download_url = download_url

    def display(self):
        super().display()
        print(f"Download: {self.download_url}")


p = DigitalProduct("Python Course", 49, "https://example.com/download/python-course")
p.display()`}</pre>
    <p>Output:</p>
    <pre className={styles.code}>{`Python Course - $49
Download: https://example.com/download/python-course`}</pre>
    <p>
      <code>display()</code> is extended here, not replaced. We call the parent version first with <code>super()</code>, then add the download link. If <code>Product.display()</code> ever changes, <code>DigitalProduct</code> stays compatible automatically.
    </p>
    <p>
      A <code>DigitalProduct</code> is a <code>Product</code> - just one that knows more things. The code reflects exactly that idea, without duplication.
    </p>

    <h2>What is chain inheritance?</h2>
    <p>
      Things get more interesting when a subclass itself becomes a parent. This is chain inheritance (also called multilevel inheritance). The relationship goes downward like a family tree - each level inherits everything from the one above and adds something new.
    </p>
    <p>Consider this structure:</p>
    <ul>
      <li><code>Person</code> is the base class, storing a name.</li>
      <li><code>Employee</code> inherits from <code>Person</code> and adds a job title.</li>
      <li><code>Manager</code> inherits from <code>Employee</code> and adds a team size.</li>
    </ul>
    <pre className={styles.code}>{`class Person:
    def __init__(self, name):
        self.name = name

    def introduce(self):
        print(f"Hi, I'm {self.name}.")


class Employee(Person):
    def __init__(self, name, title):
        super().__init__(name)
        self.title = title

    def introduce(self):
        super().introduce()
        print(f"I work as an {self.title}.")


class Manager(Employee):
    def __init__(self, name, title, team_size):
        super().__init__(name, title)
        self.team_size = team_size

    def introduce(self):
        super().introduce()
        print(f"I manage a team of {self.team_size} people.")


m = Manager("Sarah", "Engineering Manager", 8)
m.introduce()`}</pre>
    <p>Output:</p>
    <pre className={styles.code}>{`Hi, I'm Sarah.
I work as an Engineering Manager.
I manage a team of 8 people.`}</pre>
    <p>
      Each level adds depth while keeping everything from the levels above. <code>super()</code> ensures the chain is called in order, so no information is lost.
    </p>

    <h2>What is hierarchical inheritance?</h2>
    <p>
      In real life, one base concept can branch in multiple directions. Hierarchical inheritance is exactly that - several subclasses all inheriting from the same parent, each going their own way.
    </p>
    <p>
      A payment system is a good example. A <code>Payment</code> base class holds the amount and a method to show it. Then <code>CardPayment</code>, <code>CashPayment</code>, and <code>BankTransfer</code> all inherit from it, each adding their own logic:
    </p>
    <pre className={styles.code}>{`class Payment:
    def __init__(self, amount):
        self.amount = amount

    def display(self):
        print(f"Payment of ${self.amount}")


class CardPayment(Payment):
    def __init__(self, amount, card_last4):
        super().__init__(amount)
        self.card_last4 = card_last4

    def display(self):
        super().display()
        print(f"Paid by card ending in {self.card_last4}")


class CashPayment(Payment):
    def display(self):
        super().display()
        print("Paid in cash")


class BankTransfer(Payment):
    def __init__(self, amount, iban):
        super().__init__(amount)
        self.iban = iban

    def display(self):
        super().display()
        print(f"Transferred to IBAN: {self.iban}")


payments = [
    CardPayment(120, "4242"),
    CashPayment(35),
    BankTransfer(500, "RO49AAAA1B31007593840000"),
]

for p in payments:
    p.display()
    print()`}</pre>
    <p>
      All three classes share the common foundation from <code>Payment</code>. Each one then adds its own rules. This structure works well whenever you have a clear common base and multiple specialisations that go in different directions.
    </p>
    <div className={styles.callout}>
      <strong>Pattern recognition:</strong> when you have a parent class with clearly defined shared rules and multiple subclasses that each add their own behaviour, you have hierarchical inheritance. It is one of the cleanest and most maintainable structures in OOP.
    </div>

    <h2>What is multiple inheritance?</h2>
    <p>
      Multiple inheritance allows a class to inherit from more than one parent at the same time, combining behaviour from different sources. It is powerful, but needs to be used carefully.
    </p>
    <p>
      Imagine a reporting system. We have a <code>Trackable</code> class that logs when an object was last updated, and an <code>Exportable</code> class that knows how to export data as CSV. A <code>Report</code> class needs both:
    </p>
    <pre className={styles.code}>{`class Trackable:
    def mark_updated(self):
        from datetime import datetime, timezone
        self.updated_at = datetime.now(timezone.utc).isoformat()
        print(f"Updated at {self.updated_at}")


class Exportable:
    def export_csv(self):
        print(f"Exporting {self.__class__.__name__} as CSV...")


class Report(Trackable, Exportable):
    def __init__(self, title):
        self.title = title

    def generate(self):
        print(f"Generating report: {self.title}")
        self.mark_updated()


r = Report("Monthly Sales")
r.generate()
r.export_csv()`}</pre>
    <p>Output:</p>
    <pre className={styles.code}>{`Generating report: Monthly Sales
Updated at 2026-07-02T10:30:00.123456+00:00
Exporting Report as CSV...`}</pre>
    <p>
      <code>Report</code> gets the full behaviour of both parent classes. The order of parents in the class definition (<code>Trackable</code> before <code>Exportable</code>) matters - it determines the search order when methods have the same name.
    </p>

    <h2>What is the MRO and how does Python resolve conflicts?</h2>
    <p>
      Everything looks simple until two parent classes define the same method with different implementations. Python needs a clear rule to decide which version to call. That rule is the <strong>MRO - Method Resolution Order</strong>.
    </p>
    <p>
      Think of MRO as a search path. When you call a method, Python walks down that path and uses the first matching version it finds. The path is computed automatically using the <strong>C3 linearization algorithm</strong>, which guarantees a consistent and predictable order.
    </p>
    <pre className={styles.code}>{`class A:
    def process(self):
        print("A")

class B(A):
    def process(self):
        print("B")

class C(A):
    def process(self):
        print("C")

class D(B, C):
    pass

print(D.__mro__)
# (<class 'D'>, <class 'B'>, <class 'C'>, <class 'A'>, <class 'object'>)

d = D()
d.process()  # B - because B comes before C in the MRO`}</pre>
    <p>
      Python searches in this order: <code>D</code> first, then <code>B</code>, then <code>C</code>, then <code>A</code>. The left parent always has priority, but each class appears only once in the chain. You can inspect the MRO of any class with <code>ClassName.__mro__</code>.
    </p>
    <div className={styles.callout}>
      <strong>Why super() is preferred:</strong> in multiple inheritance, <code>super()</code> does not call the direct parent - it calls the <em>next class in the MRO</em>. This is what makes cooperative inheritance work. If every class in the chain uses <code>super()</code> consistently, all of them get called in the right order. One class that skips <code>super()</code> silently breaks the chain.
    </div>

    <h2>When should you use inheritance vs composition?</h2>
    <p>
      Inheritance is not the right tool for every relationship between classes. Before reaching for it, ask: does class B have an "is a type of" relationship with class A? If yes, inheritance makes sense. If not, prefer composition.
    </p>
    <ul>
      <li>A <code>Manager</code> is an <code>Employee</code> - inheritance makes sense.</li>
      <li>A <code>CardPayment</code> is a <code>Payment</code> - inheritance makes sense.</li>
      <li>A <code>NotificationService</code> uses an <code>EmailSender</code> - composition makes sense.</li>
    </ul>
    <pre className={styles.code}>{`# BAD - multiple inheritance with conflicting method signatures
class EmailSender:
    def send(self, to, subject, body): ...

class SmsSender:
    def send(self, to, message): ...

class NotificationService(EmailSender, SmsSender):  # which send()?
    pass

# BETTER - composition, clear and explicit
class NotificationService:
    def __init__(self):
        self.email = EmailSender()
        self.sms = SmsSender()

    def notify_email(self, to, subject, body):
        self.email.send(to, subject, body)

    def notify_sms(self, to, message):
        self.sms.send(to, message)`}</pre>
    <p>
      Multiple inheritance works best for Mixins - small, focused classes that add a single, self-contained behaviour (logging, serialisation, timestamps). It becomes a problem when parent classes share state, have conflicting method signatures, or when the hierarchy becomes too deep to reason about.
    </p>

    <h2>Frequently asked questions</h2>
    <div className={styles.faq}>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What are the four types of inheritance in Python?</strong>
        <p className={styles.faqA}>Simple (one parent, one subclass), chain or multilevel (a subclass becomes a parent itself), hierarchical (multiple subclasses from the same parent), and multiple (one class inherits from more than one parent).</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What is the MRO in Python?</strong>
        <p className={styles.faqA}>The Method Resolution Order is the search path Python follows when looking up a method in a class hierarchy. It is computed automatically using the C3 linearization algorithm and guarantees a consistent, predictable order. You can inspect it with ClassName.__mro__.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Does the order of parent classes in multiple inheritance matter?</strong>
        <p className={styles.faqA}>Yes. The order in the class definition determines the MRO. Python searches parent classes left to right. If two parents define the same method, the one listed first wins. Always put the most specific class first.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Why should I use super() instead of calling the parent class directly?</strong>
        <p className={styles.faqA}>In multiple inheritance, super() calls the next class in the MRO, not necessarily the direct parent. This is what makes cooperative inheritance work - all classes in the chain get called in the right order. Calling a parent class directly by name breaks this and can silently skip parts of the hierarchy.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>When should I use multiple inheritance?</strong>
        <p className={styles.faqA}>The safest and most common use case is the Mixin pattern - small classes that add one specific capability (logging, serialisation, timestamps) without defining a primary identity. Avoid multiple inheritance when parent classes share state, have conflicting methods, or when the combination does not have a clear conceptual meaning.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What is the difference between chain inheritance and hierarchical inheritance?</strong>
        <p className={styles.faqA}>Chain (multilevel) inheritance goes vertically - A inherits from B, and B inherits from C, forming a single line. Hierarchical inheritance goes horizontally - multiple classes all inherit from the same single parent, branching out in different directions.</p>
      </div>
    </div>

    <h2>Official resources</h2>
    <ul>
      <li><a href="https://docs.python.org/3/tutorial/classes.html#inheritance" target="_blank" rel="noopener noreferrer" className={styles.link}>Inheritance - Python Docs</a></li>
      <li><a href="https://docs.python.org/3/tutorial/classes.html#multiple-inheritance" target="_blank" rel="noopener noreferrer" className={styles.link}>Multiple Inheritance - Python Docs</a></li>
      <li><a href="https://docs.python.org/3/library/functions.html#super" target="_blank" rel="noopener noreferrer" className={styles.link}>super() built-in - Python Docs</a></li>
      <li><a href="https://www.python.org/download/releases/2.3/mro/" target="_blank" rel="noopener noreferrer" className={styles.link}>The Python 2.3 Method Resolution Order - Python.org</a></li>
    </ul>

  </div>
);

export default PythonMultipleInheritance;
