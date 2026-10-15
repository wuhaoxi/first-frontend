import * as http from 'http';

// ---- Mock Data ----
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
    ratingScore: 4.9,
    favoriteCount: 52000,
    heatScore: 98,
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
    ratingScore: 4.8,
    favoriteCount: 31000,
    heatScore: 90,
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
    ratingScore: 4.7,
    favoriteCount: 28000,
    heatScore: 86,
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
    ratingScore: 4.6,
    favoriteCount: 24000,
    heatScore: 82,
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
    ratingScore: 4.5,
    favoriteCount: 38000,
    heatScore: 95,
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
    ratingScore: 4.4,
    favoriteCount: 15000,
    heatScore: 70,
  },
];

export const MOCK_POSTS = [
  { id: 1, title: 'Best hotpot in Chengdu?', cityName: 'Chengdu', commentCount: 42, createdAt: new Date().toISOString() },
  { id: 2, title: 'Great Wall tips', cityName: 'Beijing', commentCount: 28, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 3, title: 'Shanghai nightlife', cityName: 'Shanghai', commentCount: 15, createdAt: new Date(Date.now() - 7200000).toISOString() },
];

// ---- Stateful Mock Behavior ----
interface MockState {
  attractionsFail: boolean;
  postsFail: boolean;
  attractionsDelay: number;
  postsDelay: number;
  postsEmpty: boolean;
  attractionsEmpty: boolean;
}

const state: MockState = {
  attractionsFail: false,
  postsFail: false,
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
  const parsedUrl = new URL(url, 'http://localhost');

  // ---- Control API (called from tests before navigation) ----
  if (url === '/__mock/configure' && method === 'POST') {
    const body = (await jsonBody(req)) as Partial<MockState>;
    if (typeof body.attractionsFail === 'boolean') state.attractionsFail = body.attractionsFail;
    if (typeof body.postsFail === 'boolean') state.postsFail = body.postsFail;
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
    state.attractionsFail = false;
    state.postsFail = false;
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
  if (parsedUrl.pathname === '/api/attractions') {
    trackedRequests.push('attractions-list');
    if (state.attractionsDelay > 0) await new Promise((r) => setTimeout(r, state.attractionsDelay));
    if (state.attractionsFail) {
      res.writeHead(500, corsHeaders);
      res.end(JSON.stringify({ message: 'Internal Server Error' }));
      return;
    }

    const params = parsedUrl.searchParams;
    const q = (params.get('q') ?? '').trim().toLowerCase();
    const city = params.get('city');
    const category = params.get('category');
    const sort = params.get('sort');
    const rawPage = Number.parseInt(params.get('page') ?? '0', 10);
    const rawSize = Number.parseInt(params.get('size') ?? '20', 10);
    const pageNum = Number.isNaN(rawPage) ? 0 : Math.max(0, rawPage);
    const sizeNum = Number.isNaN(rawSize) ? 20 : Math.max(1, rawSize);

    let items = [...MOCK_ATTRACTIONS];
    if (q) {
      items = items.filter(
        (a) => a.name.toLowerCase().includes(q) || a.nameZh.toLowerCase().includes(q)
      );
    }
    if (city) items = items.filter((a) => a.citySlug === city);
    if (category) items = items.filter((a) => a.category === category);
    if (sort === 'rating') {
      items.sort((a, b) => b.ratingScore - a.ratingScore);
    } else if (sort === 'heat') {
      items.sort((a, b) => b.heatScore - a.heatScore);
    } else if (sort === 'favorites') {
      items.sort((a, b) => b.favoriteCount - a.favoriteCount);
    }

    const totalElements = state.attractionsEmpty ? 0 : items.length;
    const content = state.attractionsEmpty
      ? []
      : items.slice(pageNum * sizeNum, pageNum * sizeNum + sizeNum);

    res.writeHead(200, corsHeaders);
    res.end(
      JSON.stringify({
        content,
        page: pageNum,
        size: sizeNum,
        totalElements,
        totalPages: Math.ceil(totalElements / sizeNum),
      })
    );
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

  // ---- AI Assistant chat (SSE) ----
  // Auth model: the real backend requires the httpOnly `access_token` cookie;
  // requests without it get 401 so the panel shows its login prompt.
  if (url === '/api/assistant/chat' && method === 'POST') {
    trackedRequests.push('assistant-chat');
    const body = (await jsonBody(req)) as { message?: string; conversationId?: string };
    const cookie = req.headers.cookie ?? '';

    if (!cookie.includes('access_token=')) {
      res.writeHead(401, corsHeaders);
      res.end(
        JSON.stringify({ message: 'Authentication required', status: 401, timestamp: new Date().toISOString() })
      );
      return;
    }

    const message = body.message ?? '';

    if (message.includes('limit')) {
      res.writeHead(429, corsHeaders);
      res.end(
        JSON.stringify({
          message: 'Too many assistant requests — try again in a minute',
          status: 429,
          timestamp: new Date().toISOString(),
        })
      );
      return;
    }

    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store',
      Connection: 'keep-alive',
    });

    if (message.includes('fail')) {
      res.write('event:error\ndata:{"message":"The assistant is temporarily unavailable. Please try again."}\n\n');
      res.end();
      return;
    }

    const conversationId = body.conversationId ?? 'mock-conv-1';

    // Knowledge question (add-assistant-knowledge-base): the reply ends with a
    // plain-text citation tail, mirroring the backend's Sources rule.
    if (message.includes('knowledge')) {
      res.write('event:delta\ndata:{"text":"杭州西湖以秀丽的湖光山色与人文典故闻名。"}\n\n');
      res.write(`event:delta\ndata:${JSON.stringify({ text: '\n\nSources: [1] 《杭州西湖》 (attractions)' })}\n\n`);
      res.write(`event:done\ndata:${JSON.stringify({ conversationId })}\n\n`);
      res.end();
      return;
    }

    res.write('event:delta\ndata:{"text":"Echo: "}\n\n');
    res.write(`event:delta\ndata:${JSON.stringify({ text: message })}\n\n`);
    res.write('event:delta\ndata:{"text":" — mock reply"}\n\n');
    res.write(`event:done\ndata:${JSON.stringify({ conversationId })}\n\n`);
    res.end();
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
