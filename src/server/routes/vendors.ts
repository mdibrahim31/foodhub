import { Router } from 'express';

export function createVendorsRouter(serverState: any, saveState: (state: any) => void) {
  const router = Router();

  // Get Vendors
  router.get('/', (_req, res) => {
    if (!serverState.vendors) serverState.vendors = [];
    res.json(serverState.vendors);
  });

  // Create Vendor
  router.post('/', (req, res) => {
    if (!serverState.vendors) serverState.vendors = [];
    const newVendor = req.body;
    if (!newVendor.id) newVendor.id = `v-${Date.now()}`;
    const existingIdx = serverState.vendors.findIndex((v: any) => v.id === newVendor.id || (newVendor.phone && v.phone === newVendor.phone));
    if (existingIdx >= 0) {
      serverState.vendors[existingIdx] = { ...serverState.vendors[existingIdx], ...newVendor, updated_at: new Date().toISOString() };
      saveState(serverState);
      return res.json({ success: true, vendor: serverState.vendors[existingIdx] });
    }
    serverState.vendors.unshift(newVendor);
    saveState(serverState);
    res.json({ success: true, vendor: newVendor });
  });

  // Update Vendor
  router.put('/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    if (!serverState.vendors) serverState.vendors = [];
    const idx = serverState.vendors.findIndex((v: any) => v.id === id);
    if (idx >= 0) {
      serverState.vendors[idx] = { ...serverState.vendors[idx], ...updates, updated_at: new Date().toISOString() };
      saveState(serverState);
      return res.json({ success: true, vendor: serverState.vendors[idx] });
    }
    res.status(404).json({ success: false, message: 'Vendor not found' });
  });

  // Delete Vendor
  router.delete('/:id', (req, res) => {
    const { id } = req.params;
    if (!serverState.vendors) serverState.vendors = [];
    serverState.vendors = serverState.vendors.filter((v: any) => v.id !== id);
    saveState(serverState);
    res.json({ success: true });
  });

  return router;
}
