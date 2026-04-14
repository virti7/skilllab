import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  // Get the admin user
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    console.log("No admin found");
    return;
  }
  
  // Generate a token just like login does
  const token = jwt.sign(
    { id: admin.id, email: admin.email, role: admin.role, name: admin.name, instituteId: admin.instituteId },
    process.env.JWT_SECRET || '1897a5e8-61f3-4d2b-bac3-99012497f904'
  );
  
  console.log("Test token generated:");
  console.log(token);
  console.log("\nToken payload decode:", jwt.decode(token));
  
  // Query batches the same way the controller does
  const batches = await prisma.batch.findMany({ orderBy: { createdAt: 'desc' } });
  console.log("\nBatches from DB:", batches.length);
  
  process.exit(0);
}

test();