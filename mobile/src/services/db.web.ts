export interface OfflineBreakdown {
  id: string;
  machineId: string;
  machineName: string;
  shift: string;
  category: string;
  problemType: string;
  description: string;
  priority: string;
  imageUri: string | null;
  status: string;
  createdAt: string;
}

// In-memory mock for Web Fallback
let mockBreakdowns: OfflineBreakdown[] = [];
let mockMachines: any[] = [];

export function getDB(): any {
  return {
    execSync: () => {},
    runSync: () => {},
    getAllSync: () => []
  };
}

export function saveOfflineBreakdown(item: Omit<OfflineBreakdown, 'status' | 'createdAt'>): void {
  const createdAt = new Date().toISOString();
  mockBreakdowns.push({ ...item, status: 'PENDING_SYNC', createdAt });
  console.log('[Web Fallback] Saved offline breakdown to memory:', item.id);
}

export function getPendingBreakdowns(): OfflineBreakdown[] {
  return mockBreakdowns.filter(b => b.status === 'PENDING_SYNC');
}

export function updateOfflineStatus(id: string, status: string): void {
  const b = mockBreakdowns.find(b => b.id === id);
  if (b) b.status = status;
}

export function deleteOfflineBreakdown(id: string): void {
  mockBreakdowns = mockBreakdowns.filter(b => b.id !== id);
}

export function cacheMachines(machines: Array<{ id: string; machineId: string; name: string; category: string; units: string }>): void {
  mockMachines = [...machines];
  console.log('[Web Fallback] Cached machines to memory:', machines.length);
}

export function getCachedMachines(): Array<{ id: string; machineId: string; name: string; category: string; units: string }> {
  return mockMachines;
}
