# TaskFlow - Full-Stack Team Task Manager

TaskFlow is a premium collaborative project and task management dashboard. It features role-based access control (RBAC), a sleek glassmorphic dark theme, real-time-like task status updates, project completion metrics, and automated task overdue tracking.

## 🚀 Live URL
*To be filled upon Railway deployment.*

---

## 🛠️ Tech Stack
- **Frontend**: React.js + Vite (custom CSS styling, zero Tailwind dependency)
- **Backend**: Node.js + Express.js (REST APIs)
- **Database**: MongoDB + Mongoose (structured collections and relationships)
- **Authentication**: JWT (Access + Refresh tokens with automated Axios retry interceptors)

---

## 📁 Project Structure
```text
Team_Task_Manager/
├── server/               # Express.js REST API Backend
│   ├── src/
│   │   ├── config/       # Database connection
│   │   ├── controllers/  # Route logic handlers (Auth, Projects, Tasks, Stats)
│   │   ├── middleware/   # JWT Protection & Admin guards
│   │   ├── models/       # MongoDB Mongoose schemas
│   │   └── routes/       # API endpoints
│   ├── seed.js           # Database mock-data populator
│   └── .env.example
└── client/               # React.js Vite Frontend
    ├── src/
    │   ├── components/   # Sidebar, badge controllers, toasts
    │   ├── context/      # Auth & Toast status providers
    │   ├── pages/        # Views (Dashboard, Projects, Tasks, Team)
    │   └── utils/        # Axios client interceptors
    └── index.html
```

---

## 🔑 Demo Credentials
The database comes seeded with two default test accounts:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@demo.com` | `Admin@123` |
| **Member** | `member@demo.com` | `Member@123` |

---

## 🛠️ Local Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- A MongoDB Atlas account or local MongoDB instance

### 1. Backend Server Setup
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
4. Update the `MONGODB_URI` inside `.env` with your MongoDB connection string.
5. Seed the database with demo users, projects, and tasks:
   ```bash
   npm run seed
   ```
6. Start the backend developer server:
   ```bash
   npm run dev
   ```
   *(Backend API will be running on `http://localhost:5000`)*

### 2. Frontend Client Setup
1. Open a new terminal and navigate to the client folder:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *(Vite server will run on `http://localhost:5173`)*

---

## 🔒 Environment Variables Reference

### Backend (`/server/.env`)
- `PORT`: Port number the backend server runs on (e.g. `5000`).
- `MONGODB_URI`: MongoDB connection string.
- `JWT_SECRET`: Secret key used for signing JWT Access tokens.
- `JWT_REFRESH_SECRET`: Secret key used for signing JWT Refresh tokens.
- `JWT_EXPIRE`: Access token lifetime (default `15m`).
- `JWT_REFRESH_EXPIRE`: Refresh token lifetime (default `7d`).
- `NODE_ENV`: Application environment (e.g. `development` or `production`).

### Frontend (`/client/.env`)
- `VITE_API_URL`: URL pointing to the live or local REST API gateway (defaults to `http://localhost:5000/api` if omitted).
