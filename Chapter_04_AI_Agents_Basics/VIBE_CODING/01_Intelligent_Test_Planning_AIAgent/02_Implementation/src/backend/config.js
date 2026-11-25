import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

export const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../../');
if (!process.env.VERCEL) dotenv.config({ path: path.join(repositoryRoot, '.env') });

export const templatePath = new URL('./assets/test-plan-template.md', import.meta.url);
