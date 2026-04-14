-- =============================================================================
-- CODING LAB TABLES MIGRATION
-- =============================================================================
-- Creates all coding lab tables for the new coding practice system
-- Uses CUID for TEXT IDs (matches @default(cuid()) in Prisma)
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. CREATE CODING BATCHES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS "coding_batches" (
    "id" TEXT PRIMARY KEY DEFAULT CUID(),
    "name" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

ALTER TABLE "coding_batches" ADD CONSTRAINT "coding_batches_batchId_fkey" 
    FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "coding_batches_batchId_idx" ON "coding_batches"("batchId");

-- =============================================================================
-- 2. CREATE CODING QUESTIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS "coding_questions" (
    "id" TEXT PRIMARY KEY DEFAULT CUID(),
    "codingBatchId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'practice',
    "topic" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'easy',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "starterCode" TEXT,
    "buggyCode" TEXT DEFAULT '',
    "expectedOutput" TEXT,
    "testCases" JSONB DEFAULT '[]',
    "constraints" TEXT,
    "hints" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

ALTER TABLE "coding_questions" ADD CONSTRAINT "coding_questions_codingBatchId_fkey" 
    FOREIGN KEY ("codingBatchId") REFERENCES "coding_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "coding_questions_codingBatchId_idx" ON "coding_questions"("codingBatchId");
CREATE INDEX IF NOT EXISTS "coding_questions_type_idx" ON "coding_questions"("type");
CREATE INDEX IF NOT EXISTS "coding_questions_topic_idx" ON "coding_questions"("topic");

-- =============================================================================
-- 3. CREATE CODING TESTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS "coding_tests" (
    "id" TEXT PRIMARY KEY DEFAULT CUID(),
    "codingBatchId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

ALTER TABLE "coding_tests" ADD CONSTRAINT "coding_tests_codingBatchId_fkey" 
    FOREIGN KEY ("codingBatchId") REFERENCES "coding_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "coding_tests_codingBatchId_idx" ON "coding_tests"("codingBatchId");

-- =============================================================================
-- 4. CREATE CODING TEST QUESTIONS (JOIN TABLE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS "coding_test_questions" (
    "id" TEXT PRIMARY KEY DEFAULT CUID(),
    "codingTestId" TEXT NOT NULL,
    "codingQuestionId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE "coding_test_questions" ADD CONSTRAINT "coding_test_questions_codingTestId_fkey" 
    FOREIGN KEY ("codingTestId") REFERENCES "coding_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "coding_test_questions" ADD CONSTRAINT "coding_test_questions_codingQuestionId_fkey" 
    FOREIGN KEY ("codingQuestionId") REFERENCES "coding_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "coding_test_questions_codingTestId_idx" ON "coding_test_questions"("codingTestId");
CREATE INDEX IF NOT EXISTS "coding_test_questions_codingQuestionId_idx" ON "coding_test_questions"("codingQuestionId");

ALTER TABLE "coding_test_questions" ADD CONSTRAINT "coding_test_questions_test_question_unique" 
    UNIQUE ("codingTestId", "codingQuestionId");

-- =============================================================================
-- 5. CREATE CODING RESULTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS "coding_results" (
    "id" TEXT PRIMARY KEY DEFAULT CUID(),
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "testId" TEXT,
    "code" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "passed" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "runtime" DOUBLE PRECISION,
    "memory" DOUBLE PRECISION,
    "output" TEXT,
    "status" TEXT NOT NULL DEFAULT 'success',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

ALTER TABLE "coding_results" ADD CONSTRAINT "coding_results_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "coding_results" ADD CONSTRAINT "coding_results_questionId_fkey" 
    FOREIGN KEY ("questionId") REFERENCES "coding_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "coding_results_userId_idx" ON "coding_results"("userId");
CREATE INDEX IF NOT EXISTS "coding_results_questionId_idx" ON "coding_results"("questionId");
CREATE INDEX IF NOT EXISTS "coding_results_testId_idx" ON "coding_results"("testId");

-- =============================================================================
-- 6. ADD FOREIGN KEY FOR coding_results.testId (nullable, to coding_tests)
-- =============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'coding_results_testId_fkey' AND table_name = 'coding_results'
    ) THEN
        ALTER TABLE "coding_results" 
        ADD CONSTRAINT "coding_results_testId_fkey" 
        FOREIGN KEY ("testId") REFERENCES "coding_tests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

COMMIT;

-- =============================================================================
-- NOTES:
-- =============================================================================
-- 1. All IDs use CUID() for TEXT IDs (compatible with Prisma's @default(cuid()))
-- 2. Foreign keys use CASCADE for proper cleanup
-- 3. Indexes added for performance optimization
-- 4. JSONB for testCases to store test case arrays
-- =============================================================================