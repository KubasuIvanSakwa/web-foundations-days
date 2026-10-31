# School Database Design

## Table Explanations
* **students:** Stores core identifying information for each individual taking classes, such as their name and a unique email address.
* **courses:** Stores the catalogue of subjects offered by the school, including the course name and credit weight.
* **enrolments:** A join table (also known as an associative entity) that records when a specific student takes a specific course, while also storing contextual data about that pairing, such as the final grade. 

## Relationships
* **One-to-Many:** One student can have many enrolments, and one course can have many enrolments.
* **Many-to-Many:** Students and courses share a many-to-many relationship (a student takes many courses, and a course has many students). 
* **Why a join table is needed:** Relational databases cannot store multiple values (like a list of course IDs) in a single column without breaking First Normal Form (1NF). The `enrolments` join table resolves this by breaking the many-to-many relationship into two one-to-many relationships, providing a structured place to store the combination of foreign keys alongside unique pairing attributes like the `grade`.

## Indexing
I would add an index to the `courses(course_name)` column (e.g., `CREATE INDEX idx_course_name ON courses(course_name);`). When users search for a roster or filter data, they will almost always query by the textual name of the course rather than its integer ID. Adding an index here turns a slow, full-table sequential scan into a highly efficient lookup.

## Database Selection: SQL vs NoSQL
I would choose a relational **SQL database** (like PostgreSQL or MySQL) for this system. A school registration system is built on highly structured, rigidly connected data with clear schemas and rules (such as ensuring a student cannot enrol twice). It relies heavily on ACID compliance to prevent inconsistent enrolment states and heavily utilizes `JOIN` operations to generate reports like transcripts and class rosters. NoSQL databases are optimized for flexible schemas, hierarchical document storage, and massive horizontal scaling, which does not align with the strict relational needs and transaction integrity required for academic records.