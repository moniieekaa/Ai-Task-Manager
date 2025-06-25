# 🔧 Task Manager with Google Gemini AI - Complete Setup Guide

A full-stack task management application with AI-powered task generation using Google Gemini API.

## 🚀 Quick Start (Ready to Run)

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL database (Neon.tech recommended)
- Google AI API key
- Clerk account

### 1. Clone and Setup Backend

\`\`\`bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your actual values:
# DATABASE_URL=your_neon_database_url
# JWT_SECRET=your-super-secret-jwt-key
# GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key
# PORT=5000

# Generate and push database schema
npm run db:generate
npm run db:push

# Start backend server
npm run dev
\`\`\`

Backend will run on: http://localhost:5000
API Documentation: http://localhost:5000/docs

### 2. Setup Frontend

\`\`\`bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Edit .env.local with your values:
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key
# CLERK_SECRET_KEY=sk_test_your_key
# NEXT_PUBLIC_API_URL=http://localhost:5000

# Start frontend
npm run dev
\`\`\`

Frontend will run on: http://localhost:3000

## 🔧 Environment Variables Setup

### Backend (.env)
\`\`\`env
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key-change-in-production
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key
PORT=5000
\`\`\`

### Frontend (.env.local)
\`\`\`env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
\`\`\`

## 🗄️ Database Setup (Neon.tech)

1. Go to [neon.tech](https://neon.tech) and create account
2. Create new database project
3. Copy connection string to `DATABASE_URL`
4. Run migrations: `npm run db:push`

## 🔐 Authentication Setup (Clerk)

1. Go to [clerk.dev](https://clerk.dev) and create account
2. Create new application
3. Copy publishable and secret keys
4. Add to environment variables

## 🤖 Google AI Setup

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Create API key
3. Add to `GOOGLE_GENERATIVE_AI_API_KEY`

## 🐳 Docker Setup (Optional)

\`\`\`bash
cd backend
docker-compose up -d
\`\`\`

## 📋 Features Implemented

✅ **Full CRUD Operations**
- Create, Read, Update, Delete tasks
- Bulk task creation

✅ **AI Task Generation**
- Google Gemini integration
- Topic-based task generation

✅ **Authentication**
- Clerk authentication
- JWT token management
- Protected routes

✅ **Database**
- PostgreSQL with Drizzle ORM
- Proper schema design
- Migrations support

✅ **API Documentation**
- OpenAPI/Swagger documentation
- Interactive API explorer

✅ **Modern UI**
- Next.js 14+ with App Router
- ShadCN UI components
- Responsive design
- Progress tracking

## 🚀 Deployment

### Backend (Render.com)
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set start command: `npm run start`
4. Add environment variables

### Frontend (Netlify)
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables

## 🔍 API Endpoints

- `GET /health` - Health check
- `POST /api/auth/sync` - Sync user with Clerk
- `GET /api/auth/me` - Get current user
- `GET /api/tasks` - Get user tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task
- `POST /api/tasks/bulk` - Create multiple tasks
- `POST /api/ai/generate-tasks` - Generate AI tasks
- `GET /docs` - API documentation

## 🛠️ Tech Stack

**Backend:**
- Hono.dev (Web framework)
- Drizzle ORM (Database)
- PostgreSQL (Database)
- JWT (Authentication)
- OpenAPI/Swagger (Documentation)
- Google Gemini AI

**Frontend:**
- Next.js 14+ (React framework)
- TypeScript
- Tailwind CSS + ShadCN UI
- Clerk (Authentication)

## 🔧 Troubleshooting

**Database Connection Error:**
- Check DATABASE_URL format
- Ensure database is accessible
- Run `npm run db:push`

**Authentication Issues:**
- Verify Clerk keys
- Check JWT_SECRET
- Ensure middleware is configured

**AI Generation Fails:**
- Verify Google AI API key
- Check API quota
- Review network connectivity

**CORS Errors:**
- Update CORS origins in backend
- Check frontend URL configuration

## 📞 Support

If you encounter issues:
1. Check environment variables
2. Verify all services are running
3. Check console for errors
4. Review API documentation at `/docs`

---

**Ready to run! Just follow the setup steps above.** 🎉
