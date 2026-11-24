import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

export const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../../');
dotenv.config({ path: path.join(repositoryRoot, '.env') });

export const templatePath = path.join(
  repositoryRoot,
  'Chapter_04_AI_Agents_Basics',
  'VIBE_CODING',
  '01_Intelligent_Test_Planning_AIAgent',
  '01_plan',
  'test-plan-template.md',
);
