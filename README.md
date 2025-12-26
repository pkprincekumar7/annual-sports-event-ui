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

## Production Deployment

This section describes how to deploy the application on a Linux server using systemd for process management. The service will automatically start on boot and restart on failure.

### Prerequisites

- Ubuntu/Debian Linux server (or similar distribution)
- Root or sudo access
- Node.js and npm installed
- Git (for cloning the repository)

### Step 1: Install Node.js and npm

If Node.js is not already installed on your server, install it using the following commands:

```bash
# Update package list
sudo apt update

# Install Node.js (this will install both nodejs and npm)
sudo apt install nodejs npm -y

# Verify installation
node --version
npm --version
```

**Note:** The default Node.js version from Ubuntu repositories might be older. For Node.js v16 or higher, consider using NodeSource repository:

```bash
# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### Step 2: Clone and Setup the Project

1. Clone the repository to your desired location (e.g., `/var/www/annual-sports-event-ui`):

```bash
# Navigate to the directory where you want to install the application
cd /var/www

# Clone the repository (replace with your actual repository URL)
sudo git clone <repository-url> annual-sports-event-ui

# Change ownership to your user (replace 'ubuntu' with your username)
sudo chown -R ubuntu:ubuntu annual-sports-event-ui

# Navigate to the project directory
cd annual-sports-event-ui
```

2. Install project dependencies:

```bash
npm install
```

3. Create the `.env` file with production API URL:

```bash
# Create .env file
nano .env
```

Add the following content (replace with your actual API server URL):

```env
VITE_API_URL=https://your-api-server.com
```

Save and exit (Ctrl+X, then Y, then Enter).

4. Build the application for production:

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Step 3: Create systemd Service File

Create a systemd service file to manage the application as a system service:

```bash
sudo nano /etc/systemd/system/annual-sports-frontend.service
```

Add the following configuration (replace `/var/www/annual-sports-event-ui` with your actual project path and `ubuntu` with your username):

```ini
[Unit]
Description=Annual Sports Frontend - Vite Preview Server
After=network.target

[Service]
Type=simple
User=ubuntu
Group=ubuntu
WorkingDirectory=/var/www/annual-sports-event-ui
Environment=NODE_ENV=production
Environment=PORT=5173
ExecStart=/usr/bin/npm run preview
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=annual-sports-frontend

# Security settings
PrivateTmp=true
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

**Configuration Explanation:**
- `Description`: Human-readable description of the service
- `After=network.target`: Ensures the service starts after network is available
- `Type=simple`: Service runs in the foreground
- `User` and `Group`: User account that will run the service (replace with your username)
- `WorkingDirectory`: Full path to your project directory
- `Environment`: Sets environment variables (NODE_ENV=production, PORT=5173)
- `ExecStart`: Command to start the service (`npm run preview` serves the built `dist/` folder)
- `Restart=always`: Automatically restart the service if it crashes
- `RestartSec=10`: Wait 10 seconds before restarting
- `StandardOutput` and `StandardError`: Redirect logs to systemd journal
- `SyslogIdentifier`: Tag for log entries
- `PrivateTmp`: Use private /tmp directory for security
- `WantedBy=multi-user.target`: Start service at boot

Save and exit the file (Ctrl+X, then Y, then Enter).

### Step 4: Enable and Start the Service

1. Reload systemd to recognize the new service:

```bash
sudo systemctl daemon-reload
```

2. Enable the service to start automatically on boot:

```bash
sudo systemctl enable annual-sports-frontend
```

3. Start the service:

```bash
sudo systemctl start annual-sports-frontend
```

4. Check the service status:

```bash
sudo systemctl status annual-sports-frontend
```

You should see output indicating the service is active and running. The service will be accessible on `http://your-server-ip:5173` (or the configured port).

### Step 5: Managing the Service

#### Check Service Status

```bash
sudo systemctl status annual-sports-frontend
```

#### Stop the Service

