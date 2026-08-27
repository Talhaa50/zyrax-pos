/**
 * Server entry point bootstrap
 * Loads .env FIRST using absolute path, then starts the app.
 * This file is the ESM-safe way to run dotenv before any imports.
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Load .env before any other module is imported
config({ path: path.resolve(__dirname, '.env') });

// Now dynamically import the app so all subsequent imports see process.env
await import('./app.js');
