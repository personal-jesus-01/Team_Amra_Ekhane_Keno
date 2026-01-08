# 🎯 SlideBanai - AI-Powered Presentation Platform

**An intelligent presentation creation and speech coaching platform that democratizes professional presentation skills through AI.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB.svg)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-blue.svg)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E.svg)](https://supabase.com)

---

## 📊 Product Overview

### What is SlideBanai?

SlideBanai is a comprehensive AI-powered platform that combines **automated presentation generation** with **intelligent speech coaching**. It addresses two major pain points:

1. **Time-consuming presentation creation** - Hours spent designing slides from scratch
2. **Lack of accessible presentation coaching** - Professional coaching is expensive and time-limited

### Key Value Propositions

- **10x Faster Presentation Creation**: Generate professional presentations in seconds, not hours
- **Accessible Speech Coaching**: AI coach available 24/7 with realistic feedback
- **Multi-Language Support**: English, Bengali, and Banglish (Bengali in English script)
- **Direct Google Slides Integration**: Presentations instantly available in your Google Drive
- **Authentic Performance Metrics**: Realistic scoring (not inflated) builds genuine skill improvement

---

## 🎯 Theme Alignment

**Theme: AI-Powered Education & Productivity Tools**
**We Chose**
**Wonder 4 -> Agentic AI -> The whole presentation making system, TTS, Video Decoding**
**Wonder 6 -> Generative AI -> Generating Presentation Content, Speech**
**Wonder 10 -> Adaptive Learning -> Guided Learning for Users**


### How We Align:

1. **Education**: Provides coaching and skill development for presentation skills
2. **Productivity**: Automates tedious slide creation, saving hours of work
3. **AI Integration**: Uses OpenAI GPT-4o for content generation and Whisper for transcription
4. **Accessibility**: Democratizes access to professional presentation tools
5. **Real-World Impact**: Directly addresses needs of students, educators, and professionals

### Target Impact:

- **Students**: Prepare better for presentations, improve public speaking
- **Educators**: Create course materials faster, focus on teaching
- **Professionals**: Deliver more impactful presentations, advance careers
- **Non-Native Speakers**: Build confidence with multi-language support

---

## ✨ Features

### 🤖 AI Presentation Generation

- **From Text Prompt**: Describe your topic, AI generates complete presentation
- **From Documents**: Upload PDF/DOCX/PPTX/Images, AI extracts content and creates slides
- **Smart Outline Generation**: AI analyzes content and suggests optimal structure
- **Google Slides Integration**: Instant export to Google Slides with edit permissions
- **Template Library**: 4+ professional templates (Business, Creative, Academic, Tech)
- **Customizable Parameters**:
  - Number of slides (3-30)
  - Audience type (General, Corporate, Students, Technical, Creative)
  - Presentation tone (Professional, Casual, Persuasive, Educational, Inspirational)

### 🎤 AI Speech Coach

- **Self-Practice Mode**: Record practice sessions with video/audio
- **Real-Time Transcription**: Web Speech API + OpenAI Whisper fallback
- **Comprehensive Performance Analysis**:
  - **Content Coverage**: Keyword matching algorithm (15-60% realistic range)
  - **Fluency Score**: Filler word detection and language analysis (25-55%)
  - **Confidence Score**: Length and hesitation markers (10-35%)
  - **Overall Performance**: Composite score with improvement tracking
- **Detailed Feedback**: AI-generated specific suggestions
- **Speech Script Generation**: AI creates suggested speech for your slides
- **Speech Comparison**: Compare actual vs suggested performance
- **Multi-Language**: English, Bengali, Banglish with cultural context
- **Session History**: Track improvement over time

### 👥 Collaboration

- **Real-Time Sharing**: Share presentations with view/edit permissions
- **Role Management**: Owner, Editor, Viewer roles
- **Email Invitations**: Automatically notify collaborators
- **Access Control**: Row-level security ensures data privacy

### # Adaptive Learning System - Agentic AI Implementation

## Overview

SlideBanai now features an **Adaptive Learning System** powered by an autonomous AI agent that personalizes the coaching experience based on each user's performance, learning patterns, and skill progression.

## 🤖 How the AI Agent Works

The adaptive learning agent operates autonomously through the following workflow:

### 1. **Continuous Assessment**
- Analyzes every practice session in real-time
- Tracks 6 core skills: Content Coverage, Fluency, Clarity, Confidence, Pace, Pronunciation
- Records performance scores in the database
- Calculates learning velocity (rate of improvement)

### 2. **Intelligent Decision Making**
- Uses GPT-4o to analyze user performance patterns
- Determines optimal difficulty level (0-100 scale)
- Selects appropriate feedback strategy:
  - **Encouraging**: For beginners (scores < 50%)
  - **Balanced**: For intermediate learners (50-70%)
  - **Constructive**: For advanced users (70-85%)
  - **Challenging**: For experts (85%+)

### 3. **Dynamic Difficulty Adjustment**
The agent automatically adjusts difficulty based on performance:
- **Increase**: If user scores consistently 80%+ (task too easy)
- **Maintain**: If user scores 45-75% (optimal challenge)
- **Decrease**: If user scores <45% (task too hard)

### 4. **Personalized Exercise Generation**
- AI generates custom practice exercises targeting weak skills
- Exercises adapt to user level and difficulty preference
- Types: Breathing, Pacing, Articulation, Content Structuring

### 5. **Progress Tracking**
- Identifies strong and weak areas
- Tracks skill progression trends (improving/stable/declining)
- Records milestones and achievements
- Monitors practice streaks

### 📊 Analytics

- **User Dashboard**: Track presentations created, sessions practiced
- **Performance Trends**: Visualize improvement over time
- **Presentation Metrics**: View engagement and practice frequency

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  CLIENT LAYER (React)                    │
│  Components • Services • Hooks • State Management        │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/REST + WebSocket
┌────────────────────▼────────────────────────────────────┐
│              APPLICATION LAYER (FastAPI)                 │
│  Controllers → Services → Repositories                   │
│  Design Patterns: Repository, Service, DTO, Factory     │
│  Strategy, Adapter, Observer                            │
└────────────────────┬────────────────────────────────────┘
                     │ Supabase Client
┌────────────────────▼────────────────────────────────────┐
│               DATA LAYER (Supabase)                      │
│  PostgreSQL • RLS Policies • Storage • Auth             │
└─────────────────────────────────────────────────────────┘

External Services: OpenAI GPT-4o • Whisper • Google Slides
```

### Three-Tier MVC Architecture

1. **Presentation Layer**: React frontend with TanStack Query, Radix UI
2. **Application Layer**: FastAPI backend with clean architecture
3. **Data Layer**: Supabase PostgreSQL with RLS policies

---

## 📁 Folder Structure

```
SlideBanai/
├── apps/
│   ├── backend/          # FastAPI application
│   │   ├── adapters/     # External service integrations
│   │   ├── controllers/  # Request handlers
│   │   ├── services/     # Business logic
│   │   ├── repositories/ # Data access
│   │   ├── dtos/         # API contracts
│   │   ├── strategies/   # Algorithm implementations
│   │   ├── factories/    # Object creation
│   │   ├── observers/    # Event handling
│   │   └── main.py       # App entry point
│   └── frontend/         # React application
│       ├── src/
│       │   ├── components/  # UI components
│       │   ├── pages/       # Page components
│       │   ├── services/    # API clients
│       │   ├── config/      # Theme & API config
│       │   └── hooks/       # Custom hooks
├── docs/
│   ├── api/              # API documentation
│   ├── db/               # Database schema
│   └── guides/           # Setup guides
└── scripts/              # Dev/deploy scripts
```

---

## 🎨 Design Patterns Used

### 1. Repository Pattern
**Where**: `apps/backend/repositories/`
**Why**: Abstracts database access, makes testing easier, allows swapping database implementations
**Example**: `PresentationRepository`, `UserRepository`

### 2. Service Layer Pattern
**Where**: `apps/backend/services/`
**Why**: Encapsulates business logic, orchestrates workflows, reusable across controllers
**Example**: `PresentationService.create_from_prompt()` orchestrates AI generation → Google Slides → DB storage

### 3. DTO Pattern
**Where**: `apps/backend/dtos/`
**Why**: Strict API contracts, automatic validation, self-documenting
**Example**: `CreatePresentationFromPromptDTO` validates all inputs before processing

### 4. Factory Pattern
**Where**: `apps/backend/factories/`
**Why**: Centralizes complex object creation, handles configuration
**Example**: `SupabaseClientFactory` manages authenticated client creation

### 5. Strategy Pattern
**Where**: `apps/backend/strategies/`
**Why**: Interchangeable algorithms, easy to add new scoring methods
**Example**: `ContentRelevancyStrategy`, `FluencyStrategy`, `ConfidenceStrategy`

### 6. Adapter Pattern
**Where**: `apps/backend/adapters/`
**Why**: Wraps third-party APIs with retry logic and error handling
**Example**: `OpenAIAdapter`, `GoogleSlidesAdapter`

### 7. Observer Pattern
**Where**: `apps/backend/observers/`
**Why**: Decouples event publishers from subscribers, extensible
**Example**: `EventPublisher` triggers email notifications on presentation creation

---

## ER DIGRAM

https://www.mermaidchart.com/d/c1d3aa84-7ade-465d-941a-98a19bd847dd

## 🔧 Engineering Standards

### SOLID Principles Implementation

#### Single Responsibility Principle (SRP)
- Each service handles ONE domain (e.g., `PresentationService` only manages presentations)
- Each repository manages ONE table
- Functions are <50 lines, do ONE thing

#### Open/Closed Principle (OCP)
- Strategy pattern allows adding new scoring algorithms without modifying existing code
- Factory pattern allows adding new client types
- Adapter pattern allows swapping external services

#### Liskov Substitution Principle (LSP)
- All repositories implement `BaseRepository` interface
- All strategies implement their base strategy interface
- Polymorphic dependency injection throughout

#### Interface Segregation Principle (ISP)
- Small, focused interfaces (e.g., `ReadOnlyRepository`, `WriteRepository`)
- No "god interfaces" with unused methods

#### Dependency Inversion Principle (DIP)
- Controllers depend on service interfaces, not concrete implementations
- Services depend on repository interfaces
- Dependency injection enables testing with mocks

### Code Quality Standards

- **Python**: snake_case functions, PascalCase classes, UPPER_SNAKE_CASE constants
- **TypeScript**: camelCase variables, PascalCase components/classes
- **Type Safety**: Type hints everywhere (Python), strict TypeScript
- **Documentation**: Docstrings explain WHY, not WHAT
- **Error Handling**: Global exception handlers, consistent error responses

---

## 🚀 Setup Instructions

### Prerequisites

- **Node.js** 20+ (for frontend)
- **Python** 3.11+ (for backend)
- **Supabase** account (free tier sufficient)
- **OpenAI** API key
- **Google Cloud** project with Slides API enabled

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/slidebanai.git
cd slidebanai
```

### 2. Backend Setup

```bash
cd apps/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your credentials (see Environment Variables section)

# Run backend
uvicorn main:app --reload --port 8000
```

Backend will be available at `http://localhost:8000`
API docs at `http://localhost:8000/api/v1/docs`

### 3. Frontend Setup

```bash
cd apps/frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your Supabase credentials

# Run frontend
npm run dev
```

Frontend will be available at `http://localhost:3000`

### 4. Supabase Setup

1. Create new project at [supabase.com](https://supabase.com)
2. Get your project URL and keys from Settings → API
3. Run database migrations:
   ```bash
   # Copy docs/db/schema.sql content
   # Paste into Supabase SQL Editor
   # Execute to create tables, RLS policies, functions
   ```
4. Enable Google OAuth:
   - Go to Authentication → Providers
   - Enable Google
   - Add OAuth credentials from Google Cloud Console
   - Set redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### 5. Google Cloud Setup (for Google Slides API)

1. Create project at [console.cloud.google.com](https://console.cloud.google.com)
2. Enable Google Slides API
3. Create Service Account:
   - IAM & Admin → Service Accounts → Create
   - Grant "Editor" role
   - Create key (JSON format)
   - Copy entire JSON content to `GOOGLE_SERVICE_ACCOUNT_KEY` env variable

### 6. OpenAI Setup

1. Get API key from [platform.openai.com](https://platform.openai.com)
2. Add to `.env`: `OPENAI_API_KEY=sk-your-key-here`
3. Ensure billing is set up (pay-as-you-go)

---

## 🔐 Environment Variables

### Backend (.env)

```bash
# Environment
ENVIRONMENT=development
DEBUG=true
PORT=8000

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI
OPENAI_API_KEY=sk-your-openai-key-here

# Google Service Account (JSON string)
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}

# Email
EMAIL_FROM=noreply@slidebanai.com
```

### Frontend (.env)

```bash
# API
VITE_API_URL=http://localhost:8000/api/v1

# Supabase (public keys only)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📚 API Documentation

### Interactive Documentation

- **Swagger UI**: `http://localhost:8000/api/v1/docs`
- **ReDoc**: `http://localhost:8000/api/v1/redoc`
- **OpenAPI JSON**: `http://localhost:8000/api/v1/openapi.json`

### Postman Collection

Import the Postman collection from `docs/api/postman/slidebanai-collection.json`

### Key Endpoints

| Category | Endpoint | Method | Description |
|----------|----------|--------|-------------|
| Auth | `/api/v1/auth/register` | POST | Register new user |
| Auth | `/api/v1/auth/login` | POST | Login |
| Presentations | `/api/v1/presentations/from-prompt` | POST | Create from prompt |
| Presentations | `/api/v1/presentations` | GET | List presentations |
| Coach | `/api/v1/coach/analyze` | POST | Analyze practice session |
| Coach | `/api/v1/coach/sessions` | GET | Get session history |

---

## 🗄️ Database Schema

### Core Tables

- **users**: User accounts and profiles
- **presentations**: Presentation metadata
- **slides**: Individual slide content
- **coach_sessions**: Speech coaching sessions
- **collaborators**: Presentation sharing
- **templates**: Presentation templates

### Security: Row Level Security (RLS)

All tables have RLS policies enforcing:
- Users can only view/edit their own data
- Collaborators can access shared presentations
- Templates are publicly readable

See `docs/db/rls_policies.md` for complete policy documentation.

### Entity Relationship Diagram

See `docs/db/erd.mmd` (Mermaid diagram, viewable in GitHub)

---

## 🔒 Security Considerations

### Authentication
- Supabase Auth with JWT tokens
- Google OAuth integration
- Access tokens expire after 1 hour
- Refresh tokens valid for 30 days

### Authorization
- Row Level Security (RLS) on all user data
- Service role key NEVER exposed to frontend
- API validates user permissions on every request

### Data Protection
- HTTPS in production
- Environment variables for secrets
- Input validation with Pydantic
- SQL injection prevention via Supabase client

### CORS
- Configured for specific origins only
- Credentials included for authenticated requests

---

## 📈 Scalability & Performance

### Current Capacity
- **Users**: 1,000 concurrent users
- **Database**: 10GB storage (expandable)
- **API**: 100 requests/minute per user

### Optimization Strategies
- **Database**:
  - Indexes on foreign keys and frequently queried columns
  - Pagination (default 20 items per page)
  - Query optimization (avoid N+1 queries)
- **API**:
  - Response caching (Redis can be added)
  - Gzip compression
  - Rate limiting
- **Frontend**:
  - Code splitting with Vite
  - Lazy loading components
  - Image optimization
  - TanStack Query for caching

### Horizontal Scaling
- Backend: Deploy multiple FastAPI instances behind load balancer
- Database: Supabase handles scaling automatically
- Frontend: Deploy to CDN (Vercel, Netlify)

---

## 🔮 Future Enhancements

### Short-Term (Q2 2025)
- Enhanced Bengali/Banglish speech recognition
- Real-time pacing analysis during recording
- Emotion recognition from voice tone
- Pronunciation scoring with phonetic analysis
- Industry-specific templates (medical, legal, academic)

### Medium-Term (Q3-Q4 2025)
- WebSocket-based real-time collaboration
- Team performance analytics
- Custom report generation with PDF export
- Microsoft Teams integration
- Salesforce CRM integration
- LMS integration for educational institutions

### Long-Term (2026+)
- AI-powered live coaching during presentations
- Multi-modal content generation (video + audio + slides)
- Enterprise SSO support
- Mobile native apps (iOS/Android)
- Progressive Web App with offline capabilities
- Microservices architecture migration

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **OpenAI** for GPT-4o and Whisper API
- **Supabase** for database, auth, and storage
- **Google** for Slides API
- **Radix UI** for accessible UI components
- **Shadcn/ui** for beautiful component designs

---

## 📞 Support

- **Email**: support@slidebanai.com
- **Documentation**: https://docs.slidebanai.com
- **Issues**: https://github.com/yourusername/slidebanai/issues

---

## 🎯 Demo

**Live Demo**: https://slidebanai.vercel.app
**Demo Video**: https://youtube.com/watch?v=demo-video
**Presentation**: [View Pitch Deck](docs/pitch-deck.pdf)

---

**Built with ❤️ for the AI & Education Hackathon 2025**
