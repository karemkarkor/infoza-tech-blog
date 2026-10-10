require('dotenv').config();

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required. Copy .env.example to .env and configure it.');
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be set to a random secret of at least 32 characters.');

const app = require('./app');
const prisma = require('./config/prisma');
const port = Number(process.env.PORT) || 3000;

const server = app.listen(port, () => console.log(`Blog app listening at http://localhost:${port}`));

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
