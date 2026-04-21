const { PrismaClient } = require('@prisma/client');
try {
  const p = new PrismaClient();
  console.log("instantiated");
} catch(e) {
  console.error("error:", e);
}
