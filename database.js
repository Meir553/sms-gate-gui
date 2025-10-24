const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class Database {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const dbPath = path.join(__dirname, 'webhooks.db');
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          this.createTables()
            .then(() => this.migrateDatabase())
            .then(resolve)
            .catch(reject);
        }
      });
    });
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      const createWebhooksTable = `
        CREATE TABLE IF NOT EXISTS webhooks (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          webhook_url TEXT NOT NULL,
          username TEXT NOT NULL,
          password TEXT NOT NULL,
          field_mappings TEXT NOT NULL,
          is_active BOOLEAN DEFAULT 1,
          is_development BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      const createWebhookLogsTable = `
        CREATE TABLE IF NOT EXISTS webhook_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          webhook_id TEXT NOT NULL,
          method TEXT NOT NULL,
          headers TEXT NOT NULL,
          body TEXT,
          query_params TEXT,
          processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          status TEXT DEFAULT 'pending',
          error_message TEXT,
          FOREIGN KEY (webhook_id) REFERENCES webhooks (id)
        )
      `;

      this.db.exec(createWebhooksTable, (err) => {
        if (err) {
          console.error('Error creating webhooks table:', err);
          reject(err);
        } else {
          this.db.exec(createWebhookLogsTable, (err) => {
            if (err) {
              console.error('Error creating webhook_logs table:', err);
              reject(err);
            } else {
              console.log('Database tables created successfully');
              resolve();
            }
          });
        }
      });
    });
  }

  async migrateDatabase() {
    return new Promise((resolve, reject) => {
      // Add is_development column if it doesn't exist
      const addDevelopmentColumn = `
        ALTER TABLE webhooks ADD COLUMN is_development BOOLEAN DEFAULT 0
      `;
      
      this.db.run(addDevelopmentColumn, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding is_development column:', err);
          reject(err);
        } else {
          console.log('Database migration completed');
          resolve();
        }
      });
    });
  }

  async createWebhook(webhookData) {
    return new Promise((resolve, reject) => {
      const { name, description, webhook_id, webhook_url, username, password, field_mappings, is_development = false } = webhookData;
      
      // Use custom webhook_id if provided, otherwise generate UUID
      const id = webhook_id || uuidv4();
      
      const sql = `
        INSERT INTO webhooks (id, name, description, webhook_url, username, password, field_mappings, is_development)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      this.db.run(sql, [id, name, description, webhook_url, username, password, JSON.stringify(field_mappings), is_development], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, ...webhookData });
        }
      });
    });
  }

  async getWebhooksByUser(username) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM webhooks WHERE username = ? ORDER BY created_at DESC';
      this.db.all(sql, [username], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const webhooks = rows.map(row => ({
            ...row,
            field_mappings: JSON.parse(row.field_mappings)
          }));
          resolve(webhooks);
        }
      });
    });
  }

  async getWebhookById(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM webhooks WHERE id = ?';
      this.db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve({
            ...row,
            field_mappings: JSON.parse(row.field_mappings)
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  async updateWebhook(id, webhookData) {
    return new Promise((resolve, reject) => {
      const { name, description, webhook_url, field_mappings, is_active, is_development = false } = webhookData;
      
      const sql = `
        UPDATE webhooks 
        SET name = ?, description = ?, webhook_url = ?, field_mappings = ?, is_active = ?, is_development = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      this.db.run(sql, [name, description, webhook_url, JSON.stringify(field_mappings), is_active, is_development, id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, ...webhookData });
        }
      });
    });
  }

  async deleteWebhook(id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM webhooks WHERE id = ?';
      this.db.run(sql, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ deleted: this.changes > 0 });
        }
      });
    });
  }

  async logWebhookRequest(webhookId, method, headers, body, queryParams) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO webhook_logs (webhook_id, method, headers, body, query_params)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      this.db.run(sql, [
        webhookId,
        method,
        JSON.stringify(headers),
        body ? JSON.stringify(body) : null,
        queryParams ? JSON.stringify(queryParams) : null
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      });
    });
  }

  async getWebhookLogs(webhookId, limit = 50) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM webhook_logs 
        WHERE webhook_id = ? 
        ORDER BY processed_at DESC 
        LIMIT ?
      `;
      
      this.db.all(sql, [webhookId, limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const logs = rows.map(row => ({
            ...row,
            headers: JSON.parse(row.headers),
            body: row.body ? JSON.parse(row.body) : null,
            query_params: row.query_params ? JSON.parse(row.query_params) : null
          }));
          resolve(logs);
        }
      });
    });
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = new Database();
