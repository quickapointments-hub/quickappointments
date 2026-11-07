# QUICK APPOINTMENTS — PRODUCTION DEPLOYMENT GUIDE

## 1. Environment Configuration

### Backend API (`packages/backend-api/.env`)
```ini
PORT=4000
DATABASE_URL="file:./dev.db" # or Supabase Postgres URL
JWT_SECRET="<generate-secure-32-byte-hex-string>"
JWT_REFRESH_SECRET="<generate-secure-32-byte-hex-string>"
NODE_ENV="production"

# Supabase Production & Storage Credentials
SUPABASE_PROJECT_ID="ugxgtgvykauyydxoqouz"
SUPABASE_REGION="ap-southeast-1"
SUPABASE_URL="https://ugxgtgvykauyydxoqouz.supabase.co"
SUPABASE_ANON_KEY="sb_publishable_sCfjCcIrT0I5JHxWy5oEAg_yvzs9lD1"
SUPABASE_SERVICE_ROLE_KEY="<YOUR_SUPABASE_SERVICE_ROLE_KEY>"

# Supabase PostgreSQL Pooler Connection
# DATABASE_URL="postgresql://postgres.ugxgtgvykauyydxoqouz:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

### Admin Web & Mobile Frontend (`.env`)
```ini
VITE_API_URL="https://api.yourdomain.com/api"
VITE_SUPABASE_URL="https://ugxgtgvykauyydxoqouz.supabase.co"
VITE_SUPABASE_ANON_KEY="sb_publishable_sCfjCcIrT0I5JHxWy5oEAg_yvzs9lD1"
```

## 2. Production Build Commands
```bash
# Build Universal Shared Types
npm --prefix packages/shared-types run build

# Build Admin Web Console
npm --prefix packages/admin-web run build

# Build Mobile App Webview / Expo
npm --prefix packages/customer-provider-mobile run build
```

