/**
 * Prisma Configuration for Attested Governance Artifacts
 * Per AGA Build Guide Section 0.3
 */
import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: path.join(__dirname, 'schema.prisma'),
});
