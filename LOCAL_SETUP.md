# 🏠 SlideBanai - Local Development Setup

This guide will help you set up and run SlideBanai locally on your Windows machine for development and testing.

## Prerequisites

Make sure you have installed:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)

Verify installation:
```powershell
node --version
npm --version
```

## Step 1: Install Dependencies

From the project root directory:

```powershell
cd C:\Users\Lenovo\Desktop\k\SlideBanai\SlideBanai
npm install
```

## Step 2: Set Up Database

For local development, you have two options:

### Option A: PostgreSQL Local Database (Recommended)

1. **Install PostgreSQL** - [Download](https://www.postgresql.org/download/windows/)
   
2. **Create a local database:**
   ```powershell
   # Open PostgreSQL command line (psql)
   psql -U postgres
   
   # Create database
   CREATE DATABASE slidebanai_dev;
   
   # Create user (optional but recommended)
   CREATE USER slidebanai WITH PASSWORD 'your_password';
   ALTER ROLE slidebanai WITH CREATEDB;
   GRANT ALL PRIVILEGES ON DATABASE slidebanai_dev TO slidebanai;
   
   # Exit psql
   \q
   ```

3. **Update `.env` file** with your connection string:
   ```env
   DATABASE_URL=postgresql://slidebanai:your_password@localhost:5432/slidebanai_dev
   ```
   
   Or if using default postgres user:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/slidebanai_dev
   ```

### Option B: Use Neon (Cloud PostgreSQL - Easiest)

1. Go to [https://neon.tech](https://neon.tech) and create a free account
2. Create a new project and database
3. Copy the connection string
4. Update `.env`:
   ```env
   DATABASE_URL=postgresql://user:password@endpoint.neon.tech/dbname?sslmode=require
   ```

## Step 3: Configure Environment Variables

Edit `.env` file in your project root and set the required variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/slidebanai_dev

# Firebase Configuration (Optional for local dev, get from Firebase Console)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_PROJECT_ID=slidebanai-d4210
VITE_FIREBASE_APP_ID=your-firebase-app-id

# OpenAI API Key (Get from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-your-actual-key

# Session Secret (Generate a random string - minimum 32 characters)
SESSION_SECRET=your-random-secret-string-at-least-32-chars

# Optional
CANVA_API_KEY=your-canva-api-key
```

## Step 4: Initialize Database Schema

Run database migrations to set up tables:

```powershell
npm run db:push
```

This command uses Drizzle ORM to create all necessary database tables.

## Step 5: Start Development Server

```powershell
npm run dev
```

You should see:
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:5173/api
```

Open http://localhost:5173 in your browser to test the application.

## Step 6: Test the Application

1. **Create an account** - Use the signup form
2. **Create a presentation** - Test the main feature
3. **Check AI features** - Test the Coach AI if OpenAI key is configured
4. **View API logs** - Check terminal for API request logs

## Common Issues

### Issue: DATABASE_URL must be set

**Solution:** Ensure `DATABASE_URL` is set in your `.env` file and the database is running.

```powershell
# Test connection
psql "postgresql://user:password@localhost:5432/slidebanai_dev" -c "SELECT 1"
```

### Issue: Cannot connect to database

**Solution:** 
- Check PostgreSQL is running: `Get-Process postgres`
- Verify connection string syntax
- Test with psql directly

### Issue: Vite port already in use

**Solution:** Kill the process using port 5173:
```powershell
# Find process using port 5173
netstat -ano | findstr :5173

# Kill process (replace PID with the process ID)
taskkill /PID <PID> /F
```

### Issue: npm run dev fails with "Missing script"

**Solution:** Make sure you're in the correct directory:
```powershell
cd C:\Users\Lenovo\Desktop\k\SlideBanai\SlideBanai
npm run dev
```

## Build and Production Testing

To test the production build locally:

```powershell
# Build the application
npm run build

# Serve production build
npm start
```

Note: For production testing, ensure `NODE_ENV=production` is set and all required environment variables are configured.

## Database Schema Management

### View current schema:
```powershell
npm run db:push -- --dryRun
```

### Reset database (WARNING: Deletes all data):
```powershell
# Drop all tables
psql -U postgres -d slidebanai_dev -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Re-run migrations
npm run db:push
```

## Useful Commands

```powershell
# Type checking
npm run check

# View Drizzle database studio (interactive UI)
npx drizzle-kit studio

# Run individual components
npm run build        # Build frontend
npm run dev         # Development mode
npm start           # Production mode
```

## Next Steps

1. ✅ Set up local database
2. ✅ Configure `.env` variables
3. ✅ Run `npm install`
4. ✅ Run `npm run db:push`
5. ✅ Run `npm run dev`
6. ✅ Test at http://localhost:5173

Once local testing is complete, see [DEPLOY_INSTRUCTIONS.md](./DEPLOY_INSTRUCTIONS.md) for deployment to Firebase.

## Need Help?

Check the other documentation files:
- [DEPLOYMENT_READY.md](./DEPLOYMENT_READY.md) - Pre-deployment checklist
- [DEPLOY_INSTRUCTIONS.md](./DEPLOY_INSTRUCTIONS.md) - Firebase deployment guide
- [post-deployment-setup.md](./post-deployment-setup.md) - After deployment setup
