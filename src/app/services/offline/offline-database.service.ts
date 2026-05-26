import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

export type OfflineRecordType =
  | 'branches'
  | 'configs'
  | 'products'
  | 'clients'
  | 'orders'
  | 'order_items'
  | 'utils_sellers'
  | 'utils_movements'
  | 'utils_payments'
  | 'utils_cest'
  | 'utils_fiscal_classifications'
  | 'utils_groups'
  | 'utils_manufacturers'
  | 'utils_units';

export type PendingMutationStatus = 'pending' | 'sending' | 'sent' | 'error';

export interface PendingMutation {
  id: string;
  type: string;
  method: string;
  url: string;
  payload: any;
  status: PendingMutationStatus;
  attempts: number;
  last_error?: string | null;
  offline_request_id?: string | null;
  created_at: string;
  updated_at: string;
  user_id?: string | number | null;
  codempresa?: number | null;
  codfilial?: number | null;
}

type StoredRecord = {
  type: OfflineRecordType;
  key: string;
  codempresa?: number | null;
  codfilial?: number | null;
  searchText?: string;
  data: any;
  updatedAt?: string;
};

const dbName = 'motter_offline';
const recordsKey = 'offline_records_v1';
const pendingKey = 'pending_mutations_v1';
const metaKey = 'offline_meta_v1';

@Injectable({
  providedIn: 'root'
})
export class OfflineDatabaseService {
  private sqlite: any = null;
  private db: any = null;
  private initPromise: Promise<void> | null = null;

  async init() {
    if (!this.initPromise) {
      this.initPromise = this.initDatabase();
    }

    return this.initPromise;
  }

  async upsertRecords(type: OfflineRecordType, items: any[], keyField: string | ((item: any) => string)) {
    await this.init();
    const records = (items || [])
      .map((item) => this.normalizeRecord(type, item, keyField))
      .filter((record) => record.key);

    if (!records.length) {
      return;
    }

    if (!this.db) {
      const stored = this.readStorage<Record<string, StoredRecord>>(recordsKey, {});
      records.forEach((record) => stored[`${type}:${record.key}`] = record);
      this.writeStorage(recordsKey, stored);
      return;
    }

    for (const record of records) {
      await this.db.run(
        `INSERT OR REPLACE INTO offline_records
          (type, record_key, codempresa, codfilial, search_text, json_data, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          record.type,
          record.key,
          record.codempresa ?? null,
          record.codfilial ?? null,
          record.searchText || '',
          JSON.stringify(record.data),
          record.updatedAt || new Date().toISOString(),
        ]
      );
    }
  }

  async queryRecords<T = any>(type: OfflineRecordType, options: { search?: string; searchType?: string; codfilial?: number | string | null } = {}): Promise<T[]> {
    await this.init();
    const search = this.normalizeSearch(options.search);
    const searchType = options.searchType || 'contains';

    if (!this.db) {
      const stored = Object.values(this.readStorage<Record<string, StoredRecord>>(recordsKey, {}))
        .filter((record) => record.type === type && this.matchesBranch(record, options.codfilial))
        .filter((record) => this.matchesSearch(record.searchText || '', search, searchType));
      return stored.map((record) => record.data as T);
    }

    const params: any[] = [type];
    let sql = 'SELECT json_data FROM offline_records WHERE type = ?';

    if (options.codfilial) {
      sql += ' AND codfilial = ?';
      params.push(Number(options.codfilial));
    }

    if (search) {
      sql += ' AND search_text LIKE ?';
      params.push(searchType === 'starts' ? `${search}%` : `%${search}%`);
    }

    const result = await this.db.query(sql, params);
    return (result.values || []).map((row: any) => JSON.parse(row.json_data) as T);
  }

  async getRecord<T = any>(type: OfflineRecordType, key: string): Promise<T | null> {
    await this.init();

    if (!this.db) {
      return this.readStorage<Record<string, StoredRecord>>(recordsKey, {})[`${type}:${key}`]?.data || null;
    }

    const result = await this.db.query(
      'SELECT json_data FROM offline_records WHERE type = ? AND record_key = ? LIMIT 1',
      [type, key]
    );

    return result.values?.[0]?.json_data ? JSON.parse(result.values[0].json_data) : null;
  }

  async countRecords(type: OfflineRecordType) {
    await this.init();

    if (!this.db) {
      return Object.values(this.readStorage<Record<string, StoredRecord>>(recordsKey, {}))
        .filter((record) => record.type === type).length;
    }

    const result = await this.db.query('SELECT COUNT(*) as total FROM offline_records WHERE type = ?', [type]);
    return Number(result.values?.[0]?.total || 0);
  }

  async savePendingMutation(mutation: PendingMutation) {
    await this.init();
    const normalized = { ...mutation, updated_at: new Date().toISOString() };

    if (!this.db) {
      const pending = this.readStorage<Record<string, PendingMutation>>(pendingKey, {});
      pending[normalized.id] = normalized;
      this.writeStorage(pendingKey, pending);
      return normalized;
    }

    await this.db.run(
      `INSERT OR REPLACE INTO pending_mutations
        (id, type, method, url, payload, status, attempts, last_error, offline_request_id, created_at, updated_at, user_id, codempresa, codfilial)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        normalized.id,
        normalized.type,
        normalized.method,
        normalized.url,
        JSON.stringify(normalized.payload || {}),
        normalized.status,
        Number(normalized.attempts || 0),
        normalized.last_error || null,
        normalized.offline_request_id || null,
        normalized.created_at,
        normalized.updated_at,
        normalized.user_id || null,
        normalized.codempresa || null,
        normalized.codfilial || null,
      ]
    );

    return normalized;
  }

