import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type { PrismaConfig } from 'prisma'

// Charge .env.local (convention Next.js) puis .env en fallback
loadEnv({ path: '.env.local' })
loadEnv()

export default {
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    // Les commandes CLI (migrate) utilisent la connexion directe si dispo,
    // sinon la connexion poolée. Le runtime utilise DATABASE_URL via l'adapter.
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
} satisfies PrismaConfig
