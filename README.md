# PCE Annual Sports - UMANG 2026

Annual Sports Events Registration Portal for Purnea College of Engineering, Purnea.

A React-based frontend application for managing annual sports event registrations.

## Tech Stack

- **React 18** - UI Library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **JWT Authentication** - Token-based authentication

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd annual-sports-event-ui
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:3001
```

   For production, set `VITE_API_URL` to your API server URL:
   ```env
   VITE_API_URL=https://your-api-server.com
   ```

4. Start the development server:
```bash
npm run dev
```

   The application will run on `http://localhost:5173` (Vite default port)

5. Build for production:
```bash
npm run build
```

6. Preview production build:
```bash
npm run preview
```

## Environment Variables

The application uses environment variables for configuration:

- `VITE_API_URL` - API server URL (default: `http://localhost:3001`)

Create a `.env` file in the root directory to set these values. For production builds, set these variables in your hosting platform's environment settings.

**Note:** Environment variables must start with `VITE_` to be accessible in the frontend code.

## Project Structure

```
├── public/
│   └── images/          # Static images
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
│   ├── config/
│   │   └── api.js       # API configuration
│   ├── utils/
│   │   └── api.js       # API utility functions (fetchWithAuth, decodeJWT)
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles with Tailwind
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── .env                 # Environment variables (create this)
```

## Features

- ✅ Responsive design
- ✅ Countdown timer for event start (shows "Registration closed!" when timer reaches zero)
- ✅ Dynamic registration form (team/individual events)
- ✅ Player login and JWT authentication
- ✅ Admin panel with player management
- ✅ Captain assignment and team management
- ✅ Team and individual event registration
- ✅ Participation tracking and limits
- ✅ Status popups for success/error messages
- ✅ Loading states for all API operations
- ✅ Form validation with proper error handling
- ✅ User data fetched from server (not stored in localStorage)
- ✅ All original styling preserved with Tailwind CSS

## API Integration

The frontend communicates with an external API server. All API calls are configured through:

- **Configuration file:** `src/config/api.js`
- **Environment variable:** `VITE_API_URL` (defaults to `http://localhost:3001`)
- **Utility functions:** `src/utils/api.js`

### API Calls

All API calls use relative paths (e.g., `/api/login`) which are automatically prepended with the configured API URL from `VITE_API_URL`.

Example API endpoints used:
- `/api/login` - User authentication
- `/api/players` - Get all players
- `/api/save-player` - Register new player
- `/api/update-participation` - Update individual participation
- `/api/update-team-participation` - Update team participation
- `/api/add-captain` - Assign captain role
- `/api/remove-captain` - Remove captain role
- `/api/teams/:sport` - Get teams for a sport
- `/api/participants/:sport` - Get participants for a sport
- `/api/export-excel` - Export data to Excel

### Authentication

- Uses JWT (JSON Web Tokens) for authentication
- Token is stored in `localStorage` as `authToken`
- User data is fetched from the server on app mount and after login (not stored in localStorage)
- Token is automatically included in all authenticated API requests via `fetchWithAuth` utility
- On token expiration (401/403), user is automatically logged out and redirected

### API Utility Functions

The application uses utility functions in `src/utils/api.js`:

- `fetchWithAuth(url, options)` - Makes authenticated API calls with automatic token inclusion
- `decodeJWT(token)` - Decodes JWT token on client side (for display purposes only)

## Development

### Running Locally

1. Set `VITE_API_URL` in `.env` file (defaults to `http://localhost:3001` if not set)
2. Run `npm run dev`
3. Open `http://localhost:5173` in your browser

### Building for Production

1. Set `VITE_API_URL` to your production API server URL in `.env` or hosting platform settings
2. Run `npm run build`
3. The `dist/` folder contains the production build
4. Deploy the `dist/` folder to your hosting platform (Vercel, Netlify, etc.)

## Component Overview

### Main Components

- **App.jsx** - Main application component, handles routing, authentication state, and user data management
- **Hero.jsx** - Hero section with event countdown timer and welcome message
- **SportsSection.jsx** - Displays available sports and handles sport selection
- **Navbar.jsx** - Navigation bar with login/logout functionality

### Modal Components

- **RegisterModal.jsx** - Handles player registration and event participation (team/individual)
- **LoginModal.jsx** - User login form
- **AddCaptainModal.jsx** - Admin interface for assigning captain roles
- **RemoveCaptainModal.jsx** - Admin interface for removing captain roles
- **TeamDetailsModal.jsx** - Displays team details and allows team management
- **ParticipantDetailsModal.jsx** - Displays individual participant details
- **PlayerListModal.jsx** - Admin interface for viewing and editing all players

### Utility Components

- **StatusPopup.jsx** - Displays success/error messages
- **AboutSection.jsx** - About section content
- **Footer.jsx** - Footer content

## State Management

The application uses React hooks for state management:

- **Local State** - `useState` for component-level state
- **Effects** - `useEffect` for side effects (API calls, timers)
- **Authentication** - JWT token stored in `localStorage`, user data in component state
- **User Data** - Fetched from server on mount and after updates, not persisted in localStorage

## Notes

- Images are stored in `public/images/` directory
- Admin user credentials: Registration Number: `admin`
- All API calls are made through `src/utils/api.js` utility functions
- The application uses relative API paths that are automatically resolved using the configured base URL
- Form submissions show loading states only during actual API calls, not during client-side validation
- Error handling ensures buttons are re-enabled after API errors so users can retry

## License

[Add your license information here]
