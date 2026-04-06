# Backend Setup Checklist

This project is backend-first ready for local development and testing.

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

