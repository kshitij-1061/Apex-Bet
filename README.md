🎯 Apex Bet

A modern, responsive sports betting website prototype designed with a sleek user interface, smooth navigation, and an engaging user experience.

📌 Overview

Apex Bet is a full-stack betting platform prototype that demonstrates modern web development practices through a responsive design, intuitive user interface, and scalable architecture. The project focuses on delivering a seamless experience across desktop and mobile devices while showcasing clean code organization and user-centric design.

**Disclaimer: This project is intended for educational and portfolio purposes only. It is a UI/UX and web development demonstration and does not facilitate, promote, or support real-money gambling, betting, or financial transactions.**

✨ Features
🎨 Modern and responsive UI
🔐 User authentication interface
📱 Mobile-friendly design
⚡ Fast and optimized performance
🏆 Interactive betting-inspired dashboard
📊 Dynamic content rendering
🌙 Clean and intuitive user experience
🧩 Modular and maintainable codebase

🛠️ Tech Stack

🖥️ Backend Technologies
Mongoose: Object Data Modeling (ODM) layer for database interactions.
bcryptjs: Used to securely hash and salt user passwords.
jsonwebtoken (JWT): Handles stateless authorization sessions for endpoints.
cors: Cross-Origin Resource Sharing middleware linking frontend and backend.
dotenv: Manages environment variables (API ports, DB connections, and sim speeds).
Nodemon: Automatically monitors and restarts the Node process during development.

🎨 Frontend Technologies
Vite: Lightweight, high-speed build tool and dev server.
React Context API: Distributes global WebSocket client handlers across components.
Lucide React: Vector-based icons library (Trophy, Wallet, Bell, Trash, etc.).
CSS: Custom dark-theme design system implementing neon accents, layout grids, and visual alert keyframes.

⚡ Real-Time Pipeline
Socket.io (WebSockets): Handles the instant, bi-directional transmission of game times, score events, live odds shifts, and bet-settlement notification cards to active browser tabs.

Here is the clean file structure without any file links or absolute locations:

📂 Project Structure

betting-site/
├── backend/
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── Bet.js
│   │   ├── Match.js
│   │   ├── Transaction.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── bets.js
│   │   └── wallet.js
│   ├── services/
│   │   ├── betSettlement.js
│   │   └── matchSimulator.js
│   ├── .env
│   ├── package.json
│   └── server.js
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Auth.jsx
    │   │   ├── BetSlip.jsx
    │   │   ├── MatchList.jsx
    │   │   ├── Navbar.jsx
    │   │   └── UserDashboard.jsx
    │   ├── context/
    │   │   └── SocketContext.jsx
    │   ├── App.css
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── package.json
    └── vite.config.js
🚀 Getting Started

Clone the repository
git clone https://github.com/your-username/apex-bet.git

## Prerequisites
- Node.js installed
- MongoDB service running locally on port `27017`

## Quick Start
### 1. Run Backend Server
```bash
cd backend
npm install
npm run dev

### 2. Run Frontend Client
cd frontend
npm install
npm run dev

🎯 Future Enhancements

Live match data integration
Real-time odds updates
Wallet management
Admin dashboard
Analytics dashboard
