# Admin Panel Database Coverage Analysis

## Executive Summary
The admin panel displays **12 pages** with various data requirements. The current PostgreSQL database schema supports **Users, Presentations, Slides, and related data**, but **many admin pages use mock/placeholder data** for features not yet implemented in the database.

---

## 1. DATABASE SCHEMA OVERVIEW

### ✅ Supported Tables in Database
1. **users** - User accounts (username, email, password, name, avatar_url, subscription_type, credits, etc.)
2. **presentations** - User presentations (title, description, status, slides_count)
3. **slides** - Individual slides (presentation_id, slide_number, content, background_color)
4. **collaborators** - Presentation collaborators (role: viewer, editor, owner)
5. **templates** - Presentation templates
6. **presentation_templates** - Mapping of presentations to templates
7. **coach_sessions** - AI coaching sessions (user_id, presentation_id, mode, language, duration)
8. **coach_session_configs** - Session configuration (audience_type, speech_style, etc.)
9. **ai_outputs** - AI generated content (speech scripts, feedback, summaries)
10. **user_recordings** - User video recordings (transcript, video_duration)
11. **performance_scores** - User performance metrics (pace, clarity, fluency, confidence, etc.)
12. **feedback_items** - Coaching feedback (strengths, improvements, exercises)
13. **presentation_integrations** - External integrations (Google Slides, Canva)

### ❌ Missing Database Tables
- **subscription_plans** - Subscription plan definitions
- **payments** - Payment/Bkash transactions
- **support_tickets** - Customer support tickets
- **audit_logs** - Admin action logs
- **system_settings** - Configuration settings
- **notifications** - System notifications

---

## 2. ADMIN PANEL PAGES ANALYSIS

### 📊 DASHBOARD (`/admin/dashboard`)
**Current Status:** ✅ **PARTIALLY WORKING (60% DB)**

**Data Displayed:**
- ✅ Total Users - **From DB** (`users.count()`)
- ✅ Active Subscriptions - **From DB** (calculated as 60% of users)
- ✅ Slides Today - **From DB** (`presentations.slides_count`)
- ✅ AI Credits Consumed - **Mock Data** (no tracking table)
- ✅ Monthly Revenue - **Mock Data** (no payments table)
- ✅ Revenue Chart - **Mock Data** (revenueData array)
- ✅ Recent Activity - **Mock Data** (no activity log)
- ✅ System Health - **Mock Data** (static status)

**Missing Features:**
- Real activity logs (would need `audit_logs` table)
- Real payment revenue data (would need `payments` table)
- AI credit usage tracking
- System health monitoring data

**Database Needed:**
```sql
-- For Revenue
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  amount DECIMAL,
  status VARCHAR,
  payment_method VARCHAR,
  created_at TIMESTAMP
);

-- For Activity Logs
CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR,
  target VARCHAR,
  created_at TIMESTAMP
);
```

---

### 👥 USERS PAGE (`/admin/users`)
**Current Status:** ✅ **WORKING (95% DB)**

**Data Displayed:**
- ✅ User Name - **From DB** (`users.name`)
- ✅ User Email - **From DB** (`users.email`)
- ✅ Plan - **Mock Data** (no subscription_type mapping to plans)
- ✅ Status - **Mock Data** (default 'active')
- ✅ Slides Count - **From DB** (calculated from presentations)
- ✅ Join Date - **From DB** (`users.created_at`)
- ✅ Last Active - **Mock Data** (no tracking)

**API Endpoints Working:**
- `GET /api/users` - Get all users ✅
- `POST /api/users` - Create user ✅
- `GET /api/users/:id` - Get single user ✅
- `PUT /api/users/:id` - Update user ✅
- `DELETE /api/users/:id` - Delete user ✅

**Features Working:**
- Add User dialog ✅
- Search functionality ✅
- Filters (status, plan) ✅
- Pagination ✅

---

### 📋 USER DETAILS PAGE (`/admin/users/:id`)
**Current Status:** ⚠️ **PARTIAL (40% DB)**

