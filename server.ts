import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import express, { type NextFunction, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import {
  db,
  getSiteContent,
  mapBrandRow,
  mapCategoryRow,
  mapGuideRow,
  mapInquiryRow,
  mapMotorcycleRow,
  mapReviewRow,
  mapSigninNotificationRow,
  mapUserRow,
  seedDatabase,
} from './server/db.ts';
import {
  isMailerConfigured,
  recordAndNotifySignIn,
  sendTestNotificationEmail,
} from './server/mailer.ts';

seedDatabase();

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'chand-motors-dev-jwt-secret-change-in-prod';
const COOKIE_NAME = 'chand_auth_token';

interface AuthPayload {
  userId: number;
  email: string;
  role: 'customer' | 'admin';
}

interface AuthenticatedRequest extends Request {
  authUser?: {
    id: number;
    email: string;
    role: 'customer' | 'admin';
  };
}

function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function setAuthCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function extractToken(req: Request): string | null {
  const cookieToken = req.cookies?.[COOKIE_NAME];
  if (typeof cookieToken === 'string' && cookieToken.length > 0) {
    return cookieToken;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
      const row = db
        .prepare('SELECT id, email, role FROM users WHERE id = ?')
        .get(decoded.userId) as { id: number; email: string; role: 'customer' | 'admin' } | undefined;
      if (row) {
        req.authUser = row;
      }
    } catch {
      // Ignore expired/invalid optional token
    }
  }
  next();
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    const row = db
      .prepare('SELECT id, email, role FROM users WHERE id = ?')
      .get(decoded.userId) as { id: number; email: string; role: 'customer' | 'admin' } | undefined;
    if (!row) {
      res.status(401).json({ error: 'Session user not found.' });
      return;
    }
    req.authUser = row;
    next();
  } catch {
    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.authUser?.role !== 'admin') {
      res.status(403).json({ error: 'Administrator privileges required.' });
      return;
    }
    next();
  });
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());

  // SEO endpoints: robots.txt & dynamic XML sitemap
  app.get('/robots.txt', (req, res) => {
    const origin = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    res.type('text/plain').send(
      [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin',
        'Disallow: /profile',
        'Disallow: /api/',
        `Sitemap: ${origin}/sitemap.xml`,
      ].join('\n'),
    );
  });

  app.get('/sitemap.xml', (req, res) => {
    const origin = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    const bikes = db.prepare('SELECT slug, updated_at FROM motorcycles').all() as {
      slug: string;
      updated_at: string;
    }[];
    const guides = db.prepare('SELECT slug, published_at FROM guides').all() as {
      slug: string;
      published_at: string;
    }[];

    const staticUrls = [
      { loc: '/', priority: '1.0', changefreq: 'daily' },
      { loc: '/catalog', priority: '0.9', changefreq: 'daily' },
      { loc: '/compare', priority: '0.8', changefreq: 'weekly' },
      { loc: '/guides', priority: '0.8', changefreq: 'weekly' },
      { loc: '/contact', priority: '0.7', changefreq: 'monthly' },
    ];

    const xmlParts = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...staticUrls.map(
        (u) =>
          `  <url><loc>${origin}${u.loc}</loc><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`,
      ),
      ...bikes.map(
        (b) =>
          `  <url><loc>${origin}/motorcycles/${b.slug}</loc><lastmod>${b.updated_at.slice(0, 10)}</lastmod><changefreq>weekly</changefreq><priority>0.85</priority></url>`,
      ),
      ...guides.map(
        (g) =>
          `  <url><loc>${origin}/guides/${g.slug}</loc><lastmod>${g.published_at}</lastmod><changefreq>monthly</changefreq><priority>0.75</priority></url>`,
      ),
      '</urlset>',
    ];

    res.type('application/xml').send(xmlParts.join('\n'));
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', brand: 'CHAND MOTORS' });
  });

  // Public Catalog & Editorial Routes
  app.get('/api/motorcycles', (req, res) => {
    const { brand, category, search, minCc, maxCc, minPrice, maxPrice, sort } = req.query;
    const rows = db.prepare('SELECT * FROM motorcycles').all() as Record<string, unknown>[];
    let items = rows.map(mapMotorcycleRow);

    if (typeof brand === 'string' && brand && brand !== 'All') {
      items = items.filter((b) => b.brand.toLowerCase() === brand.toLowerCase());
    }
    if (typeof category === 'string' && category && category !== 'All') {
      items = items.filter((b) => b.category.toLowerCase() === category.toLowerCase());
    }
    if (typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.brand.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          b.engineType.toLowerCase().includes(q),
      );
    }
    if (typeof minCc === 'string' && minCc !== '') {
      const min = Number(minCc);
      if (!Number.isNaN(min)) items = items.filter((b) => b.cc >= min);
    }
    if (typeof maxCc === 'string' && maxCc !== '') {
      const max = Number(maxCc);
      if (!Number.isNaN(max)) items = items.filter((b) => b.cc <= max);
    }
    if (typeof minPrice === 'string' && minPrice !== '') {
      const min = Number(minPrice);
      if (!Number.isNaN(min)) items = items.filter((b) => b.estimatedPricePkr >= min);
    }
    if (typeof maxPrice === 'string' && maxPrice !== '') {
      const max = Number(maxPrice);
      if (!Number.isNaN(max)) items = items.filter((b) => b.estimatedPricePkr <= max);
    }

    if (sort === 'price-asc') {
      items.sort((a, b) => a.estimatedPricePkr - b.estimatedPricePkr);
    } else if (sort === 'price-desc') {
      items.sort((a, b) => b.estimatedPricePkr - a.estimatedPricePkr);
    } else if (sort === 'cc-desc') {
      items.sort((a, b) => b.cc - a.cc);
    } else {
      items.sort((a, b) => b.popularityScore - a.popularityScore);
    }

    res.json({ motorcycles: items });
  });

  app.get('/api/motorcycles/:slug', (req, res) => {
    const row = db
      .prepare('SELECT * FROM motorcycles WHERE slug = ?')
      .get(req.params.slug) as Record<string, unknown> | undefined;
    if (!row) {
      res.status(404).json({ error: 'Motorcycle model not found.' });
      return;
    }
    const motorcycle = mapMotorcycleRow(row);
    const relatedRows = db
      .prepare('SELECT * FROM motorcycles WHERE slug != ? AND (category = ? OR brand = ?) LIMIT 4')
      .all(motorcycle.slug, motorcycle.category, motorcycle.brand) as Record<string, unknown>[];
    res.json({
      motorcycle,
      related: relatedRows.map(mapMotorcycleRow),
    });
  });

  app.get('/api/brands', (_req, res) => {
    const rows = db.prepare('SELECT * FROM brands ORDER BY is_featured DESC, name ASC').all() as Record<
      string,
      unknown
    >[];
    res.json({ brands: rows.map(mapBrandRow) });
  });

  app.get('/api/categories', (_req, res) => {
    const rows = db.prepare('SELECT * FROM categories ORDER BY id ASC').all() as Record<string, unknown>[];
    res.json({ categories: rows.map(mapCategoryRow) });
  });

  app.get('/api/guides', (_req, res) => {
    const rows = db.prepare('SELECT * FROM guides ORDER BY published_at DESC').all() as Record<
      string,
      unknown
    >[];
    res.json({ guides: rows.map(mapGuideRow) });
  });

  app.get('/api/guides/:slug', (req, res) => {
    const row = db.prepare('SELECT * FROM guides WHERE slug = ?').get(req.params.slug) as
      | Record<string, unknown>
      | undefined;
    if (!row) {
      res.status(404).json({ error: 'Guide article not found.' });
      return;
    }
    res.json({ guide: mapGuideRow(row) });
  });

  app.get('/api/reviews', (_req, res) => {
    const rows = db.prepare('SELECT * FROM reviews ORDER BY verified_at DESC').all() as Record<
      string,
      unknown
    >[];
    res.json({ reviews: rows.map(mapReviewRow) });
  });

  app.get('/api/content', (_req, res) => {
    res.json({ content: getSiteContent() });
  });

  // Customer Inquiry Submission
  app.post('/api/inquiries', optionalAuth, (req: AuthenticatedRequest, res) => {
    const { customerName, phone, email, motorcycleId, motorcycleName, city, message } = req.body ?? {};
    if (typeof customerName !== 'string' || customerName.trim().length < 2) {
      res.status(400).json({ error: 'Please provide your full name (at least 2 characters).' });
      return;
    }
    if (typeof phone !== 'string' || phone.trim().length < 7) {
      res.status(400).json({ error: 'Please provide a valid Pakistani contact or WhatsApp number.' });
      return;
    }
    if (email && (typeof email !== 'string' || !isValidEmail(email.trim()))) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (typeof message !== 'string' || message.trim().length < 5) {
      res.status(400).json({ error: 'Please include a short message regarding your inquiry.' });
      return;
    }

    const now = new Date().toISOString();
    const result = db
      .prepare(
        `INSERT INTO inquiries (user_id, customer_name, phone, email, motorcycle_id, motorcycle_name, city, message, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'New', ?)`,
      )
      .run(
        req.authUser?.id ?? null,
        customerName.trim(),
        phone.trim(),
        typeof email === 'string' ? email.trim() : '',
        motorcycleId ? Number(motorcycleId) : null,
        typeof motorcycleName === 'string' && motorcycleName.trim() ? motorcycleName.trim() : 'General Showroom Inquiry',
        typeof city === 'string' && city.trim() ? city.trim() : 'Lahore',
        message.trim(),
        now,
      );

    const created = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(result.lastInsertRowid) as Record<
      string,
      unknown
    >;
    res.status(201).json({ inquiry: mapInquiryRow(created) });
  });

  // Authentication Routes
  app.post('/api/auth/register', (req, res) => {
    const { name, email, password, phone, city } = req.body ?? {};
    if (typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ error: 'Full name must be at least 2 characters.' });
      return;
    }
    if (typeof email !== 'string' || !isValidEmail(email.trim())) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }
    if (typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();

    const result = db
      .prepare(
        `INSERT INTO users (name, email, password_hash, phone, city, role, saved_bike_ids, created_at)
         VALUES (?, ?, ?, ?, ?, 'customer', '[]', ?)`,
      )
      .run(
        name.trim(),
        normalizedEmail,
        passwordHash,
        typeof phone === 'string' ? phone.trim() : '',
        typeof city === 'string' && city.trim() ? city.trim() : 'Lahore',
        now,
      );

    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as Record<
      string,
      unknown
    >;
    const user = mapUserRow(userRow);
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    setAuthCookie(res, token);

    const ipAddress =
      (typeof req.headers['x-forwarded-for'] === 'string'
        ? req.headers['x-forwarded-for'].split(',')[0].trim()
        : req.ip) || 'unknown';
    void recordAndNotifySignIn({
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      role: user.role,
      eventType: 'register',
      ipAddress,
      userAgent: req.get('user-agent') || 'Unknown',
    });

    res.status(201).json({ user });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || !isValidEmail(email.trim())) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }
    if (typeof password !== 'string' || password.length === 0) {
      res.status(400).json({ error: 'Password is required.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail) as
      | Record<string, unknown>
      | undefined;

    if (!userRow || !bcrypt.compareSync(password, String(userRow.password_hash))) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const user = mapUserRow(userRow);
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    setAuthCookie(res, token);

    const ipAddress =
      (typeof req.headers['x-forwarded-for'] === 'string'
        ? req.headers['x-forwarded-for'].split(',')[0].trim()
        : req.ip) || 'unknown';
    void recordAndNotifySignIn({
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      role: user.role,
      eventType: 'login',
      ipAddress,
      userAgent: req.get('user-agent') || 'Unknown',
    });

    res.json({ user });
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    res.json({ ok: true });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.authUser!.id) as Record<
      string,
      unknown
    >;
    res.json({ user: mapUserRow(row) });
  });

  app.patch('/api/auth/profile', requireAuth, (req: AuthenticatedRequest, res) => {
    const { name, phone, city, savedBikeIds } = req.body ?? {};
    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.authUser!.id) as Record<
      string,
      unknown
    >;

    const nextName =
      typeof name === 'string' && name.trim().length >= 2 ? name.trim() : String(existing.name);
    const nextPhone = typeof phone === 'string' ? phone.trim() : String(existing.phone || '');
    const nextCity =
      typeof city === 'string' && city.trim() ? city.trim() : String(existing.city || 'Lahore');
    const nextSaved = Array.isArray(savedBikeIds)
      ? JSON.stringify(savedBikeIds.map((x) => Number(x)).filter((n) => !Number.isNaN(n)))
      : String(existing.saved_bike_ids || '[]');

    db.prepare('UPDATE users SET name = ?, phone = ?, city = ?, saved_bike_ids = ? WHERE id = ?').run(
      nextName,
      nextPhone,
      nextCity,
      nextSaved,
      req.authUser!.id,
    );

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.authUser!.id) as Record<
      string,
      unknown
    >;
    res.json({ user: mapUserRow(updated) });
  });

  app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body ?? {};
    if (typeof email !== 'string' || !isValidEmail(email.trim())) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userRow = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail) as
      | { id: number }
      | undefined;

    if (!userRow) {
      res.json({
        ok: true,
        message: 'If an account matches that email, a 6-digit reset verification code has been issued.',
      });
      return;
    }

    const code = String(crypto.randomInt(100000, 999999));
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = Date.now() + 15 * 60 * 1000;

    db.prepare('UPDATE users SET reset_token_hash = ?, reset_token_expires_at = ? WHERE id = ?').run(
      codeHash,
      expiresAt,
      userRow.id,
    );

    const payload: Record<string, unknown> = {
      ok: true,
      message: 'A 6-digit verification code has been generated and expires in 15 minutes.',
    };
    if (process.env.NODE_ENV !== 'production') {
      payload.verificationCodePreview = code;
    }
    res.json(payload);
  });

  app.post('/api/auth/reset-password', (req, res) => {
    const { email, code, newPassword } = req.body ?? {};
    if (typeof email !== 'string' || !isValidEmail(email.trim())) {
      res.status(400).json({ error: 'Valid email is required.' });
      return;
    }
    if (typeof code !== 'string' || code.trim().length < 6) {
      res.status(400).json({ error: '6-digit verification code is required.' });
      return;
    }
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail) as
      | Record<string, unknown>
      | undefined;

    if (!userRow || !userRow.reset_token_hash || !userRow.reset_token_expires_at) {
      res.status(400).json({ error: 'Invalid or expired reset verification code.' });
      return;
    }

    if (Date.now() > Number(userRow.reset_token_expires_at)) {
      res.status(400).json({ error: 'Reset verification code has expired. Please request a new one.' });
      return;
    }

    const providedHash = crypto.createHash('sha256').update(code.trim()).digest('hex');
    if (providedHash !== String(userRow.reset_token_hash)) {
      res.status(400).json({ error: 'Verification code does not match.' });
      return;
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    db.prepare(
      'UPDATE users SET password_hash = ?, reset_token_hash = NULL, reset_token_expires_at = NULL WHERE id = ?',
    ).run(newHash, Number(userRow.id));

    res.json({ ok: true, message: 'Password updated successfully. You may now sign in.' });
  });

  app.get('/api/my/inquiries', requireAuth, (req: AuthenticatedRequest, res) => {
    const rows = db
      .prepare('SELECT * FROM inquiries WHERE user_id = ? OR email = ? ORDER BY created_at DESC')
      .all(req.authUser!.id, req.authUser!.email) as Record<string, unknown>[];
    res.json({ inquiries: rows.map(mapInquiryRow) });
  });

  // Protected Admin Routes
  app.get('/api/admin/overview', requireAdmin, (_req, res) => {
    const bikesCount = (db.prepare('SELECT COUNT(*) as c FROM motorcycles').get() as { c: number }).c;
    const brandsCount = (db.prepare('SELECT COUNT(*) as c FROM brands').get() as { c: number }).c;
    const categoriesCount = (db.prepare('SELECT COUNT(*) as c FROM categories').get() as { c: number }).c;
    const usersCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
    const openInquiriesCount = (
      db.prepare("SELECT COUNT(*) as c FROM inquiries WHERE status = 'New'").get() as { c: number }
    ).c;

    res.json({
      stats: {
        motorcycles: bikesCount,
        brands: brandsCount,
        categories: categoriesCount,
        users: usersCount,
        openInquiries: openInquiriesCount,
      },
    });
  });

  app.get('/api/admin/signin-alerts', requireAdmin, (_req, res) => {
    const rows = db
      .prepare('SELECT * FROM signin_notifications ORDER BY created_at DESC LIMIT 100')
      .all() as Record<string, unknown>[];
    res.json({
      mailer: isMailerConfigured(),
      alerts: rows.map(mapSigninNotificationRow),
    });
  });

  app.post('/api/admin/signin-alerts/test', requireAdmin, async (_req, res) => {
    const result = await sendTestNotificationEmail();
    res.status(result.ok ? 200 : 400).json(result);
  });

  app.post('/api/admin/motorcycles', requireAdmin, (req, res) => {
    const body = req.body ?? {};
    if (typeof body.name !== 'string' || body.name.trim().length < 2) {
      res.status(400).json({ error: 'Motorcycle model name is required.' });
      return;
    }
    if (typeof body.brand !== 'string' || !body.brand.trim()) {
      res.status(400).json({ error: 'Brand is required.' });
      return;
    }
    if (typeof body.category !== 'string' || !body.category.trim()) {
      res.status(400).json({ error: 'Category is required.' });
      return;
    }
    const price = Number(body.estimatedPricePkr);
    if (Number.isNaN(price) || price <= 0) {
      res.status(400).json({ error: 'Valid estimated PKR price is required.' });
      return;
    }

    const baseSlug = slugify(body.slug || body.name);
    let finalSlug = baseSlug;
    let suffix = 1;
    while (db.prepare('SELECT id FROM motorcycles WHERE slug = ?').get(finalSlug)) {
      finalSlug = `${baseSlug}-${suffix++}`;
    }

    const now = new Date().toISOString();
    const cc = Number(body.cc) || 0;
    const imageUrl =
      typeof body.imageUrl === 'string' && body.imageUrl.trim()
        ? body.imageUrl.trim()
        : '/src/assets/images/bike_sports_crimson_1794636800889.jpg';

    const result = db
      .prepare(
        `INSERT INTO motorcycles (
          slug, name, brand, category, cc, engine_capacity_label, engine_type,
          horsepower, torque, transmission, fuel_tank_capacity, mileage, top_speed,
          braking_system, front_suspension, rear_suspension, dimensions, weight,
          colors, estimated_price_pkr, price_label, price_updated_at, key_features,
          description, image_url, gallery_urls, is_featured, is_latest_arrival,
          popularity_score, availability, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        finalSlug,
        body.name.trim(),
        body.brand.trim(),
        body.category.trim(),
        cc,
        body.engineCapacityLabel?.trim() || (cc > 0 ? `${cc} cc` : 'Electric'),
        body.engineType?.trim() || 'Not officially rated by OEM',
        body.horsepower?.trim() || 'Not officially rated by OEM',
        body.torque?.trim() || 'Not officially rated by OEM',
        body.transmission?.trim() || 'Manual',
        body.fuelTankCapacity?.trim() || 'Not specified',
        body.mileage?.trim() || 'Not officially rated by OEM',
        body.topSpeed?.trim() || 'Not officially rated by OEM',
        body.brakingSystem?.trim() || 'Disc / Drum',
        body.frontSuspension?.trim() || 'Telescopic Fork',
        body.rearSuspension?.trim() || 'Dual Shock / Monoshock',
        body.dimensions?.trim() || 'Not officially listed',
        body.weight?.trim() || 'Not officially listed',
        JSON.stringify(Array.isArray(body.colors) ? body.colors : ['Black', 'Red']),
        price,
        body.priceLabel?.trim() || 'Estimated Showroom (PKR)',
        body.priceUpdatedAt?.trim() || now.slice(0, 10),
        JSON.stringify(Array.isArray(body.keyFeatures) ? body.keyFeatures : []),
        body.description?.trim() || `${body.brand.trim()} ${body.name.trim()} listed at CHAND MOTORS.`,
        imageUrl,
        JSON.stringify(Array.isArray(body.galleryUrls) && body.galleryUrls.length ? body.galleryUrls : [imageUrl]),
        body.isFeatured ? 1 : 0,
        body.isLatestArrival ? 1 : 0,
        Number(body.popularityScore) || 75,
        body.availability || 'In Stock',
        now,
        now,
      );

    const created = db.prepare('SELECT * FROM motorcycles WHERE id = ?').get(result.lastInsertRowid) as Record<
      string,
      unknown
    >;
    res.status(201).json({ motorcycle: mapMotorcycleRow(created) });
  });

  app.put('/api/admin/motorcycles/:id', requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    const existingRow = db.prepare('SELECT * FROM motorcycles WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined;
    if (!existingRow) {
      res.status(404).json({ error: 'Motorcycle not found.' });
      return;
    }

    const current = mapMotorcycleRow(existingRow);
    const body = req.body ?? {};
    const now = new Date().toISOString();

    db.prepare(
      `UPDATE motorcycles SET
        name = ?, brand = ?, category = ?, cc = ?, engine_capacity_label = ?, engine_type = ?,
        horsepower = ?, torque = ?, transmission = ?, fuel_tank_capacity = ?, mileage = ?, top_speed = ?,
        braking_system = ?, front_suspension = ?, rear_suspension = ?, dimensions = ?, weight = ?,
        colors = ?, estimated_price_pkr = ?, price_label = ?, price_updated_at = ?, key_features = ?,
        description = ?, image_url = ?, gallery_urls = ?, is_featured = ?, is_latest_arrival = ?,
        popularity_score = ?, availability = ?, updated_at = ?
       WHERE id = ?`,
    ).run(
      typeof body.name === 'string' && body.name.trim() ? body.name.trim() : current.name,
      typeof body.brand === 'string' && body.brand.trim() ? body.brand.trim() : current.brand,
      typeof body.category === 'string' && body.category.trim() ? body.category.trim() : current.category,
      body.cc !== undefined ? Number(body.cc) : current.cc,
      body.engineCapacityLabel ?? current.engineCapacityLabel,
      body.engineType ?? current.engineType,
      body.horsepower ?? current.horsepower,
      body.torque ?? current.torque,
      body.transmission ?? current.transmission,
      body.fuelTankCapacity ?? current.fuelTankCapacity,
      body.mileage ?? current.mileage,
      body.topSpeed ?? current.topSpeed,
      body.brakingSystem ?? current.brakingSystem,
      body.frontSuspension ?? current.frontSuspension,
      body.rearSuspension ?? current.rearSuspension,
      body.dimensions ?? current.dimensions,
      body.weight ?? current.weight,
      JSON.stringify(Array.isArray(body.colors) ? body.colors : current.colors),
      body.estimatedPricePkr !== undefined ? Number(body.estimatedPricePkr) : current.estimatedPricePkr,
      body.priceLabel ?? current.priceLabel,
      body.priceUpdatedAt ?? now.slice(0, 10),
      JSON.stringify(Array.isArray(body.keyFeatures) ? body.keyFeatures : current.keyFeatures),
      body.description ?? current.description,
      body.imageUrl ?? current.imageUrl,
      JSON.stringify(Array.isArray(body.galleryUrls) ? body.galleryUrls : current.galleryUrls),
      body.isFeatured !== undefined ? (body.isFeatured ? 1 : 0) : current.isFeatured ? 1 : 0,
      body.isLatestArrival !== undefined ? (body.isLatestArrival ? 1 : 0) : current.isLatestArrival ? 1 : 0,
      body.popularityScore !== undefined ? Number(body.popularityScore) : current.popularityScore,
      body.availability ?? current.availability,
      now,
      id,
    );

    const updated = db.prepare('SELECT * FROM motorcycles WHERE id = ?').get(id) as Record<string, unknown>;
    res.json({ motorcycle: mapMotorcycleRow(updated) });
  });

  app.delete('/api/admin/motorcycles/:id', requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    const info = db.prepare('DELETE FROM motorcycles WHERE id = ?').run(id);
    if (info.changes === 0) {
      res.status(404).json({ error: 'Motorcycle not found.' });
      return;
    }
    res.json({ ok: true });
  });

  app.post('/api/admin/brands', requireAdmin, (req, res) => {
    const { name, country, summary, isFeatured } = req.body ?? {};
    if (typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'Brand name is required.' });
      return;
    }
    const slug = slugify(name);
    try {
      const result = db
        .prepare('INSERT INTO brands (name, slug, country, summary, is_featured) VALUES (?, ?, ?, ?, ?)')
        .run(
          name.trim(),
          slug,
          typeof country === 'string' && country.trim() ? country.trim() : 'International',
          typeof summary === 'string' && summary.trim() ? summary.trim() : 'Authorized motorcycle brand.',
          isFeatured ? 1 : 0,
        );
      const row = db.prepare('SELECT * FROM brands WHERE id = ?').get(result.lastInsertRowid) as Record<
        string,
        unknown
      >;
      res.status(201).json({ brand: mapBrandRow(row) });
    } catch {
      res.status(409).json({ error: 'Brand already exists.' });
    }
  });

  app.delete('/api/admin/brands/:id', requireAdmin, (req, res) => {
    db.prepare('DELETE FROM brands WHERE id = ?').run(Number(req.params.id));
    res.json({ ok: true });
  });

  app.post('/api/admin/categories', requireAdmin, (req, res) => {
    const { name, description, imageUrl } = req.body ?? {};
    if (typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'Category name is required.' });
      return;
    }
    const slug = slugify(name);
    try {
      const result = db
        .prepare('INSERT INTO categories (name, slug, description, image_url) VALUES (?, ?, ?, ?)')
        .run(
          name.trim(),
          slug,
          typeof description === 'string' && description.trim() ? description.trim() : 'Motorcycle category.',
          typeof imageUrl === 'string' && imageUrl.trim()
            ? imageUrl.trim()
            : '/src/assets/images/bike_sports_crimson_1794636800889.jpg',
        );
      const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid) as Record<
        string,
        unknown
      >;
      res.status(201).json({ category: mapCategoryRow(row) });
    } catch {
      res.status(409).json({ error: 'Category already exists.' });
    }
  });

  app.delete('/api/admin/categories/:id', requireAdmin, (req, res) => {
    db.prepare('DELETE FROM categories WHERE id = ?').run(Number(req.params.id));
    res.json({ ok: true });
  });

  app.get('/api/admin/inquiries', requireAdmin, (_req, res) => {
    const rows = db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC').all() as Record<
      string,
      unknown
    >[];
    res.json({ inquiries: rows.map(mapInquiryRow) });
  });

  app.patch('/api/admin/inquiries/:id', requireAdmin, (req, res) => {
    const { status } = req.body ?? {};
    if (!['New', 'Contacted', 'Closed'].includes(status)) {
      res.status(400).json({ error: 'Invalid inquiry status.' });
      return;
    }
    db.prepare('UPDATE inquiries SET status = ? WHERE id = ?').run(status, Number(req.params.id));
    const row = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(Number(req.params.id)) as Record<
      string,
      unknown
    >;
    res.json({ inquiry: mapInquiryRow(row) });
  });

  app.get('/api/admin/users', requireAdmin, (_req, res) => {
    const rows = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all() as Record<
      string,
      unknown
    >[];
    res.json({ users: rows.map(mapUserRow) });
  });

  app.patch('/api/admin/users/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    const targetId = Number(req.params.id);
    const { role } = req.body ?? {};
    if (!['customer', 'admin'].includes(role)) {
      res.status(400).json({ error: 'Role must be customer or admin.' });
      return;
    }
    if (targetId === req.authUser!.id && role !== 'admin') {
      res.status(400).json({ error: 'You cannot remove your own administrator access.' });
      return;
    }
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, targetId);
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId) as Record<string, unknown>;
    res.json({ user: mapUserRow(row) });
  });

  app.put('/api/admin/content', requireAdmin, (req, res) => {
    const updates = req.body ?? {};
    const allowedKeys = [
      'heroHeadline',
      'heroSubheadline',
      'heroCtaLabel',
      'showroomAddress',
      'showroomCity',
      'showroomHours',
      'whatsappNumber',
      'announcementText',
      'priceDisclaimer',
    ];
    const stmt = db.prepare(
      'INSERT INTO site_content (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    );
    for (const k of allowedKeys) {
      if (typeof updates[k] === 'string' && updates[k].trim()) {
        stmt.run(k, updates[k].trim());
      }
    }
    res.json({ content: getSiteContent() });
  });

  app.post('/api/admin/guides', requireAdmin, (req, res) => {
    const { title, category, excerpt, contentParagraphs, readTime, imageUrl } = req.body ?? {};
    if (typeof title !== 'string' || title.trim().length < 5) {
      res.status(400).json({ error: 'Guide title is required.' });
      return;
    }
    const slug = slugify(title);
    const paragraphs = Array.isArray(contentParagraphs)
      ? contentParagraphs
      : typeof contentParagraphs === 'string'
        ? contentParagraphs.split('\n\n').filter(Boolean)
        : [excerpt || title];

    const result = db
      .prepare(
        'INSERT INTO guides (slug, title, category, excerpt, content, read_time, published_at, image_url, faqs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .run(
        `${slug}-${Date.now().toString().slice(-4)}`,
        title.trim(),
        category?.trim() || 'Buying Guide',
        excerpt?.trim() || paragraphs[0] || title.trim(),
        JSON.stringify(paragraphs),
        readTime?.trim() || '5 min read',
        new Date().toISOString().slice(0, 10),
        imageUrl?.trim() || '/src/assets/images/bike_commuter_classic_1794636800924.jpg',
        JSON.stringify([]),
      );
    const row = db.prepare('SELECT * FROM guides WHERE id = ?').get(result.lastInsertRowid) as Record<
      string,
      unknown
    >;
    res.status(201).json({ guide: mapGuideRow(row) });
  });

  app.delete('/api/admin/guides/:id', requireAdmin, (req, res) => {
    db.prepare('DELETE FROM guides WHERE id = ?').run(Number(req.params.id));
    res.json({ ok: true });
  });

  // Frontend serving (Vite dev middleware in dev, dist/ in production)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  // Fallback error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'An internal server error occurred.' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CHAND MOTORS server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start CHAND MOTORS server:', err);
  process.exit(1);
});
