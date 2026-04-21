import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
console.log("imported", !!PrismaClient);
try {
  const p = new PrismaClient();
  console.log("instantiated");
} catch(e) {
  console.error("error:", e);
}
