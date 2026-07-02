import React from 'react';
import styles from './Article.module.css';

const PythonMultipleInheritance = () => (
  <div className={styles.article}>

    <div className={styles.quickAnswer}>
      <strong>Quick answer:</strong> Python supports multiple inheritance - a class can inherit from more than one parent. The order in which parent classes are searched is determined by the <strong>Method Resolution Order (MRO)</strong>, computed with the C3 linearization algorithm. The most practical use case is the <strong>Mixin pattern</strong> - small, focused classes that add specific behaviour without being a full base class.
    </div>

    <p className={styles.lead}>
      Multiple inheritance is one of those Python features that looks dangerous at first glance and genuinely is if you use it carelessly. But it is also behind one of the most useful patterns in Python - Mixins. Understanding how Python resolves method calls across multiple parents is the difference between writing clean, composable code and creating a maintenance nightmare.
    </p>

    <h2>What is multiple inheritance in Python?</h2>
    <p>
      In Python, a class can inherit from more than one parent class by listing them all in the class definition. The subclass gets access to the attributes and methods of all parents.
    </p>
    <pre className={styles.code}>{`class Flyable:
    def fly(self):
        return "I can fly"

class Swimmable:
    def swim(self):
        return "I can swim"

class Duck(Flyable, Swimmable):
    def quack(self):
        return "Quack"

duck = Duck()
print(duck.fly())    # I can fly
print(duck.swim())   # I can swim
print(duck.quack())  # Quack`}</pre>
    <p>
      The order of parent classes in the definition matters - it determines how Python searches for methods and attributes when there is a conflict.
    </p>

    <h2>What is the Method Resolution Order (MRO)?</h2>
    <p>
      The MRO is the order in which Python searches through a class and its parent classes when looking up a method or attribute. Python computes it using the <strong>C3 linearization algorithm</strong>, which guarantees a consistent, predictable order.
    </p>
    <p>
      You can inspect the MRO of any class with <code>.__mro__</code> or <code>mro()</code>:
    </p>
    <pre className={styles.code}>{`class A:
    def hello(self):
        return "Hello from A"

class B(A):
    def hello(self):
        return "Hello from B"

class C(A):
    def hello(self):
        return "Hello from C"

class D(B, C):
    pass

print(D.__mro__)
# (<class 'D'>, <class 'B'>, <class 'C'>, <class 'A'>, <class 'object'>)

d = D()
print(d.hello())  # Hello from B - D searches B before C`}</pre>
    <p>
      The MRO always follows the same rules: start with the class itself, then follow the order of parent classes left to right, and ensure each class appears only once.
    </p>
    <div className={styles.callout}>
      <strong>Rule of thumb:</strong> when Python cannot compute a consistent MRO, it raises a <code>TypeError</code> at class definition time. If you see that error, your inheritance hierarchy has a contradiction and needs to be redesigned.
    </div>

    <h2>What is the diamond problem and how does Python solve it?</h2>
    <p>
      The diamond problem occurs when two parent classes share a common ancestor, creating an ambiguity about which version of an inherited method to use.
    </p>
    <pre className={styles.code}>{`class Animal:
    def speak(self):
        return "..."

class Dog(Animal):
    def speak(self):
        return "Woof"

class Robot(Animal):
    def speak(self):
        return "Beep"

class RobotDog(Dog, Robot):  # diamond - both Dog and Robot inherit from Animal
    pass

print(RobotDog.__mro__)
# (<class 'RobotDog'>, <class 'Dog'>, <class 'Robot'>, <class 'Animal'>, <class 'object'>)

rd = RobotDog()
print(rd.speak())  # Woof - Dog comes before Robot in the MRO`}</pre>
    <p>
      Python solves the diamond problem with C3 linearization: <code>Animal</code> appears only once at the end of the MRO, after all its subclasses. There is no ambiguity - the search order is deterministic.
    </p>

    <h2>How does super() work with multiple inheritance?</h2>
    <p>
      In single inheritance, <code>super()</code> is straightforward - it calls the parent class. In multiple inheritance, <code>super()</code> calls the <em>next class in the MRO</em>, not the direct parent. This is what makes cooperative multiple inheritance possible.
    </p>
    <pre className={styles.code}>{`class A:
    def process(self):
        print("A.process")

class B(A):
    def process(self):
        print("B.process")
        super().process()  # calls C.process next, not A.process

class C(A):
    def process(self):
        print("C.process")
        super().process()  # calls A.process

class D(B, C):
    def process(self):
        print("D.process")
        super().process()  # calls B.process next

d = D()
d.process()
# D.process
# B.process
# C.process
# A.process`}</pre>
    <p>
      Each <code>super()</code> call follows the MRO chain. <code>B.process</code> does not call <code>A.process</code> directly - it calls whatever comes next in the MRO of the actual instance, which is <code>C</code>. This is called <strong>cooperative multiple inheritance</strong> and only works when every class in the chain uses <code>super()</code> consistently.
    </p>
    <div className={styles.callout}>
      <strong>Important:</strong> cooperative multiple inheritance only works if every class in the hierarchy uses <code>super()</code>. One class that skips <code>super()</code> breaks the chain and the remaining classes in the MRO are never called.
    </div>

    <h2>When should you use multiple inheritance? The Mixin pattern</h2>
    <p>
      The most practical and well-accepted use of multiple inheritance in Python is the <strong>Mixin pattern</strong>. A Mixin is a small class that adds a specific, self-contained behaviour to another class without being a standalone base class.
    </p>
    <pre className={styles.code}>{`class JsonSerializableMixin:
    def to_json(self):
        import json
        return json.dumps(self.__dict__)

class TimestampMixin:
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from datetime import datetime
        self.created_at = datetime.utcnow().isoformat()

class LoggableMixin:
    def log(self, message):
        print(f"[{self.__class__.__name__}] {message}")

class User(TimestampMixin, JsonSerializableMixin, LoggableMixin):
    def __init__(self, name, email):
        super().__init__()
        self.name = name
        self.email = email

user = User("Viorel", "viorel@example.com")
user.log("User created")          # [User] User created
print(user.to_json())             # {"created_at": "...", "name": "Viorel", "email": "..."}
print(user.created_at)            # timestamp set automatically`}</pre>
    <p>
      Mixins are additive - each one brings exactly one capability. They do not store shared state and are not meant to be instantiated alone. The naming convention <code>XMixin</code> or <code>XMixIn</code> makes it clear they are not standalone classes.
    </p>
    <p>
      Django uses this pattern extensively - <code>LoginRequiredMixin</code>, <code>PermissionRequiredMixin</code>, <code>UserPassesTestMixin</code> are all Mixins that add access control to class-based views.
    </p>

    <h2>When should you avoid multiple inheritance?</h2>
    <p>
      Multiple inheritance becomes a problem when:
    </p>
    <ul>
      <li><strong>Parent classes share state.</strong> If two parents both define <code>__init__</code> and store instance variables with the same names, you will get conflicts that are hard to debug.</li>
      <li><strong>Not all classes use super() consistently.</strong> One class that calls the parent directly instead of using <code>super()</code> breaks cooperative inheritance for the entire hierarchy.</li>
      <li><strong>The hierarchy is deep and wide.</strong> When a class has many parents, each with their own parents, the MRO becomes difficult to reason about and errors are hard to trace.</li>
      <li><strong>You are modelling "is-a" relationships with multiple parents.</strong> If you find yourself thinking "this thing is both an A and a B", often composition is the better answer.</li>
    </ul>
    <pre className={styles.code}>{`# Prefer composition over deep multiple inheritance for "is-a" hierarchies
class EmailSender:
    def send(self, to, subject, body): ...

class SmsSender:
    def send(self, to, message): ...

# BAD - both have a send() method with different signatures
class NotificationService(EmailSender, SmsSender):
    pass

# BETTER - composition, explicit and clear
class NotificationService:
    def __init__(self):
        self.email = EmailSender()
        self.sms = SmsSender()

    def notify_by_email(self, to, subject, body):
        self.email.send(to, subject, body)

    def notify_by_sms(self, to, message):
        self.sms.send(to, message)`}</pre>

    <h2>When should you use each approach?</h2>
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Scenario</th>
            <th>Recommended approach</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Adding reusable, self-contained behaviour (logging, serialisation, timestamps)</td>
            <td>Mixin with multiple inheritance</td>
          </tr>
          <tr>
            <td>Sharing state or complex <code>__init__</code> logic between parents</td>
            <td>Single inheritance or composition</td>
          </tr>
          <tr>
            <td>Modelling "is-a" with two unrelated parents</td>
            <td>Composition</td>
          </tr>
          <tr>
            <td>Framework hooks (Django views, Flask extensions)</td>
            <td>Mixin with multiple inheritance (follow framework convention)</td>
          </tr>
          <tr>
            <td>Deep hierarchy with more than 3-4 levels</td>
            <td>Refactor to composition</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2>Frequently asked questions</h2>
    <div className={styles.faq}>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What is the C3 linearization algorithm?</strong>
        <p className={styles.faqA}>C3 linearization is the algorithm Python uses to compute the MRO. It guarantees that a class always appears before its parents in the MRO, and that the order of parents is preserved as declared. If no consistent order can be computed, Python raises a TypeError at class definition time.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What is the difference between a Mixin and a base class?</strong>
        <p className={styles.faqA}>A base class defines the core identity of a subclass - it is the "is-a" relationship. A Mixin adds a specific capability without defining identity. Mixins are not meant to be instantiated alone, they are usually small, and they do not define the primary type of the class that uses them.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Does the order of parent classes in the definition matter?</strong>
        <p className={styles.faqA}>Yes. The order determines the MRO. Python searches parent classes left to right when looking up methods. If two parents define the same method, the one listed first wins. Always list the most specific class first and the most general last.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Can Python raise an error from multiple inheritance?</strong>
        <p className={styles.faqA}>Yes. If Python cannot compute a consistent MRO - for example, if the inheritance order contradicts itself - it raises a TypeError: "Cannot create a consistent method resolution order." This happens at class definition time, not at runtime.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>How is multiple inheritance different in Python vs other languages?</strong>
        <p className={styles.faqA}>Java and C# do not support multiple inheritance for classes at all - they use interfaces instead. C++ supports it but without a standard resolution algorithm, which makes the diamond problem much harder to manage. Python's C3 MRO gives a predictable, deterministic resolution order.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Is multiple inheritance used in real Python frameworks?</strong>
        <p className={styles.faqA}>Yes, extensively. Django's class-based views use Mixins for access control (LoginRequiredMixin, PermissionRequiredMixin). Python's standard library uses them too - for example, socketserver.ThreadingMixIn and socketserver.ForkingMixIn add concurrency behaviour to server classes.</p>
      </div>
    </div>

    <h2>Official resources</h2>
    <ul>
      <li><a href="https://docs.python.org/3/tutorial/classes.html#multiple-inheritance" target="_blank" rel="noopener noreferrer" className={styles.link}>Multiple Inheritance - Python Docs</a></li>
      <li><a href="https://docs.python.org/3/library/functions.html#super" target="_blank" rel="noopener noreferrer" className={styles.link}>super() built-in - Python Docs</a></li>
      <li><a href="https://www.python.org/download/releases/2.3/mro/" target="_blank" rel="noopener noreferrer" className={styles.link}>The Python 2.3 Method Resolution Order - Python.org</a></li>
    </ul>

  </div>
);

export default PythonMultipleInheritance;
