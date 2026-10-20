/**
 * SQLite database — The 2am Shoppers (v3)
 * Three modes: student, working adult, business.
 *
 * Shopper financial records (savings, expenses) are kept in
 * separate tables from merchant CRM records. The app never
 * exposes shopper balances or goal details to the business side.
 */
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH   = path.join(__dirname, '..', '..', 'data', '2am-shoppers.db');

let db;
export function getDb() {
  if (!db) throw new Error('Database not initialised. Call initDb() first.');
  return db;
}

export function initDb() {
  mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    -- ── Shopper profiles ────────────────────────────────────
    CREATE TABLE IF NOT EXISTS shopper_profiles (
      id               TEXT PRIMARY KEY,
      name             TEXT NOT NULL,
      user_type        TEXT NOT NULL CHECK(user_type IN ('student','working')),
      interests        TEXT,          -- JSON array
      budget           REAL,
      quiet_start      TEXT,
      quiet_end        TEXT,
      payday_date      TEXT,
      notif_freq       TEXT DEFAULT 'occasional',
      -- student fields
      allowance        REAL,
      allowance_period TEXT DEFAULT 'weekly',
      essential_student REAL,
      gamification     INTEGER DEFAULT 1,
      -- working adult fields
      income           REAL,
      essential_reserve REAL,
      savings_allocation REAL,
      buffer           REAL,
      planning_period  TEXT DEFAULT 'monthly',
      created_at       TEXT DEFAULT (datetime('now'))
    );

    -- ── Wishlist ─────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS wishlist (
      id              TEXT PRIMARY KEY,
      shopper_id      TEXT NOT NULL REFERENCES shopper_profiles(id) ON DELETE CASCADE,
      title           TEXT NOT NULL,
      url             TEXT,
      price           REAL,
      budget          REAL,
      reminder_date   TEXT,
      notes           TEXT,
      goal_id         TEXT,           -- linked savings goal
      saved_at        TEXT DEFAULT (datetime('now'))
    );

    -- ── Savings goals ────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS savings_goals (
      id                    TEXT PRIMARY KEY,
      shopper_id            TEXT NOT NULL REFERENCES shopper_profiles(id) ON DELETE CASCADE,
      name                  TEXT NOT NULL,
      icon                  TEXT DEFAULT '🎯',
      target_amount         REAL NOT NULL,
      current_amount        REAL DEFAULT 0,
      contribution_amount   REAL DEFAULT 0,
      contribution_frequency TEXT DEFAULT 'weekly',
      linked_wishlist_id    TEXT REFERENCES wishlist(id),
      status                TEXT DEFAULT 'active' CHECK(status IN ('active','paused','complete')),
      created_at            TEXT DEFAULT (datetime('now'))
    );

    -- ── Savings ledger ───────────────────────────────────────
    -- Planning ledger only. Does not represent real fund transfers.
    CREATE TABLE IF NOT EXISTS savings_ledger (
      id         TEXT PRIMARY KEY,
      goal_id    TEXT NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
      shopper_id TEXT NOT NULL REFERENCES shopper_profiles(id) ON DELETE CASCADE,
      type       TEXT NOT NULL CHECK(type IN ('contribution','withdrawal','planned')),
      amount     REAL NOT NULL,
      note       TEXT,
      date       TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- ── Expense records ──────────────────────────────────────
    CREATE TABLE IF NOT EXISTS expenses (
      id          TEXT PRIMARY KEY,
      shopper_id  TEXT NOT NULL REFERENCES shopper_profiles(id) ON DELETE CASCADE,
      category    TEXT,             -- 'essential' | 'shopping' | 'food' | 'transport' etc.
      amount      REAL NOT NULL,
      description TEXT,
      date        TEXT NOT NULL,
      source      TEXT,             -- 'manual' | platform key
      created_at  TEXT DEFAULT (datetime('now'))
    );

    -- ── Connections hub ──────────────────────────────────────
    CREATE TABLE IF NOT EXISTS connections (
      id          TEXT PRIMARY KEY,
      shopper_id  TEXT NOT NULL REFERENCES shopper_profiles(id) ON DELETE CASCADE,
      platform    TEXT NOT NULL,    -- 'shopee'|'shein'|'tiktok'|'taobao'|'pinduoduo'
      status      TEXT DEFAULT 'demo' CHECK(status IN ('live','imported','link-only','needs-attention','demo')),
      route       TEXT DEFAULT 'link-only',
      connected_at TEXT,
      UNIQUE(shopper_id, platform)
    );

    -- ── Saved product links ──────────────────────────────────
    CREATE TABLE IF NOT EXISTS saved_links (
      id          TEXT PRIMARY KEY,
      shopper_id  TEXT NOT NULL REFERENCES shopper_profiles(id) ON DELETE CASCADE,
      platform    TEXT NOT NULL,
      url         TEXT NOT NULL,
      title       TEXT,
      price       REAL,
      currency    TEXT DEFAULT 'SGD',
      verified    INTEGER DEFAULT 0, -- 0 = unverified; never claim live price from link-only
      saved_at    TEXT DEFAULT (datetime('now'))
    );

    -- ── Conversations ────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS conversations (
      id          TEXT PRIMARY KEY,
      shopper_id  TEXT NOT NULL REFERENCES shopper_profiles(id) ON DELETE CASCADE,
      product_id  TEXT,
      title       TEXT,
      status      TEXT DEFAULT 'active',
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id              TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role            TEXT NOT NULL,
      text            TEXT NOT NULL,
      created_at      TEXT DEFAULT (datetime('now'))
    );

    -- ── Reminders ────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS reminders (
      id          TEXT PRIMARY KEY,
      shopper_id  TEXT NOT NULL REFERENCES shopper_profiles(id) ON DELETE CASCADE,
      product_id  TEXT,
      date        TEXT NOT NULL,
      fired       INTEGER DEFAULT 0,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    -- ── Purchase history ─────────────────────────────────────
    CREATE TABLE IF NOT EXISTS purchase_history (
      id           TEXT PRIMARY KEY,
      shopper_id   TEXT NOT NULL REFERENCES shopper_profiles(id) ON DELETE CASCADE,
      product_id   TEXT,
      amount       REAL,
      platform     TEXT,
      confirmed_at TEXT DEFAULT (datetime('now'))
    );

    -- ── Merchant profiles ────────────────────────────────────
    CREATE TABLE IF NOT EXISTS merchant_profiles (
      id                   TEXT PRIMARY KEY,
      name                 TEXT NOT NULL,
      support_email        TEXT,
      contact_limit_daily  INTEGER DEFAULT 2,
      goal                 TEXT,
      approval_roles       TEXT,    -- JSON object
      created_at           TEXT DEFAULT (datetime('now'))
    );

    -- ── Product catalogue ────────────────────────────────────
    CREATE TABLE IF NOT EXISTS catalogue (
      id          TEXT PRIMARY KEY,
      merchant_id TEXT NOT NULL REFERENCES merchant_profiles(id) ON DELETE CASCADE,
      name        TEXT NOT NULL,
      category    TEXT,
      price       REAL NOT NULL,
      description TEXT,
      in_stock    INTEGER DEFAULT 1,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    -- ── Merchant customers ───────────────────────────────────
    -- Separate from shopper_profiles — merchant CRM records only.
    -- The app never joins this table with savings/expenses.
    CREATE TABLE IF NOT EXISTS customers (
      id          TEXT PRIMARY KEY,
      merchant_id TEXT NOT NULL REFERENCES merchant_profiles(id) ON DELETE CASCADE,
      name        TEXT NOT NULL,
      email       TEXT,
      segment     TEXT DEFAULT 'first_time',
      orders      INTEGER DEFAULT 0,
      last_order  TEXT,
      mode        TEXT,             -- 'student'|'working'|null — used only for wording variant, not financial inference
      holdout     INTEGER DEFAULT 0, -- 1 = control group, excluded from journeys; used for metrics comparison
      notes       TEXT,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    -- ── Customer journeys ────────────────────────────────────
    CREATE TABLE IF NOT EXISTS journeys (
      id            TEXT PRIMARY KEY,
      merchant_id   TEXT NOT NULL REFERENCES merchant_profiles(id) ON DELETE CASCADE,
      customer_id   TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      customer_name TEXT,
      product_id    TEXT REFERENCES catalogue(id),
      product_name  TEXT,
      trigger       TEXT,
      reason        TEXT,
      status        TEXT DEFAULT 'active',
      outcome       TEXT,
      created_at    TEXT DEFAULT (datetime('now')),
      closed_at     TEXT
    );

    CREATE TABLE IF NOT EXISTS journey_events (
      id         TEXT PRIMARY KEY,
      journey_id TEXT NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
      type       TEXT NOT NULL,
      note       TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- ── Support handovers ────────────────────────────────────
    CREATE TABLE IF NOT EXISTS support_handovers (
      id            TEXT PRIMARY KEY,
      merchant_id   TEXT NOT NULL REFERENCES merchant_profiles(id) ON DELETE CASCADE,
      journey_id    TEXT REFERENCES journeys(id),
      customer_name TEXT,
      reason        TEXT,
      context       TEXT,
      resolved      INTEGER DEFAULT 0,
      created_at    TEXT DEFAULT (datetime('now')),
      resolved_at   TEXT
    );
  `);

  console.log('[db] SQLite initialised at', DB_PATH);
}
