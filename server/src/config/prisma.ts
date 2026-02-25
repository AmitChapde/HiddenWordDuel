import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// 1. Create the connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 2. Create the adapter
const adapter = new PrismaPg(pool);

// 3. Pass the adapter to the Client
export const prisma = new PrismaClient({ adapter });