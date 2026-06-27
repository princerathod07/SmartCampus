# Full Stack Web Application

A full-stack web application built using modern web technologies with a separated frontend, backend, and database architecture.

---

## 🚀 Live Demo
- Frontend: Deployed on Vercel
- Backend API: Hosted on Render
- Database: Supabase

---

## 🧱 Tech Stack

### Frontend
- React / Next.js
- Vercel (deployment)
- REST API integration

### Backend
- Node.js / Express
- Render (backend hosting)
- RESTful API architecture

### Database
- Supabase (PostgreSQL)
- Row-level security (RLS)

---

## 📁 Project Structure
/frontend → Client-side application (Vercel)
/backend → Server-side API (Render)
/database → Supabase tables & schema (managed via Supabase dashboard)


---

## ⚙️ Features

- User authentication (if implemented)
- CRUD operations
- Real-time database integration (if enabled)
- Responsive UI
- Secure API handling
- Cloud deployment

---

## 🔧 Environment Variables

### Frontend (.env)
```

NEXT\_PUBLIC\_API\_URL="https://smartcampus-backend-eubv.onrender.com"

PORT=5000
SUPABASE_URL=https://*****
SUPABASE_SERVICE_ROLE_KEY=sb_sec****
GEMINI_API_KEY=AQ.Ab8RN6JlM_vJ-wN35lU******
```
### 🛠️ Installation & Setup
git clone https://github.com/princerathod07/SmartCampus
cd SmartCampus

cd frontend
npm install
npm run dev

cd backend
npm install
npm start

###🌐 Deployment
Frontend (Vercel)
  Connect GitHub repo to Vercel
  Add environment variables
  Deploy automatically on push
Backend (Render)
  Connect repository or backend folder
  Set build & start commands
  Add environment variables
Database (Supabase)
  Create project in Supabase
  Configure tables and relationships
  Enable authentication if required

👨‍💻 Author
Prince Rathod
