import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());

// Path to persistent data file
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial in-memory & file-persisted state
interface ServerState {
  supabaseConfig: { url: string; anonKey: string };
  pausedRiderIds: string[];
  pausedVendorIds: string[];
  riders: any[];
  vendors: any[];
  orders: any[];
  settings: any;
  menuItems: any[];
  foodCategories: any[];
  adBanners: any[];
  updatedAt: string;
}

const INITIAL_SERVER_STATE: ServerState = {
  supabaseConfig: {
    url: process.env.VITE_SUPABASE_URL || '',
    anonKey: process.env.VITE_SUPABASE_ANON_KEY || ''
  },
  pausedRiderIds: [],
  pausedVendorIds: [],
  riders: [
    {
      id: 'r0000001-0000-0000-0000-000000000001',
      name: 'Rahim Rider',
      phone: '01755500011',
      photo_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
      home_address: 'Chawkbazar, Chittagong',
      zone: 'Chawkbazar Zone',
      vehicle_type: 'Motorcycle',
      is_online: true,
      is_paused: false,
      current_latitude: 22.3588,
      current_longitude: 91.8378,
      last_location_updated_at: new Date().toISOString(),
      cash_in_hand: 2500,
      is_approved: true,
      is_password_set: true,
      password: '123',
      created_at: new Date().toISOString()
    },
    {
      id: 'r0000002-0000-0000-0000-000000000002',
      name: 'Karim Express',
      phone: '01855500022',
      photo_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      home_address: 'Khulshi, Chittagong',
      zone: 'Khulshi Zone',
      vehicle_type: 'Motorcycle',
      is_online: true,
      is_paused: false,
      current_latitude: 22.3615,
      current_longitude: 91.8205,
      last_location_updated_at: new Date().toISOString(),
      cash_in_hand: 1200,
      is_approved: true,
      is_password_set: true,
      password: '123',
      created_at: new Date().toISOString()
    },
    {
      id: 'r0000003-0000-0000-0000-000000000003',
      name: 'Shaon Delivery',
      phone: '01955500033',
      photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      home_address: 'GEC Circle, Chittagong',
      zone: 'GEC Zone',
      vehicle_type: 'Bicycle',
      is_online: true,
      is_paused: false,
      current_latitude: 22.3592,
      current_longitude: 91.8220,
      last_location_updated_at: new Date().toISOString(),
      cash_in_hand: 1800,
      is_approved: true,
      is_password_set: true,
      password: '123',
      created_at: new Date().toISOString()
    }
  ],
  vendors: [],
  orders: [],
  settings: null,
  menuItems: [],
  foodCategories: [],
  adBanners: [],
  updatedAt: new Date().toISOString()
};

function loadState(): ServerState {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return { ...INITIAL_SERVER_STATE, ...parsed };
    }
  } catch (err) {
    console.error('Error reading db.json:', err);
  }
  return { ...INITIAL_SERVER_STATE };
}

function saveState(state: ServerState) {
  try {
    state.updatedAt = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving db.json:', err);
  }
}

let serverState = loadState();

// -------------------------------------------------------------
// REST API ENDPOINTS FOR MULTI-BROWSER SYNCHRONIZATION
// -------------------------------------------------------------

// 1. Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 2. Global sync endpoint
app.get('/api/sync', (_req, res) => {
  res.json(serverState);
});

// 3. Supabase Config sharing (allows all browsers to automatically inherit the configured DB)
app.get('/api/config', (_req, res) => {
  res.json(serverState.supabaseConfig);
});

app.post('/api/config', (req, res) => {
  const { url, anonKey } = req.body;
  serverState.supabaseConfig = {
    url: (url || '').trim(),
    anonKey: (anonKey || '').trim()
  };
  saveState(serverState);
  res.json({ success: true, config: serverState.supabaseConfig });
});

// 4. Riders API
app.get('/api/riders', (_req, res) => {
  res.json(serverState.riders);
});

