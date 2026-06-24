import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export function getDB(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('cmms_offline.db');
    
    // Initialize Schema
    dbInstance.execSync(`
      CREATE TABLE IF NOT EXISTS offline_breakdowns (
        id TEXT PRIMARY KEY NOT NULL,
        machineId TEXT NOT NULL,
        machineName TEXT NOT NULL,
        shift TEXT NOT NULL,
        category TEXT NOT NULL,
        problemType TEXT NOT NULL,
        description TEXT NOT NULL,
        priority TEXT NOT NULL,
        imageUri TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING_SYNC',
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS machines_cache (
        id TEXT PRIMARY KEY NOT NULL,
        machineId TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        units TEXT NOT NULL
      );
    `);
  }
  return dbInstance;
}

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

export function saveOfflineBreakdown(item: Omit<OfflineBreakdown, 'status' | 'createdAt'>): void {
  const db = getDB();
  const createdAt = new Date().toISOString();
  db.runSync(
    `INSERT INTO offline_breakdowns (id, machineId, machineName, shift, category, problemType, description, priority, imageUri, status, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_SYNC', ?)`,
    [
      item.id,
      item.machineId,
      item.machineName,
      item.shift,
      item.category,
      item.problemType,
      item.description,
      item.priority,
      item.imageUri || null,
      createdAt
    ]
  );
}

export function getPendingBreakdowns(): OfflineBreakdown[] {
  const db = getDB();
  return db.getAllSync<OfflineBreakdown>(
    `SELECT * FROM offline_breakdowns WHERE status = 'PENDING_SYNC' ORDER BY createdAt DESC`
  );
}

export function updateOfflineStatus(id: string, status: string): void {
  const db = getDB();
  db.runSync(
    `UPDATE offline_breakdowns SET status = ? WHERE id = ?`,
    [status, id]
  );
}

export function deleteOfflineBreakdown(id: string): void {
  const db = getDB();
  db.runSync(
    `DELETE FROM offline_breakdowns WHERE id = ?`,
    [id]
  );
}

export function cacheMachines(machines: Array<{ id: string; machineId: string; name: string; category: string; units: string }>): void {
  const db = getDB();
  db.runSync(`DELETE FROM machines_cache`);
  for (const m of machines) {
    db.runSync(
      `INSERT INTO machines_cache (id, machineId, name, category, units) VALUES (?, ?, ?, ?, ?)`,
      [m.id, m.machineId, m.name, m.category, m.units]
    );
  }
}

export function getCachedMachines(): Array<{ id: string; machineId: string; name: string; category: string; units: string }> {
  const db = getDB();
  return db.getAllSync<{ id: string; machineId: string; name: string; category: string; units: string }>(
    `SELECT * FROM machines_cache`
  );
}
