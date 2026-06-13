import React from 'react';
import styles from './Article.module.css';

const PythonTypeHintsExplained = () => (
  <div className={styles.article}>

    <div className={styles.quickAnswer}>
      <strong>Quick answer:</strong> Python type hints let you annotate functions, variables, and classes with expected types. Python does <strong>not enforce them at runtime</strong> - they exist for your IDE, linters, and static type checkers like mypy. Add them with a colon after the parameter name and an arrow for the return type: <code>def greet(name: str) -&gt; str:</code>
    </div>

    <p className={styles.lead}>
      When I started working on larger Python projects, I found myself spending too much time hunting down bugs caused by the wrong type being passed to a function. Type hints changed that. They make intent explicit, unlock better autocomplete in editors, and let tools like mypy flag errors before you even run the code. This article walks through the core syntax, the most useful types, and what has changed across recent Python versions.
    </p>

    <h2>What are Python type hints?</h2>
    <p>
      Type hints are annotations you add to Python code to describe the expected types of variables, function parameters, and return values. They were introduced in <strong>Python 3.5</strong> through <a href="https://peps.python.org/pep-0484/" target="_blank" rel="noopener noreferrer" className={styles.link}>PEP 484</a>.
    </p>
    <p>
      Python is still a dynamically typed language - the runtime does not check or enforce these annotations. Type hints are read by:
    </p>
    <ul>
      <li>Static type checkers like <strong>mypy</strong> and <strong>Pyright</strong></li>
      <li>IDEs (VS Code, PyCharm) for autocomplete and inline error highlighting</li>
      <li>Linters and code quality tools</li>
      <li>Other developers reading your code</li>
    </ul>

    <h2>How do you add type hints to a function?</h2>
    <p>
      You annotate each parameter with a colon followed by the type, and the return type with an arrow (<code>-&gt;</code>) after the closing parenthesis:
    </p>
    <pre className={styles.code}>{`def greet(name: str) -> str:
    return "Hello, " + name

def add(x: int, y: int) -> int:
    return x + y

def is_even(n: int) -> bool:
    return n % 2 == 0`}</pre>
    <p>
      Variable annotations, introduced in <a href="https://peps.python.org/pep-0526/" target="_blank" rel="noopener noreferrer" className={styles.link}>PEP 526</a> (Python 3.6), use the same colon syntax:
    </p>
    <pre className={styles.code}>{`count: int = 0
name: str = "Viorel"
scores: list[int] = [95, 87, 92]`}</pre>
    <p>
      You can annotate a variable without assigning a value - this is called a <strong>declaration without assignment</strong>:
    </p>
    <pre className={styles.code}>{`user_id: int  # declared but not yet assigned`}</pre>

    <h2>What types does the typing module provide?</h2>
    <p>
      For built-in types like <code>int</code>, <code>str</code>, <code>float</code>, and <code>bool</code>, you write them directly. For container types and special forms, Python provides the <code>typing</code> module.
    </p>
    <p>
      Since <strong>Python 3.9</strong> (<a href="https://peps.python.org/pep-0585/" target="_blank" rel="noopener noreferrer" className={styles.link}>PEP 585</a>), you can use built-in collection types directly as generics instead of importing from <code>typing</code>:
    </p>
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Type</th>
            <th>Before Python 3.9</th>
            <th>Python 3.9+</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>List of strings</td><td><code>List[str]</code></td><td><code>list[str]</code></td></tr>
          <tr><td>Dict of str to int</td><td><code>Dict[str, int]</code></td><td><code>dict[str, int]</code></td></tr>
          <tr><td>Tuple of two ints</td><td><code>Tuple[int, int]</code></td><td><code>tuple[int, int]</code></td></tr>
          <tr><td>Set of floats</td><td><code>Set[float]</code></td><td><code>set[float]</code></td></tr>
          <tr><td>Optional string</td><td><code>Optional[str]</code></td><td><code>str | None</code></td></tr>
          <tr><td>String or int</td><td><code>Union[str, int]</code></td><td><code>str | int</code></td></tr>
        </tbody>
      </table>
    </div>
    <pre className={styles.code}>{`# Python 3.9+ - no typing import needed for these
def process(items: list[str]) -> dict[str, int]:
    return {item: len(item) for item in items}

# Python 3.8 and earlier - import from typing
from typing import List, Dict
def process(items: List[str]) -> Dict[str, int]:
    return {item: len(item) for item in items}`}</pre>

    <h2>What is Optional in Python type hints?</h2>
    <p>
      <code>Optional[X]</code> means the value can be either type <code>X</code> or <code>None</code>. It is equivalent to <code>Union[X, None]</code>. Use it when a function parameter or return value can be absent:
    </p>
    <pre className={styles.code}>{`from typing import Optional

def find_user(user_id: int) -> Optional[str]:
    if user_id == 1:
        return "Viorel"
    return None  # user not found`}</pre>
    <p>
      In <strong>Python 3.10+</strong>, you can use the shorter <code>X | None</code> syntax introduced by <a href="https://peps.python.org/pep-0604/" target="_blank" rel="noopener noreferrer" className={styles.link}>PEP 604</a>:
    </p>
    <pre className={styles.code}>{`# Python 3.10+ - no import needed
def find_user(user_id: int) -> str | None:
    if user_id == 1:
        return "Viorel"
    return None`}</pre>

    <h2>What is the Any type?</h2>
    <p>
      <code>Any</code> is a special type that is compatible with every other type. A value annotated as <code>Any</code> can be assigned anything, and a type checker will not check operations on it. Use it sparingly - overusing <code>Any</code> defeats the purpose of type hints:
    </p>
    <pre className={styles.code}>{`from typing import Any

def legacy_helper(data: Any) -> None:
    # no type checking on data
    print(data)`}</pre>

    <div className={styles.callout}>
      <strong>Important:</strong> Python does <em>not</em> enforce type hints at runtime. Passing the wrong type to an annotated function raises no error unless you add explicit validation or use a library like <strong>Pydantic</strong>. Type hints exist for static analysis tools, IDEs, and documentation - not runtime guards.
    </div>

    <h2>What changed in Python 3.9, 3.10, and 3.12?</h2>
    <p>
      Python has been steadily improving type hint syntax to make it more readable and less verbose:
    </p>
    <pre className={styles.code}>{`# Python 3.9 - built-in generics (PEP 585)
# No need to import List, Dict, Tuple from typing
scores: list[int] = [10, 20, 30]
config: dict[str, str] = {"env": "production"}

# Python 3.10 - union with | operator (PEP 604)
def process(value: int | str) -> str:
    return str(value)

# Python 3.12 - new TypeVar syntax (PEP 695)
# Old way:
from typing import TypeVar
T = TypeVar("T")
def first(items: list[T]) -> T:
    return items[0]

# New way (Python 3.12+):
def first[T](items: list[T]) -> T:
    return items[0]`}</pre>
    <p>
      PEP 695 also introduced a new <code>type</code> statement for type aliases in Python 3.12:
    </p>
    <pre className={styles.code}>{`# Python 3.12+ - type alias (PEP 695)
type Vector = list[float]

# Before Python 3.12:
from typing import TypeAlias
Vector: TypeAlias = list[float]`}</pre>

    <h2>How do you add type hints to a class?</h2>
    <p>
      Annotate instance variables in <code>__init__</code> or directly in the class body. Use <code>self</code> normally - you do not annotate <code>self</code> itself:
    </p>
    <pre className={styles.code}>{`class User:
    name: str
    age: int
    email: str | None

    def __init__(self, name: str, age: int, email: str | None = None) -> None:
        self.name = name
        self.age = age
        self.email = email

    def display_name(self) -> str:
        return self.name.upper()`}</pre>
    <p>
      The return type of <code>__init__</code> is always <code>None</code> - it never returns a value.
    </p>

    <h2>When should you use type hints?</h2>
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr><th>Use type hints when...</th><th>You might skip them when...</th></tr>
        </thead>
        <tbody>
          <tr><td>Working in a team or on shared codebases</td><td>Writing quick one-off scripts</td></tr>
          <tr><td>Building libraries or public APIs</td><td>The code is short and types are obvious</td></tr>
          <tr><td>Running mypy or Pyright in CI</td><td>Rapid prototyping early in development</td></tr>
          <tr><td>Wanting better IDE autocomplete and refactoring</td><td>Working in a legacy codebase with no type stubs</td></tr>
          <tr><td>Using Pydantic, FastAPI, or dataclasses</td><td>-</td></tr>
        </tbody>
      </table>
    </div>
    <p>
      A practical approach: start by annotating function signatures. This gives you most of the benefit - better documentation, IDE support, and type checker coverage - without annotating every variable in every function body.
    </p>

    <h2>Frequently asked questions</h2>
    <div className={styles.faq}>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Does Python enforce type hints at runtime?</strong>
        <p className={styles.faqA}>No. Python does not check or enforce type annotations during execution. Passing the wrong type raises no error unless you add explicit validation. Type hints exist for static analysis tools, IDEs, and documentation.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>When were Python type hints introduced?</strong>
        <p className={styles.faqA}>Type hints were introduced in Python 3.5 via PEP 484. Variable annotations were added in Python 3.6 via PEP 526. The typing module provides Optional, Union, and other special forms.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What is the difference between Optional[str] and str | None?</strong>
        <p className={styles.faqA}>They are equivalent. Optional[str] is shorthand for Union[str, None]. The str | None syntax was introduced in Python 3.10 via PEP 604 as a cleaner alternative. Both mean the value can be a string or absent.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Do I still need to import from typing in Python 3.9+?</strong>
        <p className={styles.faqA}>Not for basic container types. Since Python 3.9, you can write list[str], dict[str, int], and tuple[int, ...] directly without importing List, Dict, or Tuple from typing. You still need to import Optional, Union, Any, TypeVar, and other special forms.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What is mypy and do I need it?</strong>
        <p className={styles.faqA}>Mypy is a static type checker for Python maintained by the Python community. It reads your type annotations and reports type errors without running your code. You do not need it to use type hints, but adding mypy to your CI pipeline makes type hints much more useful.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Can I add type hints to existing Python 2-style code?</strong>
        <p className={styles.faqA}>If you cannot change the source, you can provide type stubs - separate .pyi files that contain only type annotations. This is how popular libraries like requests provide type information for older code.</p>
      </div>
    </div>

    <h2>Official resources</h2>
    <ul>
      <li><a href="https://docs.python.org/3/library/typing.html" target="_blank" rel="noopener noreferrer" className={styles.link}>typing - Support for type hints - Python docs</a></li>
      <li><a href="https://peps.python.org/pep-0484/" target="_blank" rel="noopener noreferrer" className={styles.link}>PEP 484 - Type Hints - Python Enhancement Proposals</a></li>
      <li><a href="https://peps.python.org/pep-0526/" target="_blank" rel="noopener noreferrer" className={styles.link}>PEP 526 - Syntax for Variable Annotations - Python Enhancement Proposals</a></li>
      <li><a href="https://peps.python.org/pep-0585/" target="_blank" rel="noopener noreferrer" className={styles.link}>PEP 585 - Type Hinting Generics In Standard Collections - Python Enhancement Proposals</a></li>
      <li><a href="https://peps.python.org/pep-0604/" target="_blank" rel="noopener noreferrer" className={styles.link}>PEP 604 - Allow writing union types as X | Y - Python Enhancement Proposals</a></li>
      <li><a href="https://peps.python.org/pep-0695/" target="_blank" rel="noopener noreferrer" className={styles.link}>PEP 695 - Type Parameter Syntax - Python Enhancement Proposals</a></li>
      <li><a href="https://docs.python.org/3/howto/annotations.html" target="_blank" rel="noopener noreferrer" className={styles.link}>Annotations Best Practices - Python docs</a></li>
    </ul>

  </div>
);

export default PythonTypeHintsExplained;