```bash
sudo systemctl stop annual-sports-frontend
```

#### Start the Service

```bash
sudo systemctl start annual-sports-frontend
```

#### Restart the Service

```bash
sudo systemctl restart annual-sports-frontend
```

**Note:** Restart the service after making changes to the code or configuration:

1. Rebuild the application: `npm run build`
2. Restart the service: `sudo systemctl restart annual-sports-frontend`

#### Disable Auto-start on Boot

```bash
sudo systemctl disable annual-sports-frontend
```

#### View Service Logs

**Real-time log monitoring:**
```bash
sudo journalctl -u annual-sports-frontend -f
```

**View last 50 log entries:**
```bash
sudo journalctl -u annual-sports-frontend -n 50
```

**View logs since today:**
```bash
sudo journalctl -u annual-sports-frontend --since today
```

**View logs with timestamps:**
```bash
sudo journalctl -u annual-sports-frontend --since "2024-01-01 00:00:00"
```

### Step 6: Firewall Configuration

If you're using UFW (Uncomplicated Firewall), allow traffic on port 5173:

```bash
# Allow port 5173
sudo ufw allow 5173/tcp

# Or allow from specific IP only (more secure)
sudo ufw allow from <your-ip> to any port 5173

# Check firewall status
sudo ufw status
```

### Step 7: Reverse Proxy (Optional but Recommended)

For production, it's recommended to use a reverse proxy (Nginx or Apache) in front of the Vite preview server. This provides:
- SSL/TLS encryption (HTTPS)
- Better performance
- Standard ports (80/443)
- Additional security features

#### Nginx Configuration Example

1. Install Nginx:

```bash
sudo apt install nginx -y
```

2. Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/annual-sports-frontend
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or IP

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/annual-sports-frontend /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

### Troubleshooting

#### Service Fails to Start

1. Check service status and logs:
```bash
sudo systemctl status annual-sports-frontend
sudo journalctl -u annual-sports-frontend -n 50
```

2. Verify the project path in the service file is correct:
```bash
cat /etc/systemd/system/annual-sports-frontend.service
```

3. Ensure the project is built:
```bash
cd /var/www/annual-sports-event-ui
ls -la dist/  # Should show built files
```

4. Test running the preview command manually:
```bash
cd /var/www/annual-sports-event-ui
npm run preview
```

#### Port Already in Use

If port 5173 is already in use, you can:

1. Change the port in `vite.config.js`:
```javascript
server: {
  port: 3000,  // Change to available port
}
```

2. Rebuild and restart the service:
```bash
npm run build
sudo systemctl restart annual-sports-frontend
```

#### Permission Issues

If you encounter permission errors:

1. Check file ownership:
```bash
ls -la /var/www/annual-sports-event-ui
```

2. Fix ownership if needed:
```bash
sudo chown -R ubuntu:ubuntu /var/www/annual-sports-event-ui
```

3. Ensure the service user has execute permissions:
```bash
sudo chmod +x /var/www/annual-sports-event-ui
```

#### Service Not Accessible

1. Check if the service is running:
```bash
sudo systemctl status annual-sports-frontend
```

2. Verify the port is listening:
```bash
sudo netstat -tlnp | grep 5173
# or
sudo ss -tlnp | grep 5173
```

3. Check firewall rules:
```bash
sudo ufw status
```

4. Test locally on the server:
```bash
curl http://localhost:5173
```

### Updating the Application

When you need to update the application:

1. Navigate to the project directory:
```bash
cd /var/www/annual-sports-event-ui
```

2. Pull the latest changes:
```bash
git pull origin main  # or your branch name
```

3. Install any new dependencies:
```bash
npm install
```

4. Update `.env` if needed:
```bash
nano .env
```

5. Rebuild the application:
```bash
npm run build
```

6. Restart the service:
```bash
sudo systemctl restart annual-sports-frontend
```

7. Verify the service is running:
```bash
sudo systemctl status annual-sports-frontend
```

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
