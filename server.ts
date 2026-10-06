import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
  zones: any[];
  riders: any[];
  vendors: any[];
  orders: any[];
  settings: any;
  menuItems: any[];
  foodCategories: any[];
  adBanners: any[];
  customers: any[];
  addresses: any[];
  customerCarts: Record<string, { items: any[]; vendor: any; updatedAt: string }>;
  updatedAt: string;
}

const INITIAL_SERVER_STATE: ServerState = {
  supabaseConfig: {
    url: process.env.VITE_SUPABASE_URL || '',
    anonKey: process.env.VITE_SUPABASE_ANON_KEY || ''
  },
  pausedRiderIds: [],
  pausedVendorIds: [],
  customers: [],
  addresses: [],
  customerCarts: {},
  zones: [
    {
      id: 'zone-001',
      name: 'Chawkbazar Zone',
      bn_name: 'চকবাজার জোন',
      description: 'Chawkbazar, Parade Square, Chatteshwari, Gani Bakery, DC Hill',
      center_latitude: 22.3590,
      center_longitude: 91.8380,
      radius_km: 2.5,
      color: '#E11D48',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'zone-002',
      name: 'GEC Zone',
      bn_name: 'জিইসি জোন',
      description: 'GEC Circle, CDA Avenue, Dampara, Golpahar, Prabartak Circle',
      center_latitude: 22.3595,
      center_longitude: 91.8215,
      radius_km: 2.5,
      color: '#2563EB',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'zone-003',
      name: 'Khulshi Zone',
      bn_name: 'খুলশী জোন',
      description: 'South Khulshi, North Khulshi, Zakir Hossain Road, Wireless Gate',
      center_latitude: 22.3650,
      center_longitude: 91.8150,
      radius_km: 2.5,
      color: '#7C3AED',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'zone-004',
      name: 'Agrabad Zone',
      bn_name: 'আগ্রাবাদ জোন',
      description: 'Commercial Area, Badamtali, Sheikh Mujib Road, Chowmuhani',
      center_latitude: 22.3275,
      center_longitude: 91.8120,
      radius_km: 3.0,
      color: '#059669',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'zone-005',
      name: 'Nasirabad Zone',
      bn_name: 'নাসিরাবাদ জোন',
      description: 'Nasirabad Housing, Polytechnic, Baizid Bostami, Sholashahar',
      center_latitude: 22.3780,
      center_longitude: 91.8250,
      radius_km: 3.0,
      color: '#D97706',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'zone-006',
      name: 'Halishahar Zone',
      bn_name: 'হালিশহর জোন',
      description: 'Halishahar Housing Estate, Boropool, Rampur, Block A-L',
      center_latitude: 22.3350,
      center_longitude: 91.7850,
      radius_km: 3.5,
      color: '#0D9488',
      is_active: true,
      created_at: new Date().toISOString()
    }
  ],
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

// 3B. Zones API (Rider Zones / Delivery Zones)
app.get('/api/zones', (_req, res) => {
  if (!serverState.zones || !Array.isArray(serverState.zones) || serverState.zones.length === 0) {
    serverState.zones = INITIAL_SERVER_STATE.zones;
    saveState(serverState);
  }
  res.json(serverState.zones);
});

// Create new Zone
app.post('/api/zones', (req, res) => {
  const newZone = req.body;
  if (!newZone.id) {
    newZone.id = `zone-${Date.now()}`;
  }
  if (!serverState.zones) serverState.zones = [];
  
  const existingIdx = serverState.zones.findIndex(z => z.id === newZone.id || (newZone.name && z.name.toLowerCase() === newZone.name.toLowerCase()));
  if (existingIdx >= 0) {
    serverState.zones[existingIdx] = { ...serverState.zones[existingIdx], ...newZone, updated_at: new Date().toISOString() };
    saveState(serverState);
    return res.json({ success: true, zone: serverState.zones[existingIdx] });
  }

  const zoneToSave = {
    id: newZone.id,
    name: newZone.name,
    bn_name: newZone.bn_name || '',
    description: newZone.description || '',
    center_latitude: Number(newZone.center_latitude) || 22.3590,
    center_longitude: Number(newZone.center_longitude) || 91.8380,
    radius_km: Number(newZone.radius_km) || 3.0,
    boundary_coordinates: newZone.boundary_coordinates || [],
    color: newZone.color || '#E11D48',
    is_active: newZone.is_active !== false,
    created_at: newZone.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  serverState.zones.push(zoneToSave);
  saveState(serverState);
  console.log(`[API] Zone created: ${zoneToSave.name} (${zoneToSave.id})`);
  res.json({ success: true, zone: zoneToSave });
});

// Update Zone
app.put('/api/zones/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  if (!serverState.zones) serverState.zones = [];

  const idx = serverState.zones.findIndex(z => z.id === id);
  if (idx >= 0) {
    serverState.zones[idx] = { 
      ...serverState.zones[idx], 
      ...updates, 
      updated_at: new Date().toISOString() 
    };
    saveState(serverState);
    return res.json({ success: true, zone: serverState.zones[idx] });
  }

  res.status(404).json({ success: false, message: 'Zone not found' });
});

// Delete Zone
app.delete('/api/zones/:id', (req, res) => {
  const { id } = req.params;
  if (!serverState.zones) serverState.zones = [];
  serverState.zones = serverState.zones.filter(z => z.id !== id);
  saveState(serverState);
  res.json({ success: true });
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

// 7. Customer Cart API (Saved to database per individual customer account)
app.get('/api/cart/:customerId', (req, res) => {
  const { customerId } = req.params;
  if (!serverState.customerCarts) serverState.customerCarts = {};
  const userCart = serverState.customerCarts[customerId] || { items: [], vendor: null, updatedAt: new Date().toISOString() };
  res.json({ success: true, cart: userCart });
});

app.post('/api/cart/:customerId', (req, res) => {
  const { customerId } = req.params;
  const { items, vendor } = req.body;
  if (!serverState.customerCarts) serverState.customerCarts = {};
  serverState.customerCarts[customerId] = {
    items: Array.isArray(items) ? items : [],
    vendor: vendor || null,
    updatedAt: new Date().toISOString()
  };
  saveState(serverState);
  res.json({ success: true, cart: serverState.customerCarts[customerId] });
});

app.delete('/api/cart/:customerId', (req, res) => {
  const { customerId } = req.params;
  if (!serverState.customerCarts) serverState.customerCarts = {};
  delete serverState.customerCarts[customerId];
  saveState(serverState);
  res.json({ success: true });
});

// 8. Customers API (Customer Accounts Database)
app.get('/api/customers', (_req, res) => {
  if (!serverState.customers) serverState.customers = [];
  res.json(serverState.customers);
});

app.post('/api/customers', (req, res) => {
  const newCustomer = req.body;
  if (!serverState.customers) serverState.customers = [];
  const oldPhone = newCustomer.oldPhone;
  const cleanNewPhone = (newCustomer.phone || '').replace(/\D/g, '');
  const cleanOldPhone = (oldPhone || '').replace(/\D/g, '');

  const existingIdx = serverState.customers.findIndex(c => 
    (newCustomer.id && c.id === newCustomer.id) || 
    (cleanOldPhone && c.phone && c.phone.replace(/\D/g, '') === cleanOldPhone) ||
    (cleanNewPhone && c.phone && c.phone.replace(/\D/g, '') === cleanNewPhone)
  );

  const customerToSave = {
    ...newCustomer,
    updated_at: new Date().toISOString()
  };
  delete customerToSave.oldPhone;

  if (existingIdx >= 0) {
    serverState.customers[existingIdx] = { 
      ...serverState.customers[existingIdx], 
      ...customerToSave 
    };
  } else {
    serverState.customers.push({
      ...customerToSave,
      created_at: customerToSave.created_at || new Date().toISOString()
    });
  }

  // If phone/name changed, update customer's addresses
  if (customerToSave.phone && serverState.addresses) {
    const custId = customerToSave.id;
    serverState.addresses.forEach(a => {
      const aClean = (a.customer_phone || '').replace(/\D/g, '');
      if (
        (custId && a.customer_id === custId) || 
        (cleanOldPhone && aClean === cleanOldPhone) || 
        (cleanNewPhone && aClean === cleanNewPhone)
      ) {
        a.customer_phone = customerToSave.phone;
        if (customerToSave.name) a.customer_name = customerToSave.name;
        if (custId) a.customer_id = custId;
      }
    });
  }

  saveState(serverState);
  console.log(`[API] Customer saved/updated: ${customerToSave.name} (${customerToSave.phone})`);
  res.json({ success: true, customer: existingIdx >= 0 ? serverState.customers[existingIdx] : customerToSave });
});

// Update Customer by ID
app.put('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  if (!serverState.customers) serverState.customers = [];

  const oldPhone = updates.oldPhone;
  const cleanNewPhone = (updates.phone || '').replace(/\D/g, '');
  const cleanOldPhone = (oldPhone || '').replace(/\D/g, '');

  let existingIdx = serverState.customers.findIndex(c => c.id === id);
  if (existingIdx === -1 && cleanOldPhone) {
    existingIdx = serverState.customers.findIndex(c => 
      c.phone && c.phone.replace(/\D/g, '') === cleanOldPhone
    );
  }

  const updatesToSave = {
    ...updates,
    id,
    updated_at: new Date().toISOString()
  };
  delete updatesToSave.oldPhone;

  if (existingIdx >= 0) {
    serverState.customers[existingIdx] = {
      ...serverState.customers[existingIdx],
      ...updatesToSave
    };

    // Update addresses
    if (updatesToSave.phone && serverState.addresses) {
      serverState.addresses.forEach(a => {
        const aClean = (a.customer_phone || '').replace(/\D/g, '');
        if (
          a.customer_id === id || 
          (cleanOldPhone && aClean === cleanOldPhone) || 
          (cleanNewPhone && aClean === cleanNewPhone)
        ) {
          a.customer_phone = updatesToSave.phone;
          if (updatesToSave.name) a.customer_name = updatesToSave.name;
          a.customer_id = id;
        }
      });
    }

    saveState(serverState);
    console.log(`[API] Customer ${id} updated: ${updatesToSave.name} (${updatesToSave.phone})`);
    return res.json({ success: true, customer: serverState.customers[existingIdx] });
  }

  const newCust = {
    ...updatesToSave,
    created_at: new Date().toISOString()
  };
  serverState.customers.push(newCust);
  saveState(serverState);
  res.json({ success: true, customer: newCust });
});

// 9. Customer Addresses API (Strictly isolated by customer phone/ID)
app.get('/api/addresses/:customerIdentifier', (req, res) => {
  const { customerIdentifier } = req.params;
  const cleanId = (customerIdentifier || '').replace(/\D/g, '');
  if (!serverState.addresses) serverState.addresses = [];
  
  const userAddresses = serverState.addresses.filter(a => {
    const aPhoneClean = (a.customer_phone || '').replace(/\D/g, '');
    return (aPhoneClean && cleanId && aPhoneClean === cleanId) || 
           a.customer_id === customerIdentifier ||
           a.customer_phone === customerIdentifier;
  });
  
  res.json({ success: true, addresses: userAddresses });
});

app.post('/api/addresses/:customerIdentifier', (req, res) => {
  const { customerIdentifier } = req.params;
  const newAddress = req.body;
  if (!serverState.addresses) serverState.addresses = [];

  if (!newAddress.id) {
    newAddress.id = `addr-${Date.now()}`;
  }
  if (!newAddress.customer_phone && customerIdentifier) {
    newAddress.customer_phone = customerIdentifier;
  }

  const existingIdx = serverState.addresses.findIndex(a => a.id === newAddress.id);
  if (existingIdx >= 0) {
    serverState.addresses[existingIdx] = { ...serverState.addresses[existingIdx], ...newAddress };
  } else {
    serverState.addresses.unshift(newAddress);
  }

  saveState(serverState);
  res.json({ success: true, address: newAddress });
});

app.delete('/api/addresses/:customerIdentifier/:addressId', (req, res) => {
  const { addressId } = req.params;
  if (!serverState.addresses) serverState.addresses = [];
  serverState.addresses = serverState.addresses.filter(a => a.id !== addressId);
  saveState(serverState);
  res.json({ success: true });
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
