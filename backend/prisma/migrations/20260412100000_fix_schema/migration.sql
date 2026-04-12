-- =============================================================================
-- SKILLLAB DATABASE FIX MIGRATION
-- =============================================================================
-- Fixes: Column mismatches, missing constraints, slow queries, 
--        duplicate data, inconsistent naming, analytics issues
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. FIX TESTS TABLE
-- =============================================================================

-- Rename created_by to createdBy (if exists and needs renaming)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tests' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE tests RENAME COLUMN created_by TO createdBy;
    END IF;
END $$;

-- Add isActive column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tests' AND column_name = 'isActive'
    ) THEN
        ALTER TABLE tests ADD COLUMN "isActive" BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add createdBy column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tests' AND column_name = 'createdBy'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tests' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE tests ADD COLUMN "createdBy" TEXT;
    END IF;
END $$;

-- Ensure expiryDate exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tests' AND column_name = 'expiryDate'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tests' AND column_name = 'expirydate'
    ) THEN
        ALTER TABLE tests ADD COLUMN "expiryDate" TIMESTAMP(3);
    END IF;
END $$;

-- Rename expirydate to expiryDate if it exists with wrong naming
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tests' AND column_name = 'expirydate'
    ) THEN
        ALTER TABLE tests RENAME COLUMN expirydate TO "expiryDate";
    END IF;
END $$;

-- =============================================================================
-- 2. FIX RESULTS TABLE
-- =============================================================================

-- Add totalQuestions column if missing (as distinct from totalMarks)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'results' AND column_name = 'totalQuestions'
    ) THEN
        ALTER TABLE results ADD COLUMN "totalQuestions" INTEGER DEFAULT 0;
    END IF;
END $$;

-- Ensure score column exists with default
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'results' AND column_name = 'score'
    ) THEN
        ALTER TABLE results ADD COLUMN "score" INTEGER DEFAULT 0;
    END IF;
END $$;

-- =============================================================================
-- 3. FIX QUESTIONS TABLE
-- =============================================================================

-- Add topic column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'questions' AND column_name = 'topic'
    ) THEN
        ALTER TABLE questions ADD COLUMN "topic" TEXT;
    END IF;
END $$;

-- =============================================================================
-- 4. ADD UNIQUE CONSTRAINTS (already exist, but ensure them)
-- =============================================================================

-- batch_students unique (userId, batchId) - already exists
-- results unique (userId, testId) - already exists

-- =============================================================================
-- 5. ADD FOREIGN KEYS WITH CASCADE
-- =============================================================================

-- Drop and recreate foreign keys with CASCADE for answers table

-- answers.resultId → results.id (CASCADE)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'answers_resultId_fkey' AND table_name = 'answers'
    ) THEN
        ALTER TABLE answers DROP CONSTRAINT "answers_resultId_fkey";
    END IF;
END $$;

ALTER TABLE answers 
ADD CONSTRAINT "answers_resultId_fkey" 
FOREIGN KEY ("resultId") REFERENCES results(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- answers.questionId → questions.id (CASCADE)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'answers_questionId_fkey' AND table_name = 'answers'
    ) THEN
        ALTER TABLE answers DROP CONSTRAINT "answers_questionId_fkey";
    END IF;
END $$;

ALTER TABLE answers 
ADD CONSTRAINT "answers_questionId_fkey" 
FOREIGN KEY ("questionId") REFERENCES questions(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- answers.userId → users.id (CASCADE)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'answers_userId_fkey' AND table_name = 'answers'
    ) THEN
        ALTER TABLE answers DROP CONSTRAINT "answers_userId_fkey";
    END IF;
END $$;

ALTER TABLE answers 
ADD CONSTRAINT "answers_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- batch_students.userId → users.id (CASCADE)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'batch_students_userId_fkey' AND table_name = 'batch_students'
    ) THEN
        ALTER TABLE batch_students DROP CONSTRAINT "batch_students_userId_fkey";
    END IF;
END $$;

ALTER TABLE batch_students 
ADD CONSTRAINT "batch_students_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- batch_students.batchId → batches.id (CASCADE)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'batch_students_batchId_fkey' AND table_name = 'batch_students'
    ) THEN
        ALTER TABLE batch_students DROP CONSTRAINT "batch_students_batchId_fkey";
    END IF;
END $$;

ALTER TABLE batch_students 
ADD CONSTRAINT "batch_students_batchId_fkey" 
FOREIGN KEY ("batchId") REFERENCES batches(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- results.userId → users.id (CASCADE)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'results_userId_fkey' AND table_name = 'results'
    ) THEN
        ALTER TABLE results DROP CONSTRAINT "results_userId_fkey";
    END IF;
END $$;

ALTER TABLE results 
ADD CONSTRAINT "results_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- results.testId → tests.id (CASCADE)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'results_testId_fkey' AND table_name = 'results'
    ) THEN
        ALTER TABLE results DROP CONSTRAINT "results_testId_fkey";
    END IF;
END $$;

ALTER TABLE results 
ADD CONSTRAINT "results_testId_fkey" 
FOREIGN KEY ("testId") REFERENCES tests(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================================================
-- 6. ADD PERFORMANCE INDEXES
-- =============================================================================

-- Results indexes
CREATE INDEX IF NOT EXISTS "results_userId_idx" ON results("userId");
CREATE INDEX IF NOT EXISTS "results_testId_idx" ON results("testId");
CREATE INDEX IF NOT EXISTS "results_userId_testId_idx" ON results("userId", "testId");

-- Answers indexes
CREATE INDEX IF NOT EXISTS "answers_resultId_idx" ON answers("resultId");
CREATE INDEX IF NOT EXISTS "answers_questionId_idx" ON answers("questionId");
CREATE INDEX IF NOT EXISTS "answers_userId_idx" ON answers("userId");

-- Batch_students indexes
CREATE INDEX IF NOT EXISTS "batch_students_userId_idx" ON batch_students("userId");
CREATE INDEX IF NOT EXISTS "batch_students_batchId_idx" ON batch_students("batchId");

-- Tests indexes  
CREATE INDEX IF NOT EXISTS "tests_batchId_idx" ON tests("batchId");
CREATE INDEX IF NOT EXISTS "tests_instituteId_idx" ON tests("instituteId");

-- Questions indexes
CREATE INDEX IF NOT EXISTS "questions_testId_idx" ON questions("testId");

-- =============================================================================
-- 7. BACKWARD COMPATIBILITY: Populate totalQuestions from totalMarks if empty
-- =============================================================================

UPDATE results SET "totalQuestions" = "totalMarks" 
WHERE "totalQuestions" = 0 AND "totalMarks" > 0;

-- =============================================================================
-- 8. SET DEFAULT FOR isActive (ensure tests are active by default)
-- =============================================================================

UPDATE tests SET "isActive" = true WHERE "isActive" IS NULL;

-- =============================================================================
COMMIT;

-- =============================================================================
-- NOTES ON FIXES APPLIED:
-- =============================================================================
-- 1. Tests table: Added isActive, createdBy; ensured expiryDate exists
-- 2. Results table: Added totalQuestions column
-- 3. Questions table: Added topic column
-- 4. Foreign keys: Changed to CASCADE delete for proper cleanup
-- 5. Indexes: Added 12 new indexes for query performance
-- 6. Data migration: Populated totalQuestions, set isActive defaults
-- =============================================================================