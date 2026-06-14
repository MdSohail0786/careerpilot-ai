# CareerPilot AI — Interview Coach

An AI-powered mock interview platform. Practice technical interviews, get instant GPT feedback, and track improvement over time.

## Quick Start

### Prerequisites
- Node.js 18+, MongoDB, OpenAI API key

### Backend
```bash
cd backend
npm install
cp .env.example .env   # Fill in MONGODB_URI, JWT_SECRET, OPENAI_API_KEY
npm run dev            # Starts on port 5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev            # Starts on port 5173 (proxies /api to :5000)
```

Open http://localhost:5173

## Features
- 4 interview roles: Frontend, React, MERN Stack, Node.js Developer
- AI-generated questions (no repeats per session)
- Per-answer scoring: technical, grammar, confidence
- Contextual follow-up questions every 3rd answer
- Voice input via Web Speech API
- Performance reports with Line, Bar, and Radar charts
- JWT auth with bcrypt password hashing
- Full interview history stored in MongoDB

## Tech Stack
- Frontend: React 18 + Vite, React Router v6, React Hook Form, Axios, Chart.js, Tailwind CSS
- Backend: Node.js, Express.js, Mongoose, JWT, bcryptjs
- AI: OpenAI GPT-3.5-turbo (swap model string for GPT-4o anytime)

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | No | Create account |
| POST | /api/auth/login | No | Login, get JWT |
| GET | /api/auth/me | Yes | Current user |
| POST | /api/interview/start | Yes | Start session |
| POST | /api/interview/answer | Yes | Submit + evaluate answer |
| POST | /api/interview/next | Yes | Next question or finish |
| POST | /api/report/generate | Yes | Generate final report |
| GET | /api/report/history | Yes | All user reports |
| GET | /api/report/:id | Yes | Single report |
| PUT | /api/user/profile | Yes | Update name/email |
| PUT | /api/user/password | Yes | Change password |

## Environment Variables (backend/.env)

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/careerpilot
JWT_SECRET=<long random string>
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=sk-...
CLIENT_URL=http://localhost:5173
```

## Production Deployment

### Railway / Render (recommended)
1. Push to GitHub
2. Connect repo to Railway or Render
3. Backend: root dir = backend, start = `node server.js`
4. Frontend: root dir = frontend, build = `npm run build`, publish = `dist`
5. Set all env vars in dashboard

### VPS with Nginx
- Use PM2 to manage the Node process
- Build frontend with `npm run build`
- Serve `frontend/dist` as static files
- Proxy `/api/*` to `localhost:5000` in Nginx config

## Customisation
- Change question count: `TOTAL_QUESTIONS` in `backend/controllers/interview.controller.js`
- Add roles: update `VALID_ROLES` in controller + add card in `InterviewCard.jsx`
- Upgrade to GPT-4: change model string in `backend/services/openai.service.js`
