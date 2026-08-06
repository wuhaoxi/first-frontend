async function globalSetup() {
  // Playwright manages its own web servers (mock-server on :8080, Next.js on :3000).
  // No manual port cleanup needed — webServer config handles startup and teardown.
  console.log('[global-setup] ready');
}

export default globalSetup;