  async listPendingMutations(statuses: PendingMutationStatus[] = ['pending', 'error']) {
    await this.init();

    if (!this.db) {
      return Object.values(this.readStorage<Record<string, PendingMutation>>(pendingKey, {}))
        .filter((item) => statuses.includes(item.status));
    }

    const placeholders = statuses.map(() => '?').join(',');
    const result = await this.db.query(
      `SELECT * FROM pending_mutations WHERE status IN (${placeholders}) ORDER BY created_at ASC`,
      statuses
    );

    return (result.values || []).map((row: any) => this.rowToPending(row));
  }

  async updatePendingMutation(id: string, patch: Partial<PendingMutation>) {
    const current = (await this.listAllPendingMutations()).find((item) => item.id === id);

    if (!current) {
      return null;
    }

    return this.savePendingMutation({ ...current, ...patch });
  }

  async setMeta(key: string, value: any) {
    await this.init();
    const payload = JSON.stringify(value);
    const updatedAt = new Date().toISOString();

    if (!this.db) {
      const meta = this.readStorage<Record<string, any>>(metaKey, {});
      meta[key] = { value, updatedAt };
      this.writeStorage(metaKey, meta);
      return;
    }

    await this.db.run(
      'INSERT OR REPLACE INTO sync_meta (meta_key, meta_value, updated_at) VALUES (?, ?, ?)',
      [key, payload, updatedAt]
    );
  }

  async getMeta<T = any>(key: string): Promise<T | null> {
    await this.init();

    if (!this.db) {
      return this.readStorage<Record<string, any>>(metaKey, {})[key]?.value || null;
    }

    const result = await this.db.query('SELECT meta_value FROM sync_meta WHERE meta_key = ? LIMIT 1', [key]);
    return result.values?.[0]?.meta_value ? JSON.parse(result.values[0].meta_value) as T : null;
  }

  async stats() {
    const [products, clients, orders, pending, lastSync] = await Promise.all([
      this.countRecords('products'),
      this.countRecords('clients'),
      this.countRecords('orders'),
      this.listPendingMutations(['pending', 'error', 'sending']),
      this.getMeta<string>('last_full_sync'),
    ]);

    return { products, clients, orders, pending: pending.length, lastSync };
  }

  private async listAllPendingMutations() {
    await this.init();

    if (!this.db) {
      return Object.values(this.readStorage<Record<string, PendingMutation>>(pendingKey, {}));
    }

    const result = await this.db.query('SELECT * FROM pending_mutations ORDER BY created_at ASC');
    return (result.values || []).map((row: any) => this.rowToPending(row));
  }

