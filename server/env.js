import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

/**
 * Lightweight zero-dependency .env loader that populates process.env
 */
export function loadEnv() {
  const envFiles = [
    path.join(ROOT_DIR, '.env'),
    path.join(ROOT_DIR, '.env.local')
  ];

  for (const envPath of envFiles) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf-8');
        const lines = content.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.substring(0, eqIdx).trim();
            let value = trimmed.substring(eqIdx + 1).trim();
            // Remove wrapping quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
              value = value.substring(1, value.length - 1);
            }
            if (key && !(key in process.env)) {
              process.env[key] = value;
            }
          }
        }
      } catch (err) {
        console.error(`[EnvLoader] Error reading ${envPath}:`, err.message);
      }
    }
  }
}

// Auto-run on import
loadEnv();
