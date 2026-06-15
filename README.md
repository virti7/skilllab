# SkillLab

A full-stack skill assessment platform for educational institutes. Features AI-powered test generation, coding labs, practice sheets, and comprehensive analytics.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + shadcn/ui + Tailwind CSS
- **Backend**: Node.js + Express 5 + Prisma ORM
- **Database**: PostgreSQL
- **AI**: Groq (Llama 3.3 70B)
- **Code Execution**: Local compiler service (supports C, C++, Java, Python)

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- npm or bun

### Environment Setup

1. Clone the repository
2. Copy environment files:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
3. Configure your `.env` files with your own values
4. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
5. Push database schema:
   ```bash
   cd backend && npm run db:push
   ```
6. Start development servers:
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev

   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

## Deployment

### Backend (Render)

1. Create a new Web Service on Render connected to your repo
2. **Root Directory**: `backend`
3. **Build Command**: `npm install && npx prisma generate`
4. **Start Command**: `node src/index.js`
5. Add all environment variables from `backend/.env.example`

### Frontend (Vercel)

1. Import your repo on Vercel
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. Add environment variable: `VITE_API_URL` = your Render backend URL

## Architecture

### Backend Structure

```
backend/
├── src/
│   ├── controllers/     # Route handlers
│   ├── middleware/       # Auth, validation, rate limiting, error handling
│   ├── routes/          # Express route definitions
│   ├── services/        # Business logic (Groq AI, compiler, Judge0)
│   └── utils/           # Prisma client, logger, response helpers
├── prisma/
│   └── schema.prisma    # Database schema
└── package.json
```

### Frontend Structure

```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React contexts (Auth)
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # API client, utilities
│   ├── pages/           # Page components by role
│   └── data/            # Static data
├── public/
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh-token` - Refresh JWT token
- `GET /api/auth/me` - Get current user

### Batches
- `POST /api/batch/create` - Create batch (admin)
- `POST /api/batch/join` - Join batch with invite code
- `GET /api/batch/get` - List batches
- `GET /api/batch/:id/students` - Get batch students
- `DELETE /api/batch/:batchId` - Delete batch

### Tests
- `POST /api/test/create` - Create test with questions (admin)
- `GET /api/test/get` - List tests
- `GET /api/test/:testId` - Get test with questions
- `POST /api/test/submit` - Submit test answers

### Coding
- `POST /api/coding/run` - Run code
- `POST /api/coding/submit` - Submit code for evaluation
- Full CRUD for coding questions and tests

### Health
- `GET /health` - Basic health check
- `GET /api/health` - Health check with database status

## Security

- JWT-based authentication with refresh token rotation
- Password hashing with bcrypt (12 rounds)
- Rate limiting on all API routes
- Helmet security headers
- CORS configured for specific origins
- Input validation with Zod schemas
- Role-based access control (Super Admin, Admin, Student)
- Request sanitization
- No secrets exposed to frontend

## Environment Variables

### Backend
| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 5000) |
| `NODE_ENV` | Environment | No |
| `DATABASE_URL` | PostgreSQL connection | Yes |
| `DIRECT_URL` | Direct DB connection | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `JWT_REFRESH_SECRET` | Refresh token secret | Yes |
| `JWT_EXPIRES_IN` | Access token expiry | No (default: 15m) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | No (default: 7d) |
| `CORS_ORIGIN` | Allowed origins | No |
| `GROQ_API_KEY` | Groq AI API key | For AI features |

### Frontend
| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | Yes |
| `VITE_APP_NAME` | Application name | No |

## License

ISC
