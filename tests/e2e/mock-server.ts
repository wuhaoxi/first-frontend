import * as http from 'http';

// ---- Mock Data ----
export const MOCK_GUIDES = [
  { id: 1, title: 'Chengdu Food Guide', cityName: 'Chengdu', coverImageUrl: null, recommendation: 'Best hotpot tour', slug: 'chengdu-food' },
  { id: 2, title: 'Beijing History Walk', cityName: 'Beijing', coverImageUrl: null, recommendation: 'Forbidden City deep dive', slug: 'beijing-history' },
];

export const MOCK_CITIES = [
  { slug: 'chengdu', name: 'Chengdu', coverImageUrl: null, guideCount: 12 },
  { slug: 'beijing', name: 'Beijing', coverImageUrl: null, guideCount: 8 },
  { slug: 'shanghai', name: 'Shanghai', coverImageUrl: null, guideCount: 5 },
  { slug: 'guangzhou', name: 'Guangzhou', coverImageUrl: null, guideCount: 3 },
  { slug: 'hangzhou', name: 'Hangzhou', coverImageUrl: null, guideCount: 2 },
  { slug: 'xian', name: "Xi'an", coverImageUrl: null, guideCount: 0 },
];

export const MOCK_POSTS = [
  { id: 1, title: 'Best hotpot in Chengdu?', cityName: 'Chengdu', commentCount: 42, createdAt: new Date().toISOString() },
  { id: 2, title: 'Great Wall tips', cityName: 'Beijing', commentCount: 28, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 3, title: 'Shanghai nightlife', cityName: 'Shanghai', commentCount: 15, createdAt: new Date(Date.now() - 7200000).toISOString() },
];

// ---- Stateful Mock Behavior ----
interface MockState {
  guidesFail: boolean;
  citiesFail: boolean;
  postsFail: boolean;
  guidesDelay: number;
  citiesDelay: number;
  postsDelay: number;
  postsEmpty: boolean;
  citiesEmpty: boolean;
}

const state: MockState = {
  guidesFail: false,
  citiesFail: false,
  postsFail: false,
  guidesDelay: 0,
  citiesDelay: 0,
  postsDelay: 0,
  postsEmpty: false,
  citiesEmpty: false,
};

// Track requests for parallel-fetch verification
export const trackedRequests: string[] = [];

function jsonBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = req.url ?? '/';
  const method = req.method ?? 'GET';

  // ---- Control API (called from tests before navigation) ----
  if (url === '/__mock/configure' && method === 'POST') {
    const body = (await jsonBody(req)) as Partial<MockState>;
    if (typeof body.guidesFail === 'boolean') state.guidesFail = body.guidesFail;
    if (typeof body.citiesFail === 'boolean') state.citiesFail = body.citiesFail;
    if (typeof body.postsFail === 'boolean') state.postsFail = body.postsFail;
    if (typeof body.guidesDelay === 'number') state.guidesDelay = body.guidesDelay;
    if (typeof body.citiesDelay === 'number') state.citiesDelay = body.citiesDelay;
    if (typeof body.postsDelay === 'number') state.postsDelay = body.postsDelay;
    if (typeof body.postsEmpty === 'boolean') state.postsEmpty = body.postsEmpty;
    if (typeof body.citiesEmpty === 'boolean') state.citiesEmpty = body.citiesEmpty;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, state }));
    return;
  }

  // ---- Reset state ----
  if (url === '/__mock/reset' && method === 'POST') {
    state.guidesFail = false;
    state.citiesFail = false;
    state.postsFail = false;
    state.guidesDelay = 0;
    state.citiesDelay = 0;
    state.postsDelay = 0;
    state.postsEmpty = false;
    state.citiesEmpty = false;
    trackedRequests.length = 0;
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // ---- Tracked requests ----
  if (url === '/__mock/requests' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(trackedRequests));
    return;
  }

  // CORS for control API from browser (test code uses fetch)
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  // ---- Homepage API Endpoints ----
  if (url === '/api/home/featured-guides') {
    trackedRequests.push('featured-guides');
    if (state.guidesDelay > 0) await new Promise((r) => setTimeout(r, state.guidesDelay));
    if (state.guidesFail) {
      res.writeHead(500, corsHeaders);
      res.end(JSON.stringify({ message: 'Internal Server Error' }));
    } else {
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify(MOCK_GUIDES));
    }
    return;
  }

  if (url === '/api/home/popular-destinations') {
    trackedRequests.push('popular-destinations');
    if (state.citiesDelay > 0) await new Promise((r) => setTimeout(r, state.citiesDelay));
    if (state.citiesFail) {
      res.writeHead(500, corsHeaders);
      res.end(JSON.stringify({ message: 'Internal Server Error' }));
    } else if (state.citiesEmpty) {
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify([]));
    } else {
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify(MOCK_CITIES));
    }
    return;
  }

  if (url === '/api/home/hot-posts') {
    trackedRequests.push('hot-posts');
    if (state.postsDelay > 0) await new Promise((r) => setTimeout(r, state.postsDelay));
    if (state.postsFail) {
      res.writeHead(500, corsHeaders);
      res.end(JSON.stringify({ message: 'Internal Server Error' }));
    } else if (state.postsEmpty) {
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify([]));
    } else {
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify(MOCK_POSTS));
    }
    return;
  }

  // Fallback 404
  res.writeHead(404, corsHeaders);
  res.end(JSON.stringify({ message: 'Not Found', path: url }));
});

let serverInstance: http.Server | null = null;

export function startMockServer(port: number = 8080): Promise<http.Server> {
  return new Promise((resolve) => {
    serverInstance = server.listen(port, () => {
      console.log(`[mock-server] listening on port ${port}`);
      resolve(server);
    });
  });
}

export function stopMockServer(): Promise<void> {
  return new Promise((resolve) => {
    if (serverInstance) {
      serverInstance.close(() => resolve());
    } else {
      resolve();
    }
  });
}

// CLI mode: run directly with `npx tsx tests/e2e/mock-server.ts`
if (require.main === module) {
  startMockServer(8080);
}
