# Local Deployment Guide - SlideBanai

## Prerequisites

- Node.js 18+ installed
- Python 3.11+ (for FastAPI gateway)
- NeonDB PostgreSQL credentials
- Firebase credentials (for authentication)

## Step 1: Environment Setup

### 1.1 Create `.env` file

Create a `.env` file in the project root with:

```env
# Database
DATABASE_URL=postgresql://neondb_owner:npg_lgphR4c0duGo@ep-flat-mountain-adqzjvqk-pooler.c-2.us-east-1.aws.neon.tech/neondb

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# OpenAI
OPENAI_API_KEY=your-openai-key

# Google Slides
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Server Config
PORT=5000
NODE_ENV=development
```

### 1.2 FastAPI Gateway (Optional)

Create `fastapi_server/.env`:

```env
FASTAPI_PORT=8000
EXPRESS_BACKEND_URL=http://localhost:5000
```

## Step 2: Install Dependencies

### Backend

```bash
# Install Node dependencies
npm install

# (Optional) Install FastAPI gateway
cd fastapi_server
pip install -r requirements.txt
cd ..
```

### Frontend

The frontend dependencies are included in the main `npm install`, but you can also:

```bash
cd client
npm install
cd ..
```

## Step 3: Database Setup

### 3.1 Verify Database Connection

```bash
# Test the connection
npm run db:push
```

This will:
- Connect to your NeonDB instance
- Verify all tables exist
- Push any schema changes if needed

### 3.2 Seed Sample Data (Optional)

If you want sample data for testing:

```bash
# Create a seed script (if not exists)
# Or manually insert test data into NeonDB
```

## Step 4: Start Development Servers

### Terminal 1: Express Backend

```bash
# Start the backend on port 5000
npm run dev
```

Expected output:
```
Server running on http://localhost:5000
Connected to database
Listening on port 5000
```

### Terminal 2: React Frontend

```bash
# In a new terminal, start frontend on port 5173
npm run client
```

Expected output:
```
VITE v4.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
```

### Terminal 3: FastAPI Gateway (Optional)

```bash
# In another terminal
cd fastapi_server
python main.py
```

Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## Step 5: Access the Application

### Development URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api-docs
- **FastAPI Gateway** (optional): http://localhost:8000

### First Login

1. Open http://localhost:5173
2. Click "Sign Up" or "Sign In"
3. Use Firebase email/password auth
4. You're now authenticated!

## Step 6: Test New Features

### Analytics Dashboard

1. Navigate to `/analytics` in the frontend
2. Should see:
   - Total presentations and practice sessions
   - Practice trends chart
   - Top presentations list
   - Language performance breakdown
3. Click on a presentation to see detailed analytics

### Collaboration Center

1. Navigate to `/collaboration` in the frontend
2. Should see:
   - Active collaborations
   - Team member statistics
   - Recent activity timeline
   - Collaboration suggestions

### Test with curl

```bash
# Get analytics dashboard
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/analytics/dashboard

# Get collaboration overview
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/collaboration/overview

# Get API documentation
curl http://localhost:5000/api-docs
```

## Step 7: Verify Deployment

### Checklist

- [ ] Backend starts without errors
- [ ] Frontend loads at http://localhost:5173
- [ ] Can login with Firebase credentials
- [ ] Analytics page loads and shows data
- [ ] Collaboration page loads and shows data
- [ ] Swagger API docs accessible at `/api-docs`
- [ ] Network tab shows API calls succeeding (200/201 status)

### Common Issues

**Port Already in Use**
```bash
# Kill process on port 5000 (backend)
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -i :5173 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

**Database Connection Error**
```bash
# Verify DATABASE_URL in .env
# Check NeonDB credentials
# Ensure you're not behind a restrictive firewall
```

**CORS Errors**
```bash
# Backend CORS is configured to accept localhost
# If you're testing from a different origin, update server/index.ts
```

## Step 8: Useful Commands

```bash
# Start backend
npm run dev

# Build frontend
npm run build

# Run type checking
npm run check

# Push database schema changes
npm run db:push

# Start FastAPI gateway
cd fastapi_server && python main.py

# View Swagger documentation
# Navigate to http://localhost:5000/api-docs
```

## Development Workflow

1. **Backend Changes**: Files in `server/` and `apps/backend/` automatically reload
2. **Frontend Changes**: Files in `client/src/` automatically reload with hot-reload
3. **Database Changes**: Use Drizzle Kit to manage migrations
4. **TypeScript**: Run `npm run check` to verify types

## Debugging

### Enable Debug Logging

Add to `.env`:
```env
DEBUG=*
LOG_LEVEL=debug
```

### Browser DevTools

1. Open Chrome/Firefox DevTools (F12)
2. Network tab shows all API calls
3. Console tab shows JavaScript errors
4. Application tab shows localStorage and cookies

### Backend Logging

All API requests are logged to console with:
- Request method and path
- Status code
- Response time
- Request/response body (for errors)

## Next Steps

1. **Explore Features**
   - Create presentations
   - Practice with speech coach
   - View analytics
   - Invite collaborators

2. **Customize Configuration**
   - Update branding/colors in `client/src/`
   - Configure authentication providers
   - Set up email notifications

3. **Deploy to Production**
   - Use Docker for containerization
   - Set up CI/CD pipeline
   - Configure production database
   - Use environment-specific configs

## Production Deployment

### Using Docker

```bash
# Build Docker image
docker build -t slidebanai:latest .

# Run container
docker run -p 5000:5000 \
  -e DATABASE_URL=production-db-url \
  -e FIREBASE_PROJECT_ID=prod-id \
  slidebanai:latest
```

### Environment Variables for Production

```env
NODE_ENV=production
DATABASE_URL=<production-database-url>
FIREBASE_PROJECT_ID=<prod-project-id>
OPENAI_API_KEY=<prod-key>
# ... other production secrets
```

## Support & Troubleshooting

For issues:
1. Check `/api-docs` Swagger documentation
2. Review console logs (backend and frontend)
3. Check database connection in `.env`
4. Verify all dependencies are installed
5. Clear node_modules and reinstall if needed

## Summary

✅ Local deployment complete!

Your SlideBanai instance is now running with:
- Express.js backend on port 5000
- React frontend on port 5173
- PostgreSQL database via NeonDB
- New Analytics and Collaboration features
- Full API documentation via Swagger
- Firebase authentication

Start creating and practicing presentations! 🚀

---

**Last Updated**: January 8, 2026
**Version**: 1.0 (Production Ready)
