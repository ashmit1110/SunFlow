import 'dotenv/config';
import { mkdir, open } from 'node:fs/promises';
import path from 'node:path';

const databaseUrl = process.env.DATABASE_URL ?? 'file:./dev.db';

if (!databaseUrl.startsWith('file:')) {
  throw new Error('DATABASE_URL must use a SQLite file URL, such as file:./dev.db');
}

const configuredPath = databaseUrl.slice('file:'.length).split('?')[0];
const databasePath = path.isAbsolute(configuredPath)
  ? configuredPath
  : path.resolve('prisma', configuredPath);

await mkdir(path.dirname(databasePath), { recursive: true });
const file = await open(databasePath, 'a');
await file.close();