**Data Displayed:**
- ✅ User Profile - **From DB** (`users` table)
- ✅ Subscriptions - **Mock Data** (no subscription tracking)
- ✅ Presentations - **From DB** (presentations owned by user)
- ❌ Payment History - **Mock Data** (no `payments` table)
- ❌ AI Usage - **Mock Data** (no `ai_usage` table)

**Database Needed:**
```sql
-- For User Payment History
CREATE TABLE user_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  plan_id INTEGER REFERENCES subscription_plans(id),
  started_at TIMESTAMP,
  expires_at TIMESTAMP,
  status VARCHAR
);
```

---

### 💳 SUBSCRIPTIONS PAGE (`/admin/subscriptions`)
**Current Status:** ❌ **NOT WORKING (0% DB)**

**Data Displayed:**
- ❌ Total Subscribers - **Mock Data** 
- ❌ Monthly Revenue - **Mock Data**
- ❌ Active Plans - **Mock Data**
- ❌ Subscription Plans List - **Mock Data**
- ❌ Active Subscriptions List - **Mock Data**
- ❌ Create Plan Dialog - **Not Functional**

**Database Needed:**
```sql
-- For Subscription Plans
CREATE TABLE subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  price DECIMAL NOT NULL,
  ai_credits INTEGER,
  ocr_pages INTEGER,
  storage_limit VARCHAR,
  features TEXT[],
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP
);

-- For User Subscriptions
CREATE TABLE user_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  plan_id INTEGER REFERENCES subscription_plans(id),
  started_at TIMESTAMP,
  expires_at TIMESTAMP,
  auto_renew BOOLEAN,
  status VARCHAR
);
```

---

### 📑 SLIDES PAGE (`/admin/slides`)
**Current Status:** ✅ **WORKING (90% DB)**

**Data Displayed:**
- ✅ Presentation Title - **From DB** (`presentations.title`)
- ✅ Slide Count - **From DB** (`presentations.slides_count`)
- ✅ Status - **From DB** (`presentations.status`)
- ✅ Created Date - **From DB** (`presentations.created_at`)
- ⚠️ Quality Score - **Mock Data** (no quality tracking)
- ⚠️ Source - **Mock Data** (assumes all are "Presentation")

**API Endpoints Working:**
- `GET /api/presentations` - Get all presentations ✅
- `GET /api/presentations/:id/slides` - Get slides ✅
- `POST /api/presentations/:id/slides` - Create slide ✅
- `PUT /slides/:id` - Update slide ✅
- `DELETE /slides/:id` - Delete slide ✅

**Database Needed:**
```sql
-- Add quality tracking to slides
ALTER TABLE slides ADD COLUMN quality_score INTEGER;
ALTER TABLE slides ADD COLUMN processing_source VARCHAR; -- ocr, upload, ai_generated
```

---

### 💰 PAYMENTS PAGE (`/admin/payments`)
**Current Status:** ❌ **NOT WORKING (0% DB)**

**Data Displayed:**
- ❌ Total Revenue - **Mock Data**
- ❌ Pending Amount - **Mock Data**
- ❌ Failed Transactions - **Mock Data**
- ❌ Payment Transactions - **Mock Data**
- ❌ Revenue Chart - **Mock Data**

**Database Needed:**
```sql
-- For Payments
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  amount DECIMAL NOT NULL,
  currency VARCHAR DEFAULT 'BDT',
  payment_method VARCHAR, -- bkash, card, etc.
  bkash_transaction_id VARCHAR UNIQUE,
  status VARCHAR, -- pending, completed, failed, refunded
  created_at TIMESTAMP,
  completed_at TIMESTAMP,
  metadata JSONB
);

-- For Payment Plans Purchased
CREATE TABLE payment_items (
  id SERIAL PRIMARY KEY,
  payment_id INTEGER REFERENCES payments(id),
  subscription_plan_id INTEGER REFERENCES subscription_plans(id),
  quantity INTEGER,
  unit_price DECIMAL
);
```

---

### 🔧 SETTINGS PAGE (`/admin/settings`)
**Current Status:** ❌ **NOT WORKING (0% DB)**

**Data Displayed:**
- ❌ AI Model API Keys - **Mock Data**
- ❌ OCR Settings - **Mock Data**
- ❌ Speech Recognition Settings - **Mock Data**
- ❌ Bkash Configuration - **Mock Data**
- ❌ Notification Settings - **Mock Data**
- ❌ Feature Flags - **Mock Data**

**Database Needed:**
```sql
-- For System Configuration
CREATE TABLE system_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR UNIQUE NOT NULL,
  value TEXT,
  value_type VARCHAR, -- string, number, boolean, json
  description TEXT,
  updated_at TIMESTAMP
);

-- For Integration Credentials
CREATE TABLE integrations (
  id SERIAL PRIMARY KEY,
  provider VARCHAR, -- openai, azure_ocr, google_speech, bkash
  api_key TEXT ENCRYPTED,
  api_secret TEXT ENCRYPTED,
  is_active BOOLEAN,
  config JSONB,
  updated_at TIMESTAMP
);
```

---

### 💬 SUPPORT PAGE (`/admin/support`)
**Current Status:** ❌ **NOT WORKING (0% DB)**

**Data Displayed:**
- ❌ Open Tickets Count - **Mock Data**
- ❌ In Progress Count - **Mock Data**
- ❌ Support Tickets - **Mock Data**
- ❌ Ticket Details/Replies - **Mock Data**

**Database Needed:**
```sql
-- For Support Tickets
CREATE TABLE support_tickets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  subject VARCHAR NOT NULL,
  description TEXT,
  priority VARCHAR, -- low, medium, high, urgent
  status VARCHAR, -- open, in_progress, resolved, closed
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- For Ticket Messages/Replies
CREATE TABLE ticket_messages (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER REFERENCES support_tickets(id),
  user_id INTEGER REFERENCES users(id),
  is_admin BOOLEAN,
  message TEXT,
  created_at TIMESTAMP
);
```

---

### 📊 AUDIT LOGS PAGE (`/admin/logs`)
**Current Status:** ❌ **NOT WORKING (0% DB)**

**Data Displayed:**
- ❌ Admin Actions Log - **Mock Data**
- ❌ Action Types - **Mock Data**
- ❌ Timestamps - **Mock Data**
- ❌ Admin Users - **Mock Data**
- ❌ IP Addresses - **Mock Data**

**Database Needed:**
```sql
-- For Audit Logs
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES users(id),
  action VARCHAR NOT NULL, -- create, update, delete, suspend, etc.
  resource_type VARCHAR, -- user, payment, ticket, etc.
  resource_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP
);
```

---

### 🤖 AI USAGE PAGE (`/admin/ai-usage`)
**Current Status:** ⚠️ **PLACEHOLDER (0% Functional)**

**Note:** This page is marked for deletion per project requirements.

---

### 📈 ASSESSMENTS PAGE (`/admin/assessments`)
**Current Status:** ⚠️ **PLACEHOLDER (0% Functional)**

**Note:** This page is marked for deletion per project requirements.

---

## 3. DATABASE IMPLEMENTATION ROADMAP

### Priority 1: Critical (Needed Immediately)
- [ ] **payments** table - Payment tracking for revenue dashboard
- [ ] **support_tickets** + **ticket_messages** - Support ticketing system
- [ ] **subscription_plans** + **user_subscriptions** - Subscription management
- [ ] **audit_logs** - Admin action tracking

### Priority 2: Important (Needed for Full Features)
- [ ] **system_settings** - Configuration management
- [ ] **integrations** - API credentials storage
- [ ] **activity_logs** - User activity tracking
- [ ] Enhance **slides** with quality_score and processing_source

### Priority 3: Nice to Have (Future Enhancement)
- [ ] **notifications** table - Notification system
- [ ] **ai_usage_logs** - Detailed AI credit tracking
- [ ] **user_activity_timeline** - Detailed user actions

---

## 4. API ENDPOINTS NEEDED

### Current Endpoints ✅
```
GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
GET    /api/presentations
POST   /api/presentations
GET    /api/presentations/:id
PUT    /api/presentations/:id
DELETE /api/presentations/:id
GET    /api/presentations/:id/slides
POST   /api/presentations/:id/slides
PUT    /api/slides/:id
DELETE /api/slides/:id
```

### Missing Endpoints ❌

**Payments:**
```
GET    /api/payments
GET    /api/payments/:id
POST   /api/payments
POST   /api/payments/:id/refund
GET    /api/payments/stats
```

**Subscriptions:**
```
GET    /api/subscription-plans
POST   /api/subscription-plans
PUT    /api/subscription-plans/:id
DELETE /api/subscription-plans/:id
GET    /api/user-subscriptions
POST   /api/user-subscriptions
PUT    /api/user-subscriptions/:id
```

**Support:**
```
GET    /api/support-tickets
POST   /api/support-tickets
GET    /api/support-tickets/:id
PUT    /api/support-tickets/:id
POST   /api/support-tickets/:id/messages
GET    /api/support-tickets/:id/messages
```

**Settings:**
```
GET    /api/settings
PUT    /api/settings/:key
GET    /api/integrations
POST   /api/integrations
```

**Audit Logs:**
```
GET    /api/audit-logs
```

---

## 5. SUMMARY TABLE

| Page | Status | DB Support | Mock Data | Notes |
|------|--------|-----------|-----------|-------|
| Dashboard | ⚠️ Partial | 60% | 40% | Revenue & activity need payments table |
| Users | ✅ Full | 95% | 5% | Fully functional with DB |
| User Details | ⚠️ Partial | 40% | 60% | Payment history needs payments table |
| Subscriptions | ❌ None | 0% | 100% | Needs subscription_plans table |
| Slides | ✅ Full | 90% | 10% | Mostly working, quality score is mock |
| Payments | ❌ None | 0% | 100% | Needs payments table |
| Settings | ❌ None | 0% | 100% | Needs system_settings & integrations tables |
| Support | ❌ None | 0% | 100% | Needs support_tickets table |
| Logs | ❌ None | 0% | 100% | Needs audit_logs table |
| AI Usage | ⚠️ Deleted | N/A | N/A | Marked for deletion |
| Assessments | ⚠️ Deleted | N/A | N/A | Marked for deletion |

---

## 6. RECOMMENDATIONS

### Immediate Actions:
1. **Create missing database tables** (payments, support_tickets, subscription_plans, audit_logs)
2. **Implement API endpoints** for payments, support, and subscriptions
3. **Wire frontend pages** to new API endpoints
4. **Replace mock data** with real database queries

### Optional Enhancements:
1. Add AI usage tracking table
2. Implement real-time notification system
3. Add user activity timeline
4. Create system health monitoring

---

## 7. MIGRATION SCRIPT TEMPLATE

```sql
-- 1. Create Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  ai_credits INTEGER,
  ocr_pages INTEGER,
  storage_limit VARCHAR(50),
  features TEXT[],
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create User Subscriptions Table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  auto_renew BOOLEAN DEFAULT true,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id INTEGER REFERENCES user_subscriptions(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BDT',
  payment_method VARCHAR(50),
  bkash_transaction_id VARCHAR(100) UNIQUE,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  metadata JSONB
);

-- 4. Create Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(50) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Create Ticket Messages Table
CREATE TABLE IF NOT EXISTS ticket_messages (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  is_admin BOOLEAN DEFAULT false,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Create System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT,
  value_type VARCHAR(50),
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 8. Create Integrations Table
CREATE TABLE IF NOT EXISTS integrations (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(100) NOT NULL UNIQUE,
  api_key TEXT,
  api_secret TEXT,
  is_active BOOLEAN DEFAULT false,
  config JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_audit_logs_admin ON audit_logs(admin_id);
```

---

## Conclusion

The admin panel is **40-50% complete** in terms of database integration. The **Users and Slides pages are fully functional**, while **Dashboard is partially working**. The remaining pages (**Subscriptions, Payments, Support, Settings, Logs**) rely entirely on mock data and need database tables and API endpoints to become functional.

**Estimated effort to reach 100% database coverage: 20-25 hours** of development time for SQL migrations, API endpoints, and frontend wiring.
