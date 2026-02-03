# Finance GPT

A self-hosted personal finance tracking application. Designed to run on any Docker-compatible system.

## Features

- **Monthly Dashboard**: Track income and expenses for each month
  - Income sources with expected vs actual amounts
  - Expense categories with budgeted/actual amounts and optional paid status
  - Auto-cloning of expense structure from previous months
  - Financial summary showing remaining funds

- **Savings Goals**: Global savings targets with progress tracking
  - Visual progress bars
  - Edit target and current amounts
  - Add/delete goals

- **Yearly Review**: Annual statistics and charts
  - Income vs expenses visualization
  - Category breakdown
  - Savings rate analysis
  - Monthly breakdown table

- **Authentication**: Secure login system
  - Session-based auth (stays logged in for 30 days)
  - Change username/password from settings
  - SQL injection protection via Prisma ORM

## Tech Stack

| Layer      | Technology                 |
| ---------- | -------------------------- |
| Frontend   | React 18, Vite, TypeScript |
| Styling    | Tailwind CSS (dark mode)   |
| Backend    | Node.js, Express.js        |
| Database   | PostgreSQL 15              |
| ORM        | Prisma                     |
| Auth       | bcrypt, express-session    |
| Deployment | Docker, Docker Compose     |

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- For Raspberry Pi: 64-bit OS recommended (Raspberry Pi OS 64-bit)

### Deploy with One Command

```bash
git clone https://github.com/yourusername/finance-gpt.git
cd finance-gpt
docker compose up -d --build
```

First build takes 10-15 minutes on Raspberry Pi, ~1 minute on desktop.

### Access the App

Open your browser to:

```
http://localhost:3000
```

Or on Raspberry Pi:

```
http://<raspberry-pi-ip>:3000
```

### Default Credentials

| Field    | Value   |
| -------- | ------- |
| Username | `admin` |
| Password | `admin` |

> ⚠️ **Security Warning**: Change the default password immediately after first login via the settings icon (gear) in the top navigation.

## Configuration

Edit `docker-compose.yml` to customize:

```yaml
environment:
  - SESSION_SECRET=your-secure-random-string-here # Change this!
  - DATABASE_URL=postgresql://ledger:ledger_secret_2026@db:5432/marital_ledger
```

## Management Commands

```bash
# View logs
docker compose logs -f app

# Stop the application
docker compose down

# Stop and remove all data (fresh start)
docker compose down -v

# Restart after code changes
docker compose up -d --build

# Check container status
docker compose ps
```

## Data Persistence

All data is stored in a Docker volume (`postgres_data`). Your data persists across:

- Container restarts
- Image rebuilds
- System reboots

Only `docker compose down -v` deletes the data volume.

## Development Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or use Docker)

### Local Development

1. Start PostgreSQL:

   ```bash
   docker run -d --name finance-db \
     -e POSTGRES_USER=ledger \
     -e POSTGRES_PASSWORD=ledger_secret_2026 \
     -e POSTGRES_DB=marital_ledger \
     -p 5432:5432 \
     postgres:15-alpine
   ```

2. Install dependencies:

   ```bash
   npm install
   cd server && npm install
   cd ../client && npm install
   ```

3. Set up the database:

   ```bash
   cd server
   npx prisma generate
   npx prisma migrate deploy
   npx tsx src/seed.ts
   ```

4. Start development servers:

   ```bash
   # From project root
   npm run dev
   ```

   - Backend API: http://localhost:3001
   - Frontend: http://localhost:5173

## API Reference

### Authentication

| Method | Endpoint                       | Description                  |
| ------ | ------------------------------ | ---------------------------- |
| POST   | `/api/auth/login`              | Login with username/password |
| POST   | `/api/auth/logout`             | End session                  |
| GET    | `/api/auth/me`                 | Get current user             |
| POST   | `/api/auth/change-credentials` | Update username/password     |

### Monthly Data

| Method | Endpoint                      | Description                |
| ------ | ----------------------------- | -------------------------- |
| GET    | `/api/monthly`                | List all months            |
| GET    | `/api/monthly/:month`         | Get/create month (YYYY-MM) |
| DELETE | `/api/monthly/:month`         | Delete a month             |
| POST   | `/api/monthly/:month/income`  | Add income source          |
| PATCH  | `/api/monthly/income/:id`     | Update income              |
| DELETE | `/api/monthly/income/:id`     | Delete income              |
| POST   | `/api/monthly/:month/expense` | Add expense category       |
| PATCH  | `/api/monthly/expense/:id`    | Update expense             |
| DELETE | `/api/monthly/expense/:id`    | Delete expense             |

### Savings Goals

| Method | Endpoint           | Description    |
| ------ | ------------------ | -------------- |
| GET    | `/api/savings`     | List all goals |
| POST   | `/api/savings`     | Create goal    |
| PATCH  | `/api/savings/:id` | Update goal    |
| DELETE | `/api/savings/:id` | Delete goal    |

### Yearly Review

| Method | Endpoint            | Description             |
| ------ | ------------------- | ----------------------- |
| GET    | `/api/yearly`       | Get current year stats  |
| GET    | `/api/yearly/:year` | Get specific year stats |

## How It Works

### Month Cloning

When navigating to a new month that doesn't exist:

1. Expense categories are cloned from the most recent previous month
2. Only category names and budgeted amounts are copied
3. Actual amounts reset to 0, isPaid resets to false
4. Income sources must be entered fresh each month
5. If no previous data exists, default categories are created

### Design Philosophy

- Dark mode only with zinc color palette
- Sharp edges, no rounded corners
- Minimal ornamentation
- Focus on data clarity

## Security

- Passwords hashed with bcrypt (12 rounds)
- Session-based authentication (30-day expiry)
- All database queries use Prisma (SQL injection protected)
- Cookies use `httpOnly` and `sameSite: lax`

## License

MIT
