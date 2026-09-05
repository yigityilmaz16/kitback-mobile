export type Bind = string | number | null;
export interface Database {
  execSync(sql: string): void;
  runSync(sql: string, ...params: Bind[]): { changes: number; lastInsertRowId: number };
  getFirstSync<T>(sql: string, ...params: Bind[]): T | null;
  getAllSync<T>(sql: string, ...params: Bind[]): T[];
}
export interface Kit {
  id: number;
  name: string;
  createdAt: string;
  itemCount: number;
}
export interface Equipment {
  id: number;
  kitId: number;
  name: string;
  barcode: string;
  photo: string | null;
  createdAt: string;
}
export interface Shoot {
  id: number;
  kitId: number;
  kitName: string;
  startedAt: string;
  finishedAt: string | null;
  status: 'active' | 'completed';
  total: number;
  checked: number;
}
export interface Snapshot {
  id: number;
  sessionId: number;
  equipmentId: number;
  name: string;
  barcode: string;
  photo: string | null;
  checkedAt: string | null;
}
export type ScanResult =
  | { kind: 'checked' | 'duplicate'; name: string }
  | { kind: 'foreign' | 'unknown' | 'invalid' | 'closed' };
const now = () => new Date().toISOString();
export function validateBarcode(value: string): string {
  if (!value.trim() || value.length > 512 || /[\u0000-\u001f\u007f]/u.test(value)) {
    throw new Error(
      'Use a non-empty identifier of at most 512 characters, without control characters.',
    );
  }
  // Preserve exact identity, including significant spaces and leading zeroes.
  return value;
}
function validName(value: string): string {
  const name = value.trim();
  if (!name || name.length > 100) throw new Error('Enter a name between 1 and 100 characters.');
  return name;
}
export class Repository {
  private readonly db: Database;
  constructor(db: Database) {
    this.db = db;
  }
  private transaction<T>(work: () => T): T {
    this.db.execSync('BEGIN IMMEDIATE');
    try {
      const result = work();
      this.db.execSync('COMMIT');
      return result;
    } catch (error) {
      this.db.execSync('ROLLBACK');
      throw error;
    }
  }
  initialize(): void {
    this.db.execSync(
      'PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;',
    );
    const version =
      this.db.getFirstSync<{ user_version: number }>('PRAGMA user_version')?.user_version ?? 0;
    if (version > 1)
      throw new Error(
        'This database belongs to a newer KitBack version. Update the app; your data has not been changed.',
      );
    if (version === 1) return;
    this.transaction(() =>
      this.db.execSync(`
      CREATE TABLE kits (id INTEGER PRIMARY KEY, name TEXT NOT NULL, createdAt TEXT NOT NULL);
      CREATE TABLE equipment (
        id INTEGER PRIMARY KEY, kitId INTEGER NOT NULL REFERENCES kits(id),
        name TEXT NOT NULL, barcode TEXT NOT NULL UNIQUE, photo TEXT,
        createdAt TEXT NOT NULL, deletedAt TEXT
      );
      CREATE TABLE sessions (
        id INTEGER PRIMARY KEY, kitId INTEGER NOT NULL REFERENCES kits(id),
        kitName TEXT NOT NULL, startedAt TEXT NOT NULL, finishedAt TEXT,
        status TEXT NOT NULL CHECK(status IN ('active','completed')),
        CHECK((status = 'active' AND finishedAt IS NULL) OR (status = 'completed' AND finishedAt IS NOT NULL))
      );
      CREATE UNIQUE INDEX one_active_session_per_kit ON sessions(kitId) WHERE status = 'active';
      CREATE TABLE session_equipment (
        id INTEGER PRIMARY KEY, sessionId INTEGER NOT NULL REFERENCES sessions(id),
        equipmentId INTEGER NOT NULL, name TEXT NOT NULL, barcode TEXT NOT NULL, photo TEXT,
        UNIQUE(sessionId, barcode)
      );
      CREATE TABLE equipment_checks (
        snapshotId INTEGER PRIMARY KEY REFERENCES session_equipment(id), checkedAt TEXT NOT NULL
      );
      CREATE INDEX snapshot_session ON session_equipment(sessionId);
      CREATE INDEX equipment_kit ON equipment(kitId);
      PRAGMA user_version = 1;
    `),
    );
  }
  kits(): Kit[] {
    return this.db.getAllSync<Kit>(`SELECT k.*, COUNT(e.id) AS itemCount FROM kits k
      LEFT JOIN equipment e ON e.kitId=k.id AND e.deletedAt IS NULL GROUP BY k.id ORDER BY k.createdAt DESC, k.id DESC`);
  }
  addKit(name: string): number {
    return this.db.runSync('INSERT INTO kits(name,createdAt) VALUES(?,?)', validName(name), now())
      .lastInsertRowId;
  }
  equipment(kitId: number): Equipment[] {
    return this.db.getAllSync<Equipment>(
      'SELECT * FROM equipment WHERE kitId=? AND deletedAt IS NULL ORDER BY id',
      kitId,
    );
  }
  item(id: number): Equipment | null {
    return this.db.getFirstSync<Equipment>(
      'SELECT * FROM equipment WHERE id=? AND deletedAt IS NULL',
      id,
    );
  }
  saveEquipment(input: {
    id?: number;
    kitId: number;
    name: string;
    barcode: string;
    photo: string | null;
  }): number {
    const name = validName(input.name);
    const barcode = validateBarcode(input.barcode);
    return this.transaction(() => {
      const owner = this.db.getFirstSync<{ id: number; deletedAt: string | null }>(
        'SELECT id,deletedAt FROM equipment WHERE barcode=?',
        barcode,
      );
      if (owner && owner.id !== input.id)
        throw new Error(
          owner.deletedAt
            ? 'This identifier belongs to a deleted physical item. Use a different unique label.'
            : 'This identifier is already assigned to another physical item. Use a unique label, not a shared product barcode.',
        );
      const historical = this.db.getFirstSync<{ equipmentId: number }>(
        'SELECT equipmentId FROM session_equipment WHERE barcode=? AND equipmentId<>? LIMIT 1',
        barcode,
        input.id ?? -1,
      );
      if (historical)
        throw new Error(
          'This identifier is reserved by a previous shoot. Use a different physical label.',
        );
      if (input.id !== undefined) {
        const result = this.db.runSync(
          'UPDATE equipment SET name=?,barcode=?,photo=? WHERE id=? AND kitId=? AND deletedAt IS NULL',
          name,
          barcode,
          input.photo,
          input.id,
          input.kitId,
        );
        if (!result.changes) throw new Error('Equipment no longer exists. Return to your kit.');
        return input.id;
      }
      return this.db.runSync(
        'INSERT INTO equipment(kitId,name,barcode,photo,createdAt) VALUES(?,?,?,?,?)',
        input.kitId,
        name,
        barcode,
        input.photo,
        now(),
      ).lastInsertRowId;
    });
  }
  deleteEquipment(id: number): void {
    const result = this.db.runSync(
      'UPDATE equipment SET deletedAt=? WHERE id=? AND deletedAt IS NULL',
      now(),
      id,
    );
    if (!result.changes) throw new Error('Equipment has already been removed.');
  }
  sessions(kitId?: number): Shoot[] {
    return this.db.getAllSync<Shoot>(
      `SELECT s.*, COUNT(se.id) AS total, COUNT(c.snapshotId) AS checked
      FROM sessions s LEFT JOIN session_equipment se ON se.sessionId=s.id
      LEFT JOIN equipment_checks c ON c.snapshotId=se.id
      ${kitId === undefined ? '' : 'WHERE s.kitId=?'}
      GROUP BY s.id ORDER BY s.startedAt DESC,s.id DESC`,
      ...(kitId === undefined ? [] : [kitId]),
    );
  }
  session(id: number): Shoot {
    const session = this.sessions().find((s) => s.id === id);
    if (!session) throw new Error('Session not found.');
    return session;
  }
  startSession(kitId: number): number {
    return this.transaction(() => {
      const active = this.db.getFirstSync<{ id: number }>(
        "SELECT id FROM sessions WHERE kitId=? AND status='active'",
        kitId,
      );
      if (active) return active.id;
      const kit = this.db.getFirstSync<{ name: string }>('SELECT name FROM kits WHERE id=?', kitId);
      if (!kit) throw new Error('Kit not found.');
      const items = this.equipment(kitId);
      if (!items.length) throw new Error('Add equipment before starting a shoot.');
      const id = this.db.runSync(
        "INSERT INTO sessions(kitId,kitName,startedAt,status) VALUES(?,?,?,'active')",
        kitId,
        kit.name,
        now(),
      ).lastInsertRowId;
      this.db.runSync(
        `INSERT INTO session_equipment(sessionId,equipmentId,name,barcode,photo)
        SELECT ?,id,name,barcode,photo FROM equipment WHERE kitId=? AND deletedAt IS NULL`,
        id,
        kitId,
      );
      return id;
    });
  }
  snapshot(sessionId: number): Snapshot[] {
    return this.db.getAllSync<Snapshot>(
      `SELECT se.*,c.checkedAt FROM session_equipment se
      LEFT JOIN equipment_checks c ON c.snapshotId=se.id WHERE se.sessionId=? ORDER BY se.id`,
      sessionId,
    );
  }
  scan(sessionId: number, raw: string): ScanResult {
    try {
      validateBarcode(raw);
    } catch {
      return { kind: 'invalid' };
    }
    return this.transaction(() => {
      const session = this.db.getFirstSync<{ status: string }>(
        'SELECT status FROM sessions WHERE id=?',
        sessionId,
      );
      if (!session || session.status !== 'active') return { kind: 'closed' };
      const expected = this.db.getFirstSync<{ id: number; name: string }>(
        'SELECT id,name FROM session_equipment WHERE sessionId=? AND barcode=?',
        sessionId,
        raw,
      );
      if (!expected) {
        const known = this.db.getFirstSync<{ id: number }>(
          'SELECT id FROM equipment WHERE barcode=?',
          raw,
        );
        return { kind: known ? 'foreign' : 'unknown' };
      }
      const result = this.db.runSync(
        'INSERT INTO equipment_checks(snapshotId,checkedAt) VALUES(?,?) ON CONFLICT(snapshotId) DO NOTHING',
        expected.id,
        now(),
      );
      return { kind: result.changes ? 'checked' : 'duplicate', name: expected.name };
    });
  }
  uncheck(sessionId: number, snapshotId: number): void {
    this.transaction(() => {
      if (this.session(sessionId).status !== 'active')
        throw new Error('Completed sessions cannot be changed.');
      this.db.runSync(
        'DELETE FROM equipment_checks WHERE snapshotId IN (SELECT id FROM session_equipment WHERE id=? AND sessionId=?)',
        snapshotId,
        sessionId,
      );
    });
  }
  finishSession(id: number): void {
    this.transaction(() => {
      const session = this.session(id);
      if (session.status === 'completed') return;
      if (!session.total || session.checked !== session.total)
        throw new Error('Check all expected equipment before completing this session.');
      this.db.runSync("UPDATE sessions SET status='completed',finishedAt=? WHERE id=?", now(), id);
    });
  }
}
