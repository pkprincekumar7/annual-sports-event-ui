# PCE Annual Sports - UMANG 2026

Annual Sports Events Registration Portal for Purnea College of Engineering, Purnea.

## Tech Stack

- **React 18** - UI Library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Express.js** - Backend server for API endpoints
- **Node.js** - Runtime environment

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the backend server (in one terminal):
```bash
npm run server
```
The server will run on `http://localhost:3001`

3. Start the frontend development server (in another terminal):
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

5. Preview production build:
```bash
npm run preview
```

## Project Structure

```
├── public/
│   ├── images/          # Static images
│   └── json_store/      # JSON data storage
│       └── players.json # Player data storage
├── src/
│   ├── components/      # React components
│   │   ├── Navbar.jsx
│   │   ├── Hero.jsx
│   │   ├── SportsSection.jsx
│   │   ├── RegisterModal.jsx
│   │   ├── LoginModal.jsx
│   │   ├── AddCaptainModal.jsx
│   │   ├── RemoveCaptainModal.jsx
│   │   ├── TeamDetailsModal.jsx
│   │   ├── ParticipantDetailsModal.jsx
│   │   ├── PlayerListModal.jsx
│   │   ├── AboutSection.jsx
│   │   ├── Footer.jsx
│   │   └── StatusPopup.jsx
│   ├── App.jsx         # Main app component
│   ├── main.jsx        # Entry point
│   └── index.css       # Global styles with Tailwind
├── server.js           # Express.js backend server
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── SERVER_README.md    # Backend API documentation
```

## Features

- ✅ Responsive design
- ✅ Countdown timers for event and registration
- ✅ Dynamic registration form (team/individual events)
- ✅ Player login and authentication
- ✅ Admin panel with player management
- ✅ Captain assignment and team management
- ✅ Team and individual event registration
- ✅ Participation tracking and limits
- ✅ Status popups for success/error messages
- ✅ All original styling preserved with Tailwind CSS

## Backend API

The application includes a backend server (`server.js`) that provides RESTful API endpoints for:
- Player registration and authentication
- Captain management
- Team and individual event participation
- Player data management

For detailed API documentation, see [SERVER_README.md](./SERVER_README.md)

## Data Storage

- Player data is stored in `public/json_store/players.json`
- The JSON file is automatically created if it doesn't exist
- All player information, participations, and captain assignments are stored locally

## Notes

- Images are stored in `public/images/` directory
- Player data is stored locally in `public/json_store/players.json`
- The backend server must be running for full functionality
- Admin user credentials: Registration Number: `admin`
