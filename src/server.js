import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/database.js';

await prisma.$connect();

const server = app.listen(env.PORT, () => {
  console.log(`SunFlow API listening on http://localhost:${env.PORT}`);
});

async function shutdown(signal) {
  console.log(`${signal} received; shutting down SunFlow API`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
