# Backend Setup Checklist

This project is backend-first ready for local development and testing.

## Priority Finish Plan (Step by Step)

1. Metrics refresh reliability (DONE)

- Manual Add Trade now recalculates metrics/snapshots immediately.
- Import batch completion recalculates immediately.
- Undo import recalculates immediately.
- This avoids stale dashboard data when queue workers are not running.

2. Account setup completion contract (DONE)

- Backend endpoint now returns onboarding/setup status per account:
  - firm selected
  - consistency rule set
  - timezone/reset configured
  - data source connected (manual/import/sync)
- Used as single source of truth for new-user empty states.

3. Trade import hardening (DONE)

- Add stronger import validation reporting (row-level reasons in response/meta). (DONE)
- Add idempotency key support for upload retries (avoid accidental duplicate imports). (DONE)

4. Rules safety & guardrails (DONE)

- Enforce account limits and rule sanity checks server-side on account/rule updates. (DONE)
- Add tests for edge cases (extreme percentages, malformed reset times, invalid target). (DONE - core cases added)

5. Ops & production readiness (DONE)

- Add rate limits for sensitive endpoints (import/add-trade/auth). (DONE)
- Add structured error payload format for frontend. (DONE)
- Add scheduled reconciliation command to rebuild snapshots for all active accounts. (DONE)

## 1. Fresh setup

```bash
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate:fresh --seed
```

## 2. Default demo access

Seeder creates:

- User email: `demo@consistracker.com`
- Password: `password123`
- Account: `FTMO 100K - Active`
- Trades: 30 seeded trades
- Rule config + cached metrics + daily snapshot

## 3. Run backend tests

```bash
php artisan test
```

Current verified result: `46 passed (278 assertions)`.

## 4. Core API flow to validate quickly

1. `POST /api/v1/auth/login`
2. `GET /api/v1/accounts`
3. `GET /api/v1/accounts/{id}/dashboard/summary`
4. `GET /api/v1/accounts/{id}/dashboard/recent-trades`
5. `GET /api/v1/accounts/{id}/dashboard/performance-by-symbol`

## 5. Import & rollback flow

1. `POST /api/v1/accounts/{id}/import-csv`
2. confirm `batch_uuid` in response
3. `DELETE /api/v1/accounts/{id}/imports/{batch_uuid}`
