# Localea Rental Management — Setup & Installation Guide

This guide provides end-to-end instructions for deploying and running **Localea Rental Management** across:
1. **Local Development & Testing** (with or without local PostgreSQL)
2. **Production VPS / Linux Server** (Ubuntu/Debian, Systemd, Caddy Reverse Proxy, Wildcard SSL)
3. **Cloud Container Platforms** (Google Cloud Run, AWS, Render, Railway)
4. **Multi-Tenancy Configuration** (Subdomains `*.rental.triotek.co.ke` + Custom Domains)

---

## 🏗️ Architecture Overview

Localea is built on:
- **Next.js 16 (App Router)** & React 19 (Standalone Node.js Server on port 3000)
- **PostgreSQL Database** with Prisma ORM (plus resilient in-memory fallback for instant dev/testing)
- **Model 2 Multi-Tenancy**: Subdomain-based routing (`<tenant>.rental.triotek.co.ke`) and optional custom domains (`rentals.yourcompany.com`)
- **Role-Based Routing**: Managers & administrators route to `/dashboard`; tenants, owners, and contractors route to `/portal`

---

## ⚡ Option 1: Local Setup (Quickest)

### 1. Prerequisites
- Node.js 20+ (Node.js 22 LTS recommended)
- npm 10+

### 2. Clone and Install
```bash
git clone https://github.com/triodigitech-dev1/Localea-rental-managment.git
cd Localea-rental-managment
npm install
```

### 3. Run the Interactive Localea CLI Setup
Instead of wrestling with manual configuration files, run the interactive onboarding tool:
```bash
npm run setup:cli
```
The CLI will interactively guide you through:
1. **Organization Name** (e.g. `Localea Properties`)
2. **Subdomain** for `*.rental.triotek.co.ke` (e.g. `kilimani`)
3. **Optional Custom Domain** (leave empty for local testing)
4. **Administrator Email & Password**
5. **Database Connection** (press Enter to accept default or use built-in mock mode)
6. **Demo Mode Preference** (Guided Demo Tour vs. Clean Empty Production)

### 4. Start the Application
```bash
# Development server with live reload:
npm run dev

# Or compile and run production standalone build:
npm run build
npm start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🖥️ Option 2: Production VPS / Dedicated Server (Ubuntu 22.04 / 24.04)

This recommended setup runs Localea directly on Linux using Node.js standalone runtime, Systemd for process supervision, and Caddy for automated Let's Encrypt HTTPS certificates with wildcard subdomain support.

### Step 1: Install Node.js 22 & PostgreSQL
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw

# Install Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL 16
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### Step 2: Create PostgreSQL Database & User
```bash
sudo -u postgres psql << 'EOF'
CREATE DATABASE localea;
CREATE USER localea WITH ENCRYPTED PASSWORD 'StrongSecretPassword123!';
GRANT ALL PRIVILEGES ON DATABASE localea TO localea;
ALTER DATABASE localea OWNER TO localea;
\q
EOF
```

### Step 3: Clone Localea and Install Dependencies
```bash
# Clone to /var/www/localea or /opt/localea
sudo mkdir -p /var/www/localea
sudo chown -R $USER:$USER /var/www/localea
git clone https://github.com/triodigitech-dev1/Localea-rental-managment.git /var/www/localea
cd /var/www/localea

npm install
```

### Step 4: Run CLI Setup for Production
Run the setup tool to create your production `.env` and provision your primary tenant & superadmin:
```bash
npm run setup:cli
```
Provide your database URL:
```text
postgresql://localea:StrongSecretPassword123!@localhost:5432/localea?schema=public
```
And specify your subdomain prefix (e.g. `mycompany` for `mycompany.rental.triotek.co.ke`).

Run migrations:
```bash
npx prisma migrate deploy
```

### Step 5: Build Next.js Production Bundle
```bash
npm run build
```

### Step 6: Configure Systemd Service
Create `/etc/systemd/system/localea.service`:
```ini
[Unit]
Description=Localea Rental Management Server
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/localea
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOST=0.0.0.0
EnvironmentFile=/var/www/localea/.env
ExecStart=/usr/bin/node /var/www/localea/.next/standalone/server.js
Restart=always
RestartSec=5
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=localea

[Install]
WantedBy=multi-user.target
```

Set permissions, enable, and start the service:
```bash
sudo chown -R www-data:www-data /var/www/localea
sudo systemctl daemon-reload
sudo systemctl enable localea
sudo systemctl start localea
sudo systemctl status localea
```

### Step 7: Configure Caddy Reverse Proxy & Automatic HTTPS
Install Caddy:
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

Edit `/etc/caddy/Caddyfile`:
```caddy
# Base domain & wildcard subdomains
rental.triotek.co.ke, *.rental.triotek.co.ke {
    reverse_proxy 127.0.0.1:3000 {
        header_up Host {host}
        header_up X-Real-IP {remote}
        header_up X-Forwarded-For {remote}
        header_up X-Forwarded-Proto {scheme}
    }
}
```

Reload Caddy:
```bash
sudo systemctl restart caddy
```

---

## 🌐 Option 3: Cloud Platforms (Google Cloud Run / Render / AWS)

When deploying to containerized cloud platforms:
1. **Container Port**: 3000
2. **Start Command**: `node .next/standalone/server.js` or `npm start`
3. **Required Environment Variables**:
   ```ini
   NODE_ENV=production
   PORT=3000
   HOST=0.0.0.0
   DATABASE_URL=postgresql://user:password@cloud-sql-host:5432/localea?sslmode=require
   AUTH_SECRET=your_generated_random_secret_string
   AUTH_TRUST_HOST=true
   DOMAIN=rental.triotek.co.ke
   ```

---

## 🏢 Multi-Tenancy Management (Model 2)

Localea uses **Model 2 Multi-Tenancy**:
- **Base Domain**: `rental.triotek.co.ke`
- **Subdomain Routing**: Incoming requests to `https://subdomain.rental.triotek.co.ke` are automatically routed to the corresponding tenant workspace.
- **Custom Domains**: If a tenant configures a custom domain (e.g., `rentals.triotek.co.ke`), requests matching `Host` headers are automatically bound to that tenant.

### Managing Tenants with the CLI

#### 1. Onboard a New Tenant & Administrator
```bash
npm run cli setup -- \
  --tenant-name "Sunshine Real Estate" \
  --subdomain "sunshine" \
  --admin-email "admin@sunshine.co.ke" \
  --admin-password "SecurePass123!"
```

#### 2. List All Active Tenants & Domains
```bash
npm run cli tenant:list
```

#### 3. Toggle Guided Demo Mode on a Tenant
```bash
npm run cli demo:toggle --subdomain sunshine
```

---

## 🔒 Google OAuth Setup (Optional)

To enable 1-click **Continue with Google** on the login page:
1. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Set Authorized Redirect URI:
   `https://rental.triotek.co.ke/api/auth/callback/google` (and any custom domain callbacks).
3. Add to your `.env`:
   ```ini
   GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```
4. Restart the server. New users signing in with Google are automatically provisioned and assigned to the active tenant workspace.

---

## ✅ Verification Checklist

To verify your installation:
```bash
# 1. Run full unit test suite (allocation, schema, tenant resolution, RBAC)
npm test

# 2. Check Next.js production compilation
npm run build

# 3. Verify tenant resolution
npx tsx scripts/localea-cli.ts tenant:list
```
Once verified, navigate to your domain in your browser:
- Manager login: **`/login`** (directs to `/dashboard` for managers/admins)
- Resident & contractor portal: **`/portal`** (directs to `/portal` for resident roles)
