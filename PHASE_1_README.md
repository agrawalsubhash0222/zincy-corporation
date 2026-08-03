# Zincy payment work — Phase 1 security foundation

This package contains only new or changed files. Extract it at the directory
that contains `backend`, `frontend`, `compose.yml`, and
`docker-compose.local.yml`, allowing the listed source files to be replaced.

Phase 1 deliberately does **not** enable PhonePe or change the payment UI yet.
It first closes the security gaps that would otherwise allow a user to alter
another customer's setup or submit a fake price. Test this phase locally before
moving to the PhonePe sandbox phase.

## What this phase changes

- Adds a 256-bit opaque login session in an `HttpOnly` cookie.
- Stores only the SHA-256 session-token hash in MySQL.
- Protects customer and admin API routes; admin routes require `ADMIN`.
- Verifies onboarding ownership for setup, progress, profile, and payment calls.
- Uses `/profile/me` and `/onboarding-requests/customer/me` instead of trusting
  a mobile number supplied by the browser.
- Calculates server and maintenance prices on the backend from fixed catalogs.
- Sends cookies on frontend Axios and Fetch API calls.
- Adds strict trusted-origin checks for state-changing dev/prod requests.
- Adds safe API error responses and pricing-catalog tests.

## Database

The application now needs `auth_sessions`. With the current local profile,
`spring.jpa.hibernate.ddl-auto=update` creates it automatically at startup.

`database/001_auth_sessions.sql` is also included for a controlled deployment.
Do not run it after Hibernate has already created the same table and indexes.

## Local setup

1. Create a working branch and back up the database.
2. Extract this archive over the project root.
3. Keep these local environment values:

   ```dotenv
   SPRING_PROFILES_ACTIVE=local
   FRONTEND_URL=http://localhost:8084
   SESSION_COOKIE_NAME=ZINCY_SESSION
   SESSION_DURATION_HOURS=168
   SESSION_COOKIE_SAME_SITE=Lax
   SESSION_COOKIE_SECURE=false
   REQUIRE_TRUSTED_ORIGIN=false
   ```

4. If the backend runs directly on port 8081, use:

   ```dotenv
   EXPO_PUBLIC_API_BASE_URL=http://localhost:8081/api
   ```

   If the supplied local Docker override maps the backend to port 8083, use:

   ```dotenv
   EXPO_PUBLIC_API_BASE_URL=http://localhost:8083/api
   ```

5. Start MySQL/backend as usual. For the provided Compose files:

   ```bash
   docker compose -f compose.yml -f docker-compose.local.yml up --build
   ```

6. Start the web frontend:

   ```bash
   cd frontend
   npm ci
   npm run web
   ```

7. Run backend tests from `backend`:

   ```bash
   mvn test
   ```

## Required smoke tests

1. Log in with WhatsApp OTP. The login response must set a
   `ZINCY_SESSION` cookie with `HttpOnly` and `SameSite=Lax`.
2. `GET /api/auth/session` must return the logged-in user.
3. Remove the cookie and call a protected endpoint; it must return `401`.
4. While logged in as a customer, call an admin endpoint; it must return `403`.
5. Request another user's onboarding ID; it must return `403`.
6. Add a fake `amount` or `baseAmount` to a setup request. The saved amount must
   still equal the backend catalog price.
7. Log out. The API must return `204`, clear the cookie, and set `revoked_at` on
   the matching `auth_sessions` row.
8. Confirm `auth_sessions.token_hash` contains a 64-character hash, never the
   raw browser cookie value.

## Deployment guardrails

- Do not place PhonePe client secrets in Expo variables, JavaScript, Git, or
  `app.json`; they belong only in backend environment secrets.
- Dev/prod require HTTPS cookies and trusted origins. `FRONTEND_URL` must be the
  exact comma-separated browser origin list, without paths.
- Do not deploy this phase alone to production. The next phase replaces the
  Razorpay-specific payment flow with PhonePe Standard Checkout, adds an
  idempotent payment schema, signed webhook handling, server-side status checks,
  and a non-spoofable success screen.
