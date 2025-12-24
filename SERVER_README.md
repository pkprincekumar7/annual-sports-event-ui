# Backend Server Setup

This project includes a backend server to save player registration data to a JSON file.

## Installation

First, install the required dependencies:

```bash
npm install
```

## Running the Server

To start the backend server, run:

```bash
npm run server
```

The server will start on `http://localhost:3001`

## Running the Frontend

In a separate terminal, start the Vite development server:

```bash
npm run dev
```

## API Endpoints

### GET `/api/players`
Retrieves all players from `public/json_store/players.json`

**Response:**
```json
{
  "success": true,
  "players": [...]
}
```

### POST `/api/save-player`
Saves a single player's data to `public/json_store/players.json`

**Request Body:**
```json
{
  "reg_number": "12345",
  "full_name": "John Doe",
  "gender": "Male",
  "department_branch": "CSE",
  "year": "1st Year (2025)",
  "mobile_number": "1234567890",
  "email_id": "john@example.com",
  "password": "password123"
}
```

### POST `/api/save-players`
Saves multiple players' data (for team events) to `public/json_store/players.json`

**Request Body:**
```json
{
  "players": [
    {
      "reg_number": "12345",
      "full_name": "John Doe",
      "gender": "Male",
      "department_branch": "CSE",
      "year": "1st Year (2025)",
      "mobile_number": "1234567890",
      "email_id": "john@example.com",
      "password": "password123"
    }
  ]
}
```

## Data Storage

Player data is saved to: `public/json_store/players.json`

The file structure is an array of player objects:
```json
[
  {
    "reg_number": "12345",
    "full_name": "John Doe",
    "gender": "Male",
    "department_branch": "CSE",
    "year": "1st Year (2025)",
    "mobile_number": "1234567890",
    "email_id": "john@example.com",
    "password": "password123"
  }
]
```

