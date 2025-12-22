# PCE Annual Sports - UMANG 2026

Annual Sports Events Registration Portal for Purnea College of Engineering, Purnea.

## Tech Stack

- **React 18** - UI Library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

4. Preview production build:
```bash
npm run preview
```

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
│   │   ├── AboutSection.jsx
│   │   ├── Footer.jsx
│   │   └── StatusPopup.jsx
│   ├── App.jsx         # Main app component
│   ├── main.jsx        # Entry point
│   └── index.css       # Global styles with Tailwind
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Features

- ✅ Responsive design
- ✅ Countdown timers for event and registration
- ✅ Dynamic registration form (team/individual events)
- ✅ Form submission to Google Apps Script
- ✅ Status popups for success/error messages
- ✅ All original styling preserved with Tailwind CSS

## Notes

- Images are stored in `public/images/` directory
- Form submissions are sent to Google Apps Script Web App
- The application maintains all original functionality and styling
