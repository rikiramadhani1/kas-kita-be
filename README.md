kas-vmr-backend v3 (TypeScript + Express + Prisma + Baileys Bot)

Includes:
- Prisma schema with Member, Payment (month/year), CashFlow, Admin, AuthState, ChatLog
- Admin auth (register/login) with JWT
- Protected payment approval route (updates cashflow)
- Seed scripts for initial admin and members
- Integrated WhatsApp bot (Baileys) with natural commands: info, saldo, transaksi, bayar, approve, reject, help
- Rate limiter: max 10 messages/day per member
- Member identification via phone OR spouse_phone_number

Quick start:
1. Copy .env.example to .env and set DATABASE_URL, JWT_SECRET and BOT/admin vars.
2. Install dependencies: npm install
3. Generate Prisma client: npx prisma generate
4. Run migrations: npm run migrate
5. Seed initial data: npm run seed
6. Run dev server: npm run dev
7. On first bot run, scan QR printed in terminal.