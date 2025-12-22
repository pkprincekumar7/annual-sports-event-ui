# Backend Server Setup

This project includes a backend server to save student registration data to a JSON file.

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

### GET `/api/students`
Retrieves all students from `public/json_store/students.json`

**Response:**
```json
{
  "success": true,
  "students": [...]
}
```

### POST `/api/save-student`
Saves a single student's data to `public/json_store/students.json`

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

### POST `/api/save-students`
Saves multiple students' data (for team events) to `public/json_store/students.json`

**Request Body:**
```json
{
  "students": [
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

Student data is saved to: `public/json_store/students.json`

The file structure is an array of student objects:
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

