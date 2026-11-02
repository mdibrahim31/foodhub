import { Router } from 'express';

export function createZonesRouter(serverState: any, saveState: (state: any) => void) {
  const router = Router();

  // Get Zones
  router.get('/', (_req, res) => {
    if (!serverState.zones || !Array.isArray(serverState.zones) || serverState.zones.length === 0) {
      serverState.zones = [
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
        }
      ];
      saveState(serverState);
    }
    res.json(serverState.zones);
  });

  // Create Zone
  router.post('/', (req, res) => {
    const newZone = req.body;
    if (!newZone.id) {
      newZone.id = `zone-${Date.now()}`;
    }
    if (!serverState.zones) serverState.zones = [];
    
    const existingIdx = serverState.zones.findIndex((z: any) => z.id === newZone.id || (newZone.name && z.name.toLowerCase() === newZone.name.toLowerCase()));
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
    res.json({ success: true, zone: zoneToSave });
  });

  // Update Zone
  router.put('/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    if (!serverState.zones) serverState.zones = [];

    const idx = serverState.zones.findIndex((z: any) => z.id === id);
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
  router.delete('/:id', (req, res) => {
    const { id } = req.params;
    if (!serverState.zones) serverState.zones = [];
    serverState.zones = serverState.zones.filter((z: any) => z.id !== id);
    saveState(serverState);
    res.json({ success: true });
  });

  return router;
}
