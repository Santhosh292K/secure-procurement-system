/**
 * Database Connection and Initialization
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH || './data/procurement.db';

export class Database {
  private static instance: sqlite3.Database | null = null;

  /**
   * Get database instance
   */
  static getInstance(): sqlite3.Database {
    if (!this.instance) {
      // Ensure data directory exists
      const dbDir = path.dirname(DB_PATH);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.instance = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          throw err;
        }
        console.log('✓ Connected to SQLite database');
      });

      // Enable foreign keys
      this.instance.run('PRAGMA foreign_keys = ON');
    }

    return this.instance;
  }

  /**
   * Run a query
   */
  static run(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getInstance().run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  /**
   * Get single row
   */
  static get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      this.getInstance().get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row as T);
      });
    });
  }

  /**
   * Get all rows
   */
  static all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.getInstance().all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as T[]);
      });
    });
  }

  /**
   * Close database connection
   */
  static close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.instance) {
        this.instance.close((err) => {
          if (err) reject(err);
          else {
            this.instance = null;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Initialize database schema
   */
  static async initialize(): Promise<void> {
    console.log('Initializing database schema...');

    // Users table
    await this.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT CHECK(role IN ('admin', 'vendor', 'approver')) NOT NULL,
        company_name TEXT,
        phone TEXT,
        password_changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        password_expires_at DATETIME,
        failed_login_attempts INTEGER DEFAULT 0,
        locked_until DATETIME,
        mfa_enabled BOOLEAN DEFAULT 0,
        mfa_secret TEXT,
        backup_codes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1
      )
    `);

    // RFQs table
    await this.run(`
      CREATE TABLE IF NOT EXISTS rfqs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rfq_number TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        requirements TEXT,
        created_by INTEGER NOT NULL,
        status TEXT CHECK(status IN ('draft', 'published', 'closed', 'awarded')) DEFAULT 'draft',
        deadline DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Quotations table
    await this.run(`
      CREATE TABLE IF NOT EXISTS quotations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rfq_id INTEGER NOT NULL,
        vendor_id INTEGER NOT NULL,
        quote_number TEXT UNIQUE NOT NULL,
        total_amount REAL NOT NULL,
        currency TEXT DEFAULT 'USD',
        line_items TEXT NOT NULL,
        terms_conditions TEXT,
        encrypted_data TEXT,
        encryption_key_hash TEXT,
        digital_signature TEXT,
        public_key TEXT,
        status TEXT CHECK(status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'revision_requested', 'negotiating')) DEFAULT 'draft',
        submitted_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (rfq_id) REFERENCES rfqs(id),
        FOREIGN KEY (vendor_id) REFERENCES users(id)
      )
    `);

    // Approvals table
    await this.run(`
      CREATE TABLE IF NOT EXISTS approvals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quotation_id INTEGER NOT NULL,
        approver_id INTEGER NOT NULL,
        level INTEGER NOT NULL,
        status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
        comments TEXT,
        approved_at DATETIME,
        signature_hash TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quotation_id) REFERENCES quotations(id),
        FOREIGN KEY (approver_id) REFERENCES users(id)
      )
    `);

    // Audit logs table
    await this.run(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id INTEGER,
        details TEXT,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Quotation Revisions table (for negotiation & version tracking)
    await this.run(`
      CREATE TABLE IF NOT EXISTS quotation_revisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quotation_id INTEGER NOT NULL,
        version INTEGER NOT NULL,
        total_amount REAL NOT NULL,
        currency TEXT DEFAULT 'USD',
        line_items TEXT NOT NULL,
        delivery_time TEXT,
        validity_period INTEGER,
        notes TEXT,
        changed_by INTEGER NOT NULL,
        change_reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quotation_id) REFERENCES quotations(id),
        FOREIGN KEY (changed_by) REFERENCES users(id),
        UNIQUE(quotation_id, version)
      )
    `);

    // Quotation Comments table (for discussion/negotiation)
    await this.run(`
      CREATE TABLE IF NOT EXISTS quotation_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quotation_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        comment TEXT NOT NULL,
        comment_type TEXT CHECK(comment_type IN ('general', 'revision_request', 'counter_offer', 'clarification')) DEFAULT 'general',
        is_internal BOOLEAN DEFAULT 0,
        parent_comment_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quotation_id) REFERENCES quotations(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (parent_comment_id) REFERENCES quotation_comments(id)
      )
    `);

    // Security demos table
    await this.run(`
      CREATE TABLE IF NOT EXISTS security_demos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        demo_type TEXT CHECK(demo_type IN ('base64', 'xor', 'hash', 'signature', 'password')) NOT NULL,
        input_data TEXT NOT NULL,
        output_data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Password history table
    await this.run(`
      CREATE TABLE IF NOT EXISTS password_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Sessions table
    await this.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        session_token TEXT UNIQUE NOT NULL,
        device_info TEXT,
        ip_address TEXT,
        user_agent TEXT,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Security events table
    await this.run(`
      CREATE TABLE IF NOT EXISTS security_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        event_type TEXT CHECK(event_type IN ('failed_login', 'account_locked', 'password_changed', 'mfa_enabled', 'mfa_disabled', 'suspicious_activity', 'brute_force_attempt')) NOT NULL,
        severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
        ip_address TEXT,
        user_agent TEXT,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Blocked IPs table
    await this.run(`
      CREATE TABLE IF NOT EXISTS blocked_ips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_address TEXT UNIQUE NOT NULL,
        reason TEXT NOT NULL,
        blocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        is_permanent BOOLEAN DEFAULT 0
      )
    `);

    // Create indexes for better performance
    await this.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await this.run('CREATE INDEX IF NOT EXISTS idx_rfqs_status ON rfqs(status)');
    await this.run('CREATE INDEX IF NOT EXISTS idx_quotations_rfq ON quotations(rfq_id)');
    await this.run('CREATE INDEX IF NOT EXISTS idx_quotations_vendor ON quotations(vendor_id)');
    await this.run('CREATE INDEX IF NOT EXISTS idx_approvals_quotation ON approvals(quotation_id)');
    await this.run('CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)');
    await this.run('CREATE INDEX IF NOT EXISTS idx_quotation_revisions_quotation ON quotation_revisions(quotation_id)');
    await this.run('CREATE INDEX IF NOT EXISTS idx_quotation_comments_quotation ON quotation_comments(quotation_id)');
    await this.run('CREATE INDEX IF NOT EXISTS idx_quotation_comments_user ON quotation_comments(user_id)');
    await this.run('CREATE INDEX IF NOT EXISTS idx_password_history_user ON password_history(user_id)');
    await this.run('CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)');
    await this.run('CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token)');
    await this.run('CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id)');
    await this.run('CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type)');
    await this.run('CREATE INDEX IF NOT EXISTS idx_blocked_ips_address ON blocked_ips(ip_address)');

    console.log('✓ Database schema initialized');
  }
}
