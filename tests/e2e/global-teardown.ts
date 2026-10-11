import { execSync } from 'child_process';

async function globalTeardown() {
  console.log('[global-teardown] cleaning up...');
  // Optional: kill servers if needed
  try {
    // -sTCP:LISTEN — kill only the listener; clients proxying to :8080 (e.g. the
    // Next dev server) must not be taken down.
    execSync('lsof -ti:8080 -sTCP:LISTEN | xargs kill -9 2>/dev/null', { stdio: 'pipe' });
  } catch {
    // Ignore
  }
}

export default globalTeardown;
