import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import {
  INITIAL_SITE_CONTENT,
  SEED_BRANDS,
  SEED_CATEGORIES,
  SEED_GUIDES,
  SEED_MOTORCYCLES,
  SEED_REVIEWS,
} from './seedData.ts';
import type {
  BrandItem,
  CategoryItem,
  CustomerReview,
  GuideArticle,
  Inquiry,
  Motorcycle,
  SignInNotification,
  SiteContent,
  UserProfile,
} from '../src/types/motorcycle.ts';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'chand_motors.db');
export const db = new DatabaseSync(dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    saved_bike_ids TEXT NOT NULL DEFAULT '[]',
    reset_token_hash TEXT,
    reset_token_expires_at INTEGER,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS brands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    country TEXT NOT NULL,
    summary TEXT NOT NULL,
    is_featured INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    image_url TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS motorcycles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    category TEXT NOT NULL,
    cc INTEGER NOT NULL,
    engine_capacity_label TEXT NOT NULL,
    engine_type TEXT NOT NULL,
    horsepower TEXT NOT NULL,
    torque TEXT NOT NULL,
    transmission TEXT NOT NULL,
    fuel_tank_capacity TEXT NOT NULL,
    mileage TEXT NOT NULL,
    top_speed TEXT NOT NULL,
    braking_system TEXT NOT NULL,
    front_suspension TEXT NOT NULL,
    rear_suspension TEXT NOT NULL,
    dimensions TEXT NOT NULL,
    weight TEXT NOT NULL,
    colors TEXT NOT NULL,
    estimated_price_pkr INTEGER NOT NULL,
    price_label TEXT NOT NULL,
    price_updated_at TEXT NOT NULL,
    source_urls TEXT NOT NULL DEFAULT '[]',
    source_checked_at TEXT NOT NULL DEFAULT '',
    verified_fields TEXT NOT NULL DEFAULT '[]',
    key_features TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT NOT NULL,
    gallery_urls TEXT NOT NULL,
    is_featured INTEGER NOT NULL DEFAULT 0,
    is_latest_arrival INTEGER NOT NULL DEFAULT 0,
    popularity_score INTEGER NOT NULL DEFAULT 50,
    availability TEXT NOT NULL DEFAULT 'Availability Unconfirmed',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS guides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    read_time TEXT NOT NULL,
    published_at TEXT NOT NULL,
    image_url TEXT NOT NULL,
    faqs TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    city TEXT NOT NULL,
    bike_purchased TEXT NOT NULL,
    rating INTEGER NOT NULL,
    quote TEXT NOT NULL,
    verified_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL DEFAULT '',
    motorcycle_id INTEGER,
    motorcycle_name TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Closed')),
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS site_content (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS signin_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_phone TEXT NOT NULL DEFAULT '',
    user_city TEXT NOT NULL DEFAULT '',
    event_type TEXT NOT NULL CHECK (event_type IN ('login', 'register')),
    ip_address TEXT NOT NULL DEFAULT '',
    user_agent TEXT NOT NULL DEFAULT '',
    recipient_email TEXT NOT NULL,
    email_status TEXT NOT NULL DEFAULT 'pending',
    status_detail TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS schema_migrations (
    id TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  );
`);

const motorcycleColumns = db.prepare('PRAGMA table_info(motorcycles)').all() as { name: string }[];
if (!motorcycleColumns.some((column) => column.name === 'source_urls')) {
  db.exec("ALTER TABLE motorcycles ADD COLUMN source_urls TEXT NOT NULL DEFAULT '[]'");
}
if (!motorcycleColumns.some((column) => column.name === 'source_checked_at')) {
  db.exec("ALTER TABLE motorcycles ADD COLUMN source_checked_at TEXT NOT NULL DEFAULT ''");
}
if (!motorcycleColumns.some((column) => column.name === 'verified_fields')) {
  db.exec("ALTER TABLE motorcycles ADD COLUMN verified_fields TEXT NOT NULL DEFAULT '[]'");
}

export function seedDatabase(): void {
  const now = new Date().toISOString();

  const brandCount = (db.prepare('SELECT COUNT(*) as c FROM brands').get() as { c: number }).c;
  if (brandCount === 0) {
    const stmt = db.prepare(
      'INSERT INTO brands (name, slug, country, summary, is_featured) VALUES (?, ?, ?, ?, ?)',
    );
    for (const b of SEED_BRANDS) {
      stmt.run(b.name, b.slug, b.country, b.summary, b.isFeatured ? 1 : 0);
    }
  }

  const catCount = (db.prepare('SELECT COUNT(*) as c FROM categories').get() as { c: number }).c;
  if (catCount === 0) {
    const stmt = db.prepare(
      'INSERT INTO categories (name, slug, description, image_url) VALUES (?, ?, ?, ?)',
    );
    for (const c of SEED_CATEGORIES) {
      stmt.run(c.name, c.slug, c.description, c.imageUrl);
    }
  }

  const bikeCount = (db.prepare('SELECT COUNT(*) as c FROM motorcycles').get() as { c: number }).c;
  if (bikeCount === 0) {
    const stmt = db.prepare(`
      INSERT INTO motorcycles (
        slug, name, brand, category, cc, engine_capacity_label, engine_type,
        horsepower, torque, transmission, fuel_tank_capacity, mileage, top_speed,
        braking_system, front_suspension, rear_suspension, dimensions, weight,
        colors, estimated_price_pkr, price_label, price_updated_at, source_urls,
        source_checked_at, verified_fields, key_features, description, image_url, gallery_urls,
        is_featured, is_latest_arrival, popularity_score, availability, created_at, updated_at
      ) VALUES (${Array(35).fill('?').join(', ')})
    `);
    for (const m of SEED_MOTORCYCLES) {
      stmt.run(
        m.slug,
        m.name,
        m.brand,
        m.category,
        m.cc,
        m.engineCapacityLabel,
        m.engineType,
        m.horsepower,
        m.torque,
        m.transmission,
        m.fuelTankCapacity,
        m.mileage,
        m.topSpeed,
        m.brakingSystem,
        m.frontSuspension,
        m.rearSuspension,
        m.dimensions,
        m.weight,
        JSON.stringify(m.colors),
        m.estimatedPricePkr,
        m.priceLabel,
        m.priceUpdatedAt,
        JSON.stringify(m.sourceUrls ?? []),
        m.sourceCheckedAt ?? '',
        JSON.stringify(m.verifiedFields ?? []),
        JSON.stringify(m.keyFeatures),
        m.description,
        m.imageUrl,
        JSON.stringify(m.galleryUrls),
        m.isFeatured ? 1 : 0,
        m.isLatestArrival ? 1 : 0,
        m.popularityScore,
        m.availability,
        now,
        now,
      );
    }
  }

  const normalizeUnconfirmedAvailability = db.prepare(
    `UPDATE motorcycles
     SET availability = 'Availability Unconfirmed'
     WHERE slug = ? AND created_at = updated_at`,
  );
  const backfillMotorcycleSources = db.prepare(
    `UPDATE motorcycles
     SET source_urls = ?, source_checked_at = ?
     WHERE slug = ? AND source_urls = '[]'`,
  );
  const updateUnmodifiedSourceMotorcycle = db.prepare(
    `UPDATE motorcycles SET
      name = ?, cc = ?, engine_capacity_label = ?, engine_type = ?, horsepower = ?, torque = ?,
      transmission = ?, fuel_tank_capacity = ?, mileage = ?, top_speed = ?, braking_system = ?,
      front_suspension = ?, rear_suspension = ?, dimensions = ?, weight = ?, colors = ?,
      estimated_price_pkr = ?, price_label = ?, price_updated_at = ?, source_urls = ?,
      source_checked_at = ?, verified_fields = ?, key_features = ?, description = ?, updated_at = ?
     WHERE slug = ? AND created_at = updated_at`,
  );
  const sourceMigrationId = 'motorcycle-source-metadata-v2';
  const sourceMigrationApplied = db.prepare('SELECT id FROM schema_migrations WHERE id = ?').get(sourceMigrationId);
  if (!sourceMigrationApplied) {
    for (const motorcycle of SEED_MOTORCYCLES) {
      if (motorcycle.sourceUrls?.length) {
        backfillMotorcycleSources.run(
          JSON.stringify(motorcycle.sourceUrls),
          motorcycle.sourceCheckedAt ?? '',
          motorcycle.slug,
        );
        updateUnmodifiedSourceMotorcycle.run(
          motorcycle.name,
          motorcycle.cc,
          motorcycle.engineCapacityLabel,
          motorcycle.engineType,
          motorcycle.horsepower,
          motorcycle.torque,
          motorcycle.transmission,
          motorcycle.fuelTankCapacity,
          motorcycle.mileage,
          motorcycle.topSpeed,
          motorcycle.brakingSystem,
          motorcycle.frontSuspension,
          motorcycle.rearSuspension,
          motorcycle.dimensions,
          motorcycle.weight,
          JSON.stringify(motorcycle.colors),
          motorcycle.estimatedPricePkr,
          motorcycle.priceLabel,
          motorcycle.priceUpdatedAt,
          JSON.stringify(motorcycle.sourceUrls),
          motorcycle.sourceCheckedAt ?? '',
          JSON.stringify(motorcycle.verifiedFields ?? []),
          JSON.stringify(motorcycle.keyFeatures),
          motorcycle.description,
          now,
          motorcycle.slug,
        );
      }
    }
    db.prepare('INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)').run(sourceMigrationId, now);
  }
  for (const motorcycle of SEED_MOTORCYCLES) {
    normalizeUnconfirmedAvailability.run(motorcycle.slug);
  }

  const guideCount = (db.prepare('SELECT COUNT(*) as c FROM guides').get() as { c: number }).c;
  if (guideCount === 0) {
    const stmt = db.prepare(
      'INSERT INTO guides (slug, title, category, excerpt, content, read_time, published_at, image_url, faqs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    );
    for (const g of SEED_GUIDES) {
      stmt.run(
        g.slug,
        g.title,
        g.category,
        g.excerpt,
        JSON.stringify(g.content),
        g.readTime,
        g.publishedAt,
        g.imageUrl,
        JSON.stringify(g.faqs),
      );
    }
  }

  const reviewCount = (db.prepare('SELECT COUNT(*) as c FROM reviews').get() as { c: number }).c;
  if (reviewCount === 0) {
    const stmt = db.prepare(
      'INSERT INTO reviews (customer_name, city, bike_purchased, rating, quote, verified_at) VALUES (?, ?, ?, ?, ?, ?)',
    );
    for (const r of SEED_REVIEWS) {
      stmt.run(r.customerName, r.city, r.bikePurchased, r.rating, r.quote, r.verifiedAt);
    }
  }

  const contentCount = (db.prepare('SELECT COUNT(*) as c FROM site_content').get() as { c: number }).c;
  if (contentCount === 0) {
    const stmt = db.prepare('INSERT INTO site_content (key, value) VALUES (?, ?)');
    for (const [k, v] of Object.entries(INITIAL_SITE_CONTENT)) {
      stmt.run(k, String(v));
    }
  }

  db.prepare(
    `UPDATE site_content SET value = '' WHERE
      (key = 'showroomAddress' AND value = 'Plot 14-C, Main Boulevard, Gulberg III') OR
      (key = 'showroomCity' AND value = 'Lahore, Pakistan') OR
      (key = 'showroomHours' AND value = 'Mon – Sat · 10:00 AM – 8:00 PM PKT')`,
  ).run();

  db.prepare(
    `DELETE FROM reviews WHERE customer_name IN ('Hamza Tariq', 'Bilal Siddiqui', 'Usman Farooq')
      AND verified_at IN ('2026-10-18', '2026-10-11', '2026-09-29')`,
  ).run();

  const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (Boolean(adminEmail) !== Boolean(adminPassword)) {
    throw new Error('Set both ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD to create an initial admin.');
  }
  if (adminPassword && adminPassword.length < 16) {
    throw new Error('ADMIN_BOOTSTRAP_PASSWORD must be at least 16 characters.');
  }
  if (adminEmail && adminPassword) {
    const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
    if (!existingAdmin) {
      const hash = bcrypt.hashSync(adminPassword, 12);
      db.prepare(
        'INSERT INTO users (name, email, password_hash, phone, city, role, saved_bike_ids, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ).run('CHAND Administrator', adminEmail, hash, '', 'Pakistan', 'admin', '[]', now);
    }
  }
}

export function mapMotorcycleRow(row: Record<string, unknown>): Motorcycle {
  return {
    id: Number(row.id),
    slug: String(row.slug),
    name: String(row.name),
    brand: String(row.brand),
    category: String(row.category) as Motorcycle['category'],
    cc: Number(row.cc),
    engineCapacityLabel: String(row.engine_capacity_label),
    engineType: String(row.engine_type),
    horsepower: String(row.horsepower),
    torque: String(row.torque),
    transmission: String(row.transmission),
    fuelTankCapacity: String(row.fuel_tank_capacity),
    mileage: String(row.mileage),
    topSpeed: String(row.top_speed),
    brakingSystem: String(row.braking_system),
    frontSuspension: String(row.front_suspension),
    rearSuspension: String(row.rear_suspension),
    dimensions: String(row.dimensions),
    weight: String(row.weight),
    colors: JSON.parse(String(row.colors || '[]')),
    estimatedPricePkr: Number(row.estimated_price_pkr),
    priceLabel: String(row.price_label),
    priceUpdatedAt: String(row.price_updated_at),
    sourceUrls: JSON.parse(String(row.source_urls || '[]')),
    sourceCheckedAt: String(row.source_checked_at || ''),
    verifiedFields: JSON.parse(String(row.verified_fields || '[]')),
    keyFeatures: JSON.parse(String(row.key_features || '[]')),
    description: String(row.description),
    imageUrl: String(row.image_url),
    galleryUrls: JSON.parse(String(row.gallery_urls || '[]')),
    isFeatured: Boolean(row.is_featured),
    isLatestArrival: Boolean(row.is_latest_arrival),
    popularityScore: Number(row.popularity_score),
    availability: String(row.availability) as Motorcycle['availability'],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapUserRow(row: Record<string, unknown>): UserProfile {
  return {
    id: Number(row.id),
    name: String(row.name),
    email: String(row.email),
    phone: String(row.phone || ''),
    city: String(row.city || ''),
    role: String(row.role) as 'customer' | 'admin',
    savedBikeIds: JSON.parse(String(row.saved_bike_ids || '[]')),
    createdAt: String(row.created_at),
  };
}

export function mapBrandRow(row: Record<string, unknown>): BrandItem {
  return {
    id: Number(row.id),
    name: String(row.name),
    slug: String(row.slug),
    country: String(row.country),
    summary: String(row.summary),
    isFeatured: Boolean(row.is_featured),
  };
}

export function mapCategoryRow(row: Record<string, unknown>): CategoryItem {
  return {
    id: Number(row.id),
    name: String(row.name) as CategoryItem['name'],
    slug: String(row.slug),
    description: String(row.description),
    imageUrl: String(row.image_url),
  };
}

export function mapGuideRow(row: Record<string, unknown>): GuideArticle {
  return {
    id: Number(row.id),
    slug: String(row.slug),
    title: String(row.title),
    category: String(row.category),
    excerpt: String(row.excerpt),
    content: JSON.parse(String(row.content || '[]')),
    readTime: String(row.read_time),
    publishedAt: String(row.published_at),
    imageUrl: String(row.image_url),
    faqs: JSON.parse(String(row.faqs || '[]')),
  };
}

export function mapReviewRow(row: Record<string, unknown>): CustomerReview {
  return {
    id: Number(row.id),
    customerName: String(row.customer_name),
    city: String(row.city),
    bikePurchased: String(row.bike_purchased),
    rating: Number(row.rating),
    quote: String(row.quote),
    verifiedAt: String(row.verified_at),
  };
}

export function mapInquiryRow(row: Record<string, unknown>): Inquiry {
  return {
    id: Number(row.id),
    userId: row.user_id !== null && row.user_id !== undefined ? Number(row.user_id) : null,
    customerName: String(row.customer_name),
    phone: String(row.phone),
    email: String(row.email || ''),
    motorcycleId: row.motorcycle_id !== null && row.motorcycle_id !== undefined ? Number(row.motorcycle_id) : null,
    motorcycleName: String(row.motorcycle_name),
    city: String(row.city || ''),
    message: String(row.message),
    status: String(row.status) as Inquiry['status'],
    createdAt: String(row.created_at),
  };
}

export function mapSigninNotificationRow(row: Record<string, unknown>): SignInNotification {
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    userName: String(row.user_name),
    userEmail: String(row.user_email),
    userPhone: String(row.user_phone || ''),
    userCity: String(row.user_city || ''),
    eventType: String(row.event_type) as SignInNotification['eventType'],
    ipAddress: String(row.ip_address || ''),
    userAgent: String(row.user_agent || ''),
    recipientEmail: String(row.recipient_email),
    emailStatus: String(row.email_status) as SignInNotification['emailStatus'],
    statusDetail: String(row.status_detail || ''),
    createdAt: String(row.created_at),
  };
}

export function getSiteContent(): SiteContent {
  const rows = db.prepare('SELECT key, value FROM site_content').all() as { key: string; value: string }[];
  const record: Record<string, string> = {};
  for (const r of rows) {
    record[r.key] = r.value;
  }
  return {
    heroHeadline: record.heroHeadline || INITIAL_SITE_CONTENT.heroHeadline,
    heroSubheadline: record.heroSubheadline || INITIAL_SITE_CONTENT.heroSubheadline,
    heroCtaLabel: record.heroCtaLabel || INITIAL_SITE_CONTENT.heroCtaLabel,
    showroomAddress: record.showroomAddress || INITIAL_SITE_CONTENT.showroomAddress,
    showroomCity: record.showroomCity || INITIAL_SITE_CONTENT.showroomCity,
    showroomHours: record.showroomHours || INITIAL_SITE_CONTENT.showroomHours,
    whatsappNumber: record.whatsappNumber || INITIAL_SITE_CONTENT.whatsappNumber,
    announcementText: record.announcementText || INITIAL_SITE_CONTENT.announcementText,
    priceDisclaimer: record.priceDisclaimer || INITIAL_SITE_CONTENT.priceDisclaimer,
  };
}
