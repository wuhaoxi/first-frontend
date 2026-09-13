import * as http from 'http';

// ---- Mock Data ----
export const MOCK_GUIDES = [
  { id: 1, title: 'Chengdu Food Guide', cityName: 'Chengdu', coverImageUrl: null, recommendation: 'Best hotpot tour', slug: 'chengdu-food' },
  { id: 2, title: 'Beijing History Walk', cityName: 'Beijing', coverImageUrl: null, recommendation: 'Forbidden City deep dive', slug: 'beijing-history' },
];

export const MOCK_ATTRACTIONS = [
  {
    id: 1,
    createdAt: '2026-09-01T12:00:00Z',
    slug: 'forbidden-city',
    name: 'Forbidden City',
    nameZh: '故宫',
    category: 'HISTORICAL_SITE',
    tags: ['unesco'],
    city: 'Beijing',
    citySlug: 'beijing',
    summary: 'Imperial palace at the heart of Beijing.',
    coverImageUrl: null,
    bookingRequired: true,
  },
  {
    id: 2,
    createdAt: '2026-09-01T12:00:00Z',
    slug: 'terracotta-army',
    name: 'Terracotta Army',
    nameZh: '兵马俑',
    category: 'HISTORICAL_SITE',
    tags: ['unesco'],
    city: "Xi'an",
    citySlug: 'xian',
    summary: 'Thousands of life-size warriors guarding an emperor.',
    coverImageUrl: null,
    bookingRequired: true,
  },
  {
    id: 3,
    createdAt: '2026-09-01T12:00:00Z',
    slug: 'west-lake',
    name: 'West Lake',
    nameZh: '西湖',
    category: 'NATURE',
    tags: ['unesco'],
    city: 'Hangzhou',
    citySlug: 'hangzhou',
    summary: 'The lake that inspired a thousand poems.',
    coverImageUrl: null,
    bookingRequired: false,
  },
  {
    id: 4,
    createdAt: '2026-09-01T12:00:00Z',
    slug: 'the-bund',
    name: 'The Bund',
    nameZh: '外滩',
    category: 'STREET_DISTRICT',
    tags: ['skyline'],
    city: 'Shanghai',
    citySlug: 'shanghai',
    summary: 'Riverside promenade facing the Pudong skyline.',
    coverImageUrl: null,
    bookingRequired: false,
  },
  {
    id: 5,
    createdAt: '2026-09-01T12:00:00Z',
    slug: 'chengdu-panda-base',
    name: 'Chengdu Panda Base',
    nameZh: '成都大熊猫基地',
    category: 'NATURE',
    tags: ['pandas'],
    city: 'Chengdu',
    citySlug: 'chengdu',
    summary: 'Meet giant pandas in a research park.',
    coverImageUrl: null,
    bookingRequired: true,
  },
  {
    id: 6,
    createdAt: '2026-09-01T12:00:00Z',
    slug: 'longji-rice-terraces',
    name: 'Longji Rice Terraces',
    nameZh: '龙脊梯田',
    category: 'NATURE',
    tags: ['hiking'],
    city: 'Guilin',
    citySlug: 'guilin',
    summary: 'Dragon-backbone terraces carved into the hills.',
    coverImageUrl: null,
    bookingRequired: false,
  },
];

export const MOCK_POSTS = [
  { id: 1, title: 'Best hotpot in Chengdu?', cityName: 'Chengdu', commentCount: 42, createdAt: new Date().toISOString() },
  { id: 2, title: 'Great Wall tips', cityName: 'Beijing', commentCount: 28, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 3, title: 'Shanghai nightlife', cityName: 'Shanghai', commentCount: 15, createdAt: new Date(Date.now() - 7200000).toISOString() },
];

// ---- Stateful Mock Behavior ----
interface MockState {
  guidesFail: boolean;
  attractionsFail: boolean;
  postsFail: boolean;
  guidesDelay: number;
  attractionsDelay: number;
  postsDelay: number;
  postsEmpty: boolean;
  attractionsEmpty: boolean;
}

const state: MockState = {
  guidesFail: false,
  attractionsFail: false,
  postsFail: false,
  guidesDelay: 0,
  attractionsDelay: 0,
  postsDelay: 0,
  postsEmpty: false,
  attractionsEmpty: false,
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
    if (typeof body.attractionsFail === 'boolean') state.attractionsFail = body.attractionsFail;
    if (typeof body.postsFail === 'boolean') state.postsFail = body.postsFail;
    if (typeof body.guidesDelay === 'number') state.guidesDelay = body.guidesDelay;
    if (typeof body.attractionsDelay === 'number') state.attractionsDelay = body.attractionsDelay;
    if (typeof body.postsDelay === 'number') state.postsDelay = body.postsDelay;
    if (typeof body.postsEmpty === 'boolean') state.postsEmpty = body.postsEmpty;
    if (typeof body.attractionsEmpty === 'boolean') state.attractionsEmpty = body.attractionsEmpty;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, state }));
    return;
  }

  // ---- Reset state ----
  if (url === '/__mock/reset' && method === 'POST') {
    state.guidesFail = false;
    state.attractionsFail = false;
    state.postsFail = false;
    state.guidesDelay = 0;
    state.attractionsDelay = 0;
    state.postsDelay = 0;
    state.postsEmpty = false;
    state.attractionsEmpty = false;
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

  if (url === '/api/attractions/popular') {
    trackedRequests.push('attractions-popular');
    if (state.attractionsDelay > 0) await new Promise((r) => setTimeout(r, state.attractionsDelay));
    if (state.attractionsFail) {
      res.writeHead(500, corsHeaders);
      res.end(JSON.stringify({ message: 'Internal Server Error' }));
    } else if (state.attractionsEmpty) {
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify([]));
    } else {
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify(MOCK_ATTRACTIONS));
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
