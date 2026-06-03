import React from 'react';
import styles from './Article.module.css';

const SqlJoins = () => (
  <div className={styles.article}>

    <div className={styles.quickAnswer}>
      <strong>Quick answer:</strong> <strong>INNER JOIN</strong> returns only rows that match in both tables. <strong>LEFT JOIN</strong> returns all rows from the left table, with NULLs where there is no match on the right. <strong>RIGHT JOIN</strong> is the mirror of LEFT JOIN. <strong>FULL OUTER JOIN</strong> returns all rows from both tables, with NULLs on either side where no match exists.
    </div>

    <p className={styles.lead}>
      SQL JOINs are one of the most important concepts in relational databases. Once you understand how each type works, writing complex queries becomes much easier. This article explains INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN and SELF JOIN with clear examples.
    </p>

    <h2>What is a SQL JOIN?</h2>
    <p>
      A JOIN combines rows from two or more tables based on a related column. For example, you might have an <strong>Employees</strong> table and a <strong>Departments</strong> table. A JOIN lets you query both tables together and see which employee belongs to which department.
    </p>
    <p>For all examples below, we will use these two tables:</p>

    <div className={styles.tableWrapper}>
      <p><strong>Employees</strong></p>
      <table className={styles.table}>
        <thead>
          <tr><th>id</th><th>name</th><th>department_id</th></tr>
        </thead>
        <tbody>
          <tr><td>1</td><td>Alice</td><td>10</td></tr>
          <tr><td>2</td><td>Bob</td><td>20</td></tr>
          <tr><td>3</td><td>Carol</td><td>NULL</td></tr>
        </tbody>
      </table>
    </div>

    <div className={styles.tableWrapper}>
      <p><strong>Departments</strong></p>
      <table className={styles.table}>
        <thead>
          <tr><th>id</th><th>name</th></tr>
        </thead>
        <tbody>
          <tr><td>10</td><td>Engineering</td></tr>
          <tr><td>20</td><td>Marketing</td></tr>
          <tr><td>30</td><td>HR</td></tr>
        </tbody>
      </table>
    </div>

    <h2>What does INNER JOIN return?</h2>
    <p>
      INNER JOIN returns only the rows where there is a match in both tables. You get one kind of row in the result:
    </p>
    <ul>
      <li><strong>Matched rows</strong> - where the join condition is true, columns from both tables are populated. Rows with no match on either side are excluded.</li>
    </ul>
    <pre className={styles.code}>{`SELECT e.name, d.name AS department
FROM Employees e
INNER JOIN Departments d ON e.department_id = d.id`}</pre>
    <div className={styles.tableWrapper}>
      <p><strong>Result</strong></p>
      <table className={styles.table}>
        <thead>
          <tr><th>name</th><th>department</th></tr>
        </thead>
        <tbody>
          <tr><td>Alice</td><td>Engineering</td></tr>
          <tr><td>Bob</td><td>Marketing</td></tr>
        </tbody>
      </table>
    </div>
    <p>
      Carol is excluded because her department_id is NULL. HR is excluded because no employee belongs to it. Only the intersection matters.
    </p>

    <h2>What does LEFT JOIN return?</h2>
    <p>
      LEFT JOIN returns all rows from the left table, matching them where it can. You get two kinds of rows in the result:
    </p>
    <ul>
      <li><strong>Matched rows</strong> - where the join condition is true, columns from both tables are populated (same as an INNER JOIN).</li>
      <li><strong>Unmatched left rows</strong> - rows from the left table with no match in the right table; the right table columns come back as NULL.</li>
    </ul>
    <pre className={styles.code}>{`SELECT e.name, d.name AS department
FROM Employees e
LEFT JOIN Departments d ON e.department_id = d.id`}</pre>
    <div className={styles.tableWrapper}>
      <p><strong>Result</strong></p>
      <table className={styles.table}>
        <thead>
          <tr><th>name</th><th>department</th></tr>
        </thead>
        <tbody>
          <tr><td>Alice</td><td>Engineering</td></tr>
          <tr><td>Bob</td><td>Marketing</td></tr>
          <tr><td>Carol</td><td>NULL</td></tr>
        </tbody>
      </table>
    </div>
    <p>
      Carol appears this time with NULL for department. All employees are included, even those without a department. HR still does not appear because it has no employee.
    </p>

    <h2>What does RIGHT JOIN return?</h2>
    <p>
      RIGHT JOIN is the mirror of LEFT JOIN. It returns all rows from the right table, matching them where it can. You get two kinds of rows in the result:
    </p>
    <ul>
      <li><strong>Matched rows</strong> - where the join condition is true, columns from both tables are populated (same as an INNER JOIN).</li>
      <li><strong>Unmatched right rows</strong> - rows from the right table with no match in the left table; the left table columns come back as NULL.</li>
    </ul>
    <pre className={styles.code}>{`SELECT e.name, d.name AS department
FROM Employees e
RIGHT JOIN Departments d ON e.department_id = d.id`}</pre>
    <div className={styles.tableWrapper}>
      <p><strong>Result</strong></p>
      <table className={styles.table}>
        <thead>
          <tr><th>name</th><th>department</th></tr>
        </thead>
        <tbody>
          <tr><td>Alice</td><td>Engineering</td></tr>
          <tr><td>Bob</td><td>Marketing</td></tr>
          <tr><td>NULL</td><td>HR</td></tr>
        </tbody>
      </table>
    </div>
    <p>
      HR appears now with NULL for the employee name. All departments are included, even those with no employees. Carol is excluded because there is no department matching her NULL department_id.
    </p>

    <div className={styles.callout}>
      <strong>Practical tip:</strong> RIGHT JOIN is rarely used in practice. Most developers rewrite it as a LEFT JOIN by swapping the table order, which is easier to read.
    </div>

    <h2>What does FULL OUTER JOIN return?</h2>
    <p>
      FULL OUTER JOIN returns all rows from both tables, matching them where it can and filling in NULL where it cannot. More precisely, you get three kinds of rows in the result:
    </p>
    <ul>
      <li><strong>Matched rows</strong> - where the join condition is true, columns from both tables are populated (same as an INNER JOIN).</li>
      <li><strong>Unmatched left rows</strong> - rows from the left table with no match in the right table; the right table columns come back as NULL.</li>
      <li><strong>Unmatched right rows</strong> - rows from the right table with no match in the left table; the left table columns come back as NULL.</li>
    </ul>
    <pre className={styles.code}>{`SELECT e.name, d.name AS department
FROM Employees e
FULL OUTER JOIN Departments d ON e.department_id = d.id`}</pre>
    <div className={styles.tableWrapper}>
      <p><strong>Result</strong></p>
      <table className={styles.table}>
        <thead>
          <tr><th>name</th><th>department</th></tr>
        </thead>
        <tbody>
          <tr><td>Alice</td><td>Engineering</td></tr>
          <tr><td>Bob</td><td>Marketing</td></tr>
          <tr><td>Carol</td><td>NULL</td></tr>
          <tr><td>NULL</td><td>HR</td></tr>
        </tbody>
      </table>
    </div>
    <p>
      All employees and all departments appear. Carol shows up with no department, and HR shows up with no employee.
    </p>
    <h2>What is a SELF JOIN?</h2>
    <p>
      A SELF JOIN is when a table is joined with itself. There is no special <code>SELF JOIN</code> keyword in SQL - you simply use a regular JOIN with two different aliases for the same table.
    </p>
    <p>
      It is useful when a table has a column that references another row in the same table. A common example is an employees table where each employee has a <strong>manager_id</strong> that points to another employee in the same table.
    </p>

    <div className={styles.tableWrapper}>
      <p><strong>Employees (with manager)</strong></p>
      <table className={styles.table}>
        <thead>
          <tr><th>id</th><th>name</th><th>manager_id</th></tr>
        </thead>
        <tbody>
          <tr><td>1</td><td>Alice</td><td>NULL</td></tr>
          <tr><td>2</td><td>Bob</td><td>1</td></tr>
          <tr><td>3</td><td>Carol</td><td>1</td></tr>
          <tr><td>4</td><td>Dave</td><td>2</td></tr>
        </tbody>
      </table>
    </div>

    <pre className={styles.code}>{`SELECT e.name AS employee, m.name AS manager
FROM Employees e
LEFT JOIN Employees m ON e.manager_id = m.id`}</pre>

    <div className={styles.tableWrapper}>
      <p><strong>Result</strong></p>
      <table className={styles.table}>
        <thead>
          <tr><th>employee</th><th>manager</th></tr>
        </thead>
        <tbody>
          <tr><td>Alice</td><td>NULL</td></tr>
          <tr><td>Bob</td><td>Alice</td></tr>
          <tr><td>Carol</td><td>Alice</td></tr>
          <tr><td>Dave</td><td>Bob</td></tr>
        </tbody>
      </table>
    </div>
    <p>
      Alice has no manager (she is at the top), so her manager column is NULL. Bob and Carol both report to Alice. Dave reports to Bob. The same table is referenced twice using the aliases <code>e</code> (employee) and <code>m</code> (manager).
    </p>

    <h2>When should you use each JOIN?</h2>
    <ul>
      <li><strong>INNER JOIN</strong> - when you only care about rows that have a match on both sides. Most common use case.</li>
      <li><strong>LEFT JOIN</strong> - when you want all records from the main table, regardless of whether a related record exists. Very useful for finding missing data (WHERE right.id IS NULL).</li>
      <li><strong>RIGHT JOIN</strong> - same logic as LEFT JOIN but from the other direction. Usually rewritten as a LEFT JOIN for clarity.</li>
      <li><strong>FULL OUTER JOIN</strong> - when you need all records from both tables, including unmatched rows from each side.</li>
      <li><strong>SELF JOIN</strong> - when a table has a column referencing another row in the same table, such as hierarchical or parent-child relationships.</li>
    </ul>

    <h2>Frequently asked questions</h2>
    <div className={styles.faq}>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>What is the difference between INNER JOIN and LEFT JOIN?</strong>
        <p className={styles.faqA}>INNER JOIN only returns rows with a match in both tables. LEFT JOIN returns all rows from the left table, with NULLs where no match exists in the right table.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Is LEFT JOIN the same as LEFT OUTER JOIN?</strong>
        <p className={styles.faqA}>Yes. LEFT JOIN and LEFT OUTER JOIN are identical. The OUTER keyword is optional and most developers omit it.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Which JOIN is the fastest?</strong>
        <p className={styles.faqA}>INNER JOIN is typically the fastest because it processes fewer rows. However, performance depends mostly on indexes, not the JOIN type.</p>
      </div>
      <div className={styles.faqItem}>
        <strong className={styles.faqQ}>Can I use multiple JOINs in one query?</strong>
        <p className={styles.faqA}>Yes. You can chain as many JOINs as needed in a single query, each with its own ON condition.</p>
      </div>
    </div>

    <h2>Official resources</h2>
    <ul>
      <li><a href="https://learn.microsoft.com/en-us/sql/relational-databases/performance/joins?view=sql-server-ver17" target="_blank" rel="noopener noreferrer" className={styles.link}>Joins (SQL Server) - Microsoft Learn</a></li>
    </ul>

  </div>
);

export default SqlJoins;
