
CREATE TABLE students (
    student_id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_name TEXT NOT NULL,
    credits INTEGER NOT NULL
);

CREATE TABLE enrolments (
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,

    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
);

-- 2. INSERT statements

INSERT INTO students (first_name, last_name, email) VALUES
('Alice', 'Smith', 'alice.smith@example.com'),
('Bob', 'Jones', 'bob.jones@example.com'),
('Charlie', 'Brown', 'charlie.brown@example.com'),
('Diana', 'Prince', 'diana.prince@example.com'); 

INSERT INTO courses (course_name, credits) VALUES
('Database Fundamentals', 3),
('Web Development', 4),
('UI/UX Design', 3);

INSERT INTO enrolments (student_id, course_id, grade) VALUES
(1, 1, 'A'),
(1, 2, 'B'),
(2, 1, 'C'),
(2, 3, 'B+'),
(3, 2, 'A-');


SELECT courses.course_name, enrolments.grade
FROM students
JOIN enrolments ON students.student_id = enrolments.student_id
JOIN courses ON courses.course_id = enrolments.course_id
WHERE students.first_name = 'Alice' AND students.last_name = 'Smith';

SELECT students.first_name, students.last_name, enrolments.grade
FROM courses
JOIN enrolments ON courses.course_id = enrolments.course_id
JOIN students ON students.student_id = enrolments.student_id
WHERE courses.course_name = 'Database Fundamentals';

SELECT courses.course_name, COUNT(enrolments.student_id) AS total_students
FROM courses
LEFT JOIN enrolments ON courses.course_id = enrolments.course_id
GROUP BY courses.course_id, courses.course_name;

SELECT students.first_name, students.last_name
FROM students
LEFT JOIN enrolments ON students.student_id = enrolments.student_id
WHERE enrolments.course_id IS NULL;

UPDATE enrolments
SET grade = 'A'
WHERE student_id = 2 AND course_id = 1;