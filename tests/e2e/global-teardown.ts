import { execSync } from 'child_process';

async function globalTeardown() {
  console.log('[global-teardown] cleaning up...');
  // Optional: kill servers if needed
  try {
    execSync('lsof -ti:8080 | xargs kill -9 2>/dev/null', { stdio: 'pipe' });
  } catch {
    // Ignore
  }
}

export default globalTeardown;