// Admin Pause/Resume Rider endpoint
app.post('/api/riders/:id/pause', (req, res) => {
  const { id } = req.params;
  const { is_paused } = req.body;

  let targetRider = serverState.riders.find(r => r.id === id);
  if (!targetRider) {
    // If rider doesn't exist yet, create a placeholder
    targetRider = {
      id,
      name: `Rider ${id}`,
      phone: '',
      is_online: false,
      is_paused: false
    };
    serverState.riders.push(targetRider);
  }

  const nextPaused = typeof is_paused === 'boolean' ? is_paused : !targetRider.is_paused;
  targetRider.is_paused = nextPaused;
  if (nextPaused) {
    targetRider.is_online = false;
    if (!serverState.pausedRiderIds.includes(id)) {
      serverState.pausedRiderIds.push(id);
    }
  } else {
    serverState.pausedRiderIds = serverState.pausedRiderIds.filter(pid => pid !== id);
  }

  saveState(serverState);
  console.log(`[API] Rider ${id} pause toggled -> is_paused: ${nextPaused}`);
  res.json({ 
    success: true, 
    rider: targetRider, 
    is_paused: nextPaused, 
    pausedRiderIds: serverState.pausedRiderIds 
  });
});

// Update Rider (online status, GPS location, profile)
app.put('/api/riders/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  let targetRider = serverState.riders.find(r => r.id === id);
  if (!targetRider) {
    targetRider = { id, ...updates };
    serverState.riders.push(targetRider);
  } else {
    Object.assign(targetRider, updates);
  }

  // If paused, rider cannot be online
  if (targetRider.is_paused && targetRider.is_online) {
    targetRider.is_online = false;
  }

  saveState(serverState);
  res.json({ success: true, rider: targetRider });
});

// Register or Add Rider
app.post('/api/riders', (req, res) => {
  const newRider = req.body;
  if (!newRider.id) {
    newRider.id = `r-${Date.now()}`;
  }
  const existingIdx = serverState.riders.findIndex(r => r.id === newRider.id || (newRider.phone && r.phone === newRider.phone));
  if (existingIdx >= 0) {
    serverState.riders[existingIdx] = { ...serverState.riders[existingIdx], ...newRider };
  } else {
    serverState.riders.push(newRider);
  }
  saveState(serverState);
  res.json({ success: true, rider: newRider });
});

// Delete Rider
app.delete('/api/riders/:id', (req, res) => {
  const { id } = req.params;
  serverState.riders = serverState.riders.filter(r => r.id !== id);
  serverState.pausedRiderIds = serverState.pausedRiderIds.filter(pid => pid !== id);
  saveState(serverState);
  res.json({ success: true });
});

// 5. Orders API
app.get('/api/orders', (_req, res) => {
  res.json(serverState.orders);
});

app.post('/api/orders', (req, res) => {
  const order = req.body;
  serverState.orders = [order, ...serverState.orders.filter(o => o.id !== order.id)];
  saveState(serverState);
  res.json({ success: true, order });
});

app.put('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const idx = serverState.orders.findIndex(o => o.id === id);
  if (idx >= 0) {
    serverState.orders[idx] = { ...serverState.orders[idx], ...updates };
  }
  saveState(serverState);
  res.json({ success: true, order: serverState.orders[idx] });
});

// 6. Vendors API
app.get('/api/vendors', (_req, res) => {
  res.json(serverState.vendors);
});

app.post('/api/vendors/:id/pause', (req, res) => {
  const { id } = req.params;
  const { is_paused } = req.body;
  let target = serverState.vendors.find(v => v.id === id);
  if (target) {
    target.is_paused = typeof is_paused === 'boolean' ? is_paused : !target.is_paused;
  }
  saveState(serverState);
  res.json({ success: true, vendor: target });
});

// -------------------------------------------------------------
// VITE DEV SERVER OR PRODUCTION STATIC SERVING
// -------------------------------------------------------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`> Foodiplace server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
