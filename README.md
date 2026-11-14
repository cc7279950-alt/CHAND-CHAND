# CHAND MOTORS

CHAND MOTORS is a Pakistan-focused motorcycle catalog with model comparison, estimates in PKR, WhatsApp inquiries, customer accounts, and an administrator dashboard.

## Run locally

Requires Node.js 22.12 or newer.

```sh
npm install
npm run dev
```

The development server uses an ephemeral JWT secret if `JWT_SECRET` is not set, so sessions expire when it restarts. To seed an initial administrator, configure both `ADMIN_BOOTSTRAP_EMAIL` and `ADMIN_BOOTSTRAP_PASSWORD` before the first start; the password must be at least 16 characters. No default administrator credentials are shipped.

## Production setup

Copy `.env.example` to `.env` and set a unique `JWT_SECRET` with at least 32 characters, `APP_URL`, and (if needed) both initial-admin values. Configure SMTP or Gmail credentials to enable password reset emails and sign-in notifications. Password recovery returns an explicit unavailable error when mail delivery is not configured.

Run `npm run build`, then `npm run start`. The application stores accounts, catalog edits, and inquiries in `data/chand_motors.db`; use a persistent disk and a single application instance unless the database layer is replaced with a shared service. Back up that file securely and do not commit it.

## Catalog data notes

Most seeded PKR prices are dated estimates, not live quotes; seeded availability is unconfirmed, and bundled motorcycle images are illustrative rather than model-specific photographs. Seven models currently have primary-source references checked 2026-11-14: Suzuki GD 110S and GS 150 (manufacturer starting prices PKR 379,900 and PKR 409,900); Kawasaki Ninja ZX-6R and Vulcan S (US-market references, not Pakistan pricing); United US 70; Road Prince Passion Plus 70cc (manufacturer website lists PKR 121,000); and Super Power SP 70cc Deluxe RED. No primary-source link is recorded yet for the other seeded models. Public catalog and comparison responses suppress technical values unless their individual fields are marked source-verified; remaining fields are explicitly labeled unverified. Administrators can maintain HTTPS source links, checked dates, and field-level coverage in the motorcycle editor. Editorial guide content has not yet been comprehensively source-audited. CHAND MOTORS does not publish a street address or operating hours until those business details are configured by an administrator.

The `npm run lint` script runs TypeScript checks; `npm run build` creates the production frontend bundle.
