import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Fixing the duplicate lowercase column issues...");
  
  try {
    // There are duplicate columns (testcases and testCases). 
    // Prisma inserts into "testCases", so we need to relax constraints on "testcases".
    await prisma.$executeRawUnsafe(`ALTER TABLE coding_questions ALTER COLUMN testcases DROP NOT NULL;`);
    console.log("Dropped NOT NULL on 'testcases'");
  } catch (e) {
    console.log("Could not alter 'testcases': ", e.message);
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE coding_questions ALTER COLUMN testcases SET DEFAULT '[]'::jsonb;`);
    console.log("Set default on 'testcases'");
  } catch (e) {
    console.log("Could not set default on 'testcases': ", e.message);
  }

}

main().catch(console.error).finally(() => prisma.$disconnect());