  private async initDatabase() {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      const sqliteModule = await import('@capacitor-community/sqlite');
      this.sqlite = this.sqlite || new sqliteModule.SQLiteConnection(sqliteModule.CapacitorSQLite);
      const consistent = await this.sqlite.checkConnectionsConsistency();

      if (!consistent.result) {
        await this.sqlite.closeAllConnections();
      }

      const hasConnection = await this.sqlite.isConnection(dbName, false);
      this.db = hasConnection.result
        ? await this.sqlite.retrieveConnection(dbName, false)
        : await this.sqlite.createConnection(dbName, false, 'no-encryption', 1, false);

      await this.db.open();
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS offline_records (
          type TEXT NOT NULL,
          record_key TEXT NOT NULL,
          codempresa INTEGER,
          codfilial INTEGER,
          search_text TEXT,
          json_data TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          PRIMARY KEY(type, record_key)
        );
        CREATE INDEX IF NOT EXISTS idx_offline_records_search ON offline_records(type, search_text);
        CREATE INDEX IF NOT EXISTS idx_offline_records_branch ON offline_records(type, codempresa, codfilial);
        CREATE TABLE IF NOT EXISTS pending_mutations (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          method TEXT NOT NULL,
          url TEXT NOT NULL,
          payload TEXT NOT NULL,
          status TEXT NOT NULL,
          attempts INTEGER NOT NULL DEFAULT 0,
          last_error TEXT,
          offline_request_id TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          user_id TEXT,
          codempresa INTEGER,
          codfilial INTEGER
        );
        CREATE INDEX IF NOT EXISTS idx_pending_mutations_status ON pending_mutations(status, created_at);
        CREATE TABLE IF NOT EXISTS sync_meta (
          meta_key TEXT PRIMARY KEY,
          meta_value TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
    } catch (error) {
      console.log('SQLite indisponivel, usando fallback localStorage.', error);
      this.db = null;
    }
  }

  private normalizeRecord(type: OfflineRecordType, item: any, keyField: string | ((item: any) => string)): StoredRecord {
    const key = typeof keyField === 'function' ? keyField(item) : item?.[keyField];

    return {
      type,
      key: String(key || ''),
      codempresa: Number(item?.CODEMPRESA ?? item?.codempresa ?? 0) || null,
      codfilial: Number(item?.CODFILIAL ?? item?.codfilial ?? 0) || null,
      searchText: this.buildSearchText(item),
      data: item,
      updatedAt: new Date().toISOString(),
    };
  }

  private buildSearchText(item: any) {
    return [
      item?.CODPRD,
      item?.CODCFO,
      item?.IDMOV,
      item?.NUMEROMOV,
      item?.NOMEFANTASIA,
      item?.RAZAOSOCIAL,
      item?.DESCRICAO,
      item?.CODBARRAS,
      item?.CGCCFO,
      item?.CGC,
      item?.CIDADE,
    ]
      .filter((value) => value !== undefined && value !== null)
      .join(' ')
      .toUpperCase();
  }

  private normalizeSearch(value: any) {
    return String(value || '').trim().toUpperCase();
  }

  private matchesSearch(searchText: string, search: string, searchType: string) {
    if (!search) {
      return true;
    }

    const tokens = searchText.split(/\s+/).filter(Boolean);

    if (searchType === 'equals') {
      return tokens.includes(search);
    }

    if (searchType === 'starts') {
      return tokens.some((token) => token.startsWith(search));
    }

    return searchText.includes(search);
  }

  private matchesBranch(record: StoredRecord, codfilial?: number | string | null) {
    return !codfilial || Number(record.codfilial || 0) === Number(codfilial);
  }

  private rowToPending(row: any): PendingMutation {
    return {
      id: row.id,
      type: row.type,
      method: row.method,
      url: row.url,
      payload: JSON.parse(row.payload || '{}'),
      status: row.status,
      attempts: Number(row.attempts || 0),
      last_error: row.last_error,
      offline_request_id: row.offline_request_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user_id: row.user_id,
      codempresa: row.codempresa,
      codfilial: row.codfilial,
    };
  }

  private readStorage<T>(key: string, fallback: T): T {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) as T : fallback;
    } catch {
      return fallback;
    }
  }

  private writeStorage(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}
