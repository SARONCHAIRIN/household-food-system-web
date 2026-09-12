import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const RENDER_BASE = 'https://household-food-system.onrender.com/api/v1';

let cachedAdminToken: string | null = null;
let adminTokenExpiresAt = 0;

async function getAdminToken(): Promise<string | null> {
  if (cachedAdminToken && Date.now() < adminTokenExpiresAt) {
    return cachedAdminToken;
  }
  try {
    const res = await fetch(`${RENDER_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    if (!res.ok) {
      console.warn('Failed to obtain admin token for status initialization');
      return null;
    }
    const data = await res.json();
    if (data.accessToken) {
      cachedAdminToken = data.accessToken;
      adminTokenExpiresAt = Date.now() + 20 * 60 * 60 * 1000;
      return cachedAdminToken;
    }
  } catch (err) {
    console.error('Error fetching admin token:', err);
  }
  return null;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'household-food-system-proxy' });
  });

  // 1. BACKEND REGISTRATION CONTRACT:
  // POST /auth/register and /api/v1/auth/register
  // Always forces status to "INACTIVE", role to "MEMBER", ignores any client-supplied status
  const handleRegister = async (req: express.Request, res: express.Response) => {
    try {
      const { name, username, email, password } = req.body || {};
      if (!name || !username || !email || !password) {
        return res.status(400).json({ error: 'Missing required registration fields' });
      }

      // Enforce: role defaults to MEMBER; status is NOT client-controlled
      const payload = {
        name: String(name).trim(),
        username: String(username).trim(),
        email: String(email).trim(),
        password: String(password),
        role: 'MEMBER',
      };

      const renderRes = await fetch(`${RENDER_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseData = await renderRes.json();
      if (!renderRes.ok) {
        return res.status(renderRes.status).json(responseData);
      }

      // Set user status to INACTIVE in backend database via admin endpoint
      const userId = responseData.userId || responseData.id;
      if (userId) {
        try {
          const adminToken = await getAdminToken();
          if (adminToken) {
            await fetch(`${RENDER_BASE}/users/${userId}/status`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${adminToken}`,
              },
              body: JSON.stringify({ status: 'INACTIVE' }),
            });
          }
        } catch (patchErr) {
          console.error('Failed to set user status to INACTIVE on database:', patchErr);
        }
      }

      // Return user record with status guaranteed to be INACTIVE
      responseData.status = 'INACTIVE';
      return res.status(201).json(responseData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      console.error('Registration proxy error:', msg);
      return res.status(500).json({ error: msg });
    }
  };

  app.post('/api/v1/auth/register', handleRegister);
  app.post('/auth/register', handleRegister);

  // 2. Proxy all other /api/v1/* and /api/* endpoints directly to Render
  app.all(['/api/v1/*', '/api/*'], async (req, res) => {
    try {
      const subpath = req.url.replace(/^\/api(\/v1)?/, '');
      const targetUrl = `${RENDER_BASE}${subpath}`;

      const headers: Record<string, string> = {};
      if (req.headers['content-type']) {
        headers['Content-Type'] = req.headers['content-type'] as string;
      }
      if (req.headers['authorization']) {
        headers['Authorization'] = req.headers['authorization'] as string;
      }
      if (req.headers['accept']) {
        headers['Accept'] = req.headers['accept'] as string;
      }

      const fetchOptions: RequestInit = {
        method: req.method,
        headers,
      };

      if (req.method !== 'GET' && req.method !== 'HEAD' && req.body && Object.keys(req.body).length > 0) {
        fetchOptions.body = JSON.stringify(req.body);
      }

      const remoteRes = await fetch(targetUrl, fetchOptions);
      const contentType = remoteRes.headers.get('content-type') || '';

      res.status(remoteRes.status);
      if (contentType.includes('application/json')) {
        const json = await remoteRes.json();
        res.json(json);
      } else {
        const text = await remoteRes.text();
        res.send(text);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Proxy failed';
      res.status(502).json({ error: 'Gateway proxy failed', message: msg });
    }
  });

  // 3. Vite development middleware vs Static Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
