-- =====================
-- COURSE
-- =====================
CREATE TABLE public.course (
  course_code VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  credits INT NOT NULL,
  type VARCHAR,
  lab_required BOOLEAN
);

-- =====================
-- LEVEL
-- =====================
CREATE TABLE public.level (
  level_id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  student_count INT DEFAULT 0
);

-- =====================
-- STUDENT
-- =====================
CREATE TABLE public.student (
  student_id SERIAL PRIMARY KEY,
  level_id INT REFERENCES public.level(level_id),
  name VARCHAR NOT NULL,
  email VARCHAR NOT NULL UNIQUE,
  password VARCHAR NOT NULL,
  status VARCHAR CHECK (status IN ('Regular', 'Irregular')) DEFAULT 'Regular',
  remaining_courses VARCHAR[]
);

-- =====================
-- FACULTY
-- =====================
CREATE TABLE public.faculty (
  faculty_id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  email VARCHAR NOT NULL UNIQUE,
  password TEXT NOT NULL DEFAULT 'changeme123'
);

-- =====================
-- REGISTRAR
-- =====================
CREATE TABLE public.registrar (
  registrar_id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  email VARCHAR NOT NULL UNIQUE
);

-- =====================
-- LOAD COMMITTEE MEMBER
-- =====================
CREATE TABLE public.load_committee_member (
  member_id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  email VARCHAR NOT NULL UNIQUE,
  password VARCHAR NOT NULL
);

-- =====================
-- SCHEDULING COMMITTEE MEMBER
-- =====================
CREATE TABLE public.scheduling_committee_member (
  member_id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  email VARCHAR NOT NULL UNIQUE,
  password VARCHAR NOT NULL
);

-- =====================
-- SCHEDULE
-- =====================
CREATE TABLE public.schedule (
  schedule_id SERIAL PRIMARY KEY,
  level_id INT REFERENCES public.level(level_id),
  version INT NOT NULL
);

-- =====================
-- SECTION
-- =====================
CREATE TABLE public.section (
  section_id SERIAL PRIMARY KEY,
  schedule_id INT REFERENCES public.schedule(schedule_id),
  course_code VARCHAR REFERENCES public.course(course_code),
  faculty_id INT REFERENCES public.faculty(faculty_id),
  number INT,
  capacity INT DEFAULT 25
);

-- =====================
-- ELECTIVE PREFERENCE
-- =====================
CREATE TABLE public.elective_preference (
  preference_id SERIAL PRIMARY KEY,
  student_id INT REFERENCES public.student(student_id),
  course_code VARCHAR REFERENCES public.course(course_code),
  rank INT,
  start_date DATE,
  end_date DATE
);

-- =====================
-- FINAL EXAM
-- =====================
CREATE TABLE public.final_exam (
  exam_id SERIAL PRIMARY KEY,
  course_code VARCHAR REFERENCES public.course(course_code),
  exam_date DATE NOT NULL,
  start_time TIME,
  end_time TIME
);

-- =====================
-- FEEDBACK
-- =====================
CREATE TABLE public.feedback (
  feedback_id SERIAL PRIMARY KEY,
  schedule_id INT REFERENCES public.schedule(schedule_id),
  exam_id INT REFERENCES public.final_exam(exam_id),
  author_id INT,
  author_type VARCHAR, -- 'student' or 'faculty'
  comment TEXT
);

-- =====================
-- FACULTY FEEDBACK
-- =====================
CREATE TABLE public.faculty_feedback (
  feedback_id SERIAL PRIMARY KEY,
  faculty_id INT REFERENCES public.faculty(faculty_id),
  section_id INT REFERENCES public.section(section_id),
  comment TEXT
);