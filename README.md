# Chatifyy

A full-stack real-time chat application built with Node.js/Express and React/TypeScript.

## Features

- User Authentication (Register/Login)
- Protected Routes
- Real-time Messaging
- User Profiles
- Responsive Design with Tailwind CSS

## Project Structure

```
chat-app/
├── backend/          # Node.js/Express server
│   ├── src/
│   │   ├── config/   # Database configuration
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Custom middleware
│   │   ├── models/   # MongoDB schemas
│   │   ├── routes/   # API routes
│   │   └── index.js  # Server entry point
│   └── package.json
└── frontend/         # React/TypeScript client
    ├── src/
    │   ├── components/   # React components
    │   ├── pages/       # Page components
    │   ├── utils/       # Utility functions
    │   ├── App.tsx      # Main app component
    │   └── main.tsx     # React entry point
    └── package.json
```

## Prerequisites

- Node.js (v16 or higher)
- MongoDB
- npm or yarn

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```bash
cp .env.example .env
```

4. Update the `.env` file with your values:
```
PORT=3000
MONGO_URI=mongodb://localhost:27017/chat-app
JWT_SECRET=your_jwt_secret_key_here
CLIENT_URL=http://localhost:5173
COOKIE_SECRET=your_cookie_secret_key_here
```

5. Start the server:
```bash
npm run dev
```

The backend will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the frontend directory:
```bash
cp .env.example .env.local
```

4. Update the `.env.local` file:
```
VITE_API_URL=http://localhost:3000/api
```

5. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## API Endpoints

### Authentication Routes

- `POST /api/auth/register` - Register a new user
  - Body: `{ username, email, password, avatar? }`
  
- `POST /api/auth/login` - Login user
  - Body: `{ email, password }` or `{ username, password }`
  
- `POST /api/auth/logout` - Logout user (requires auth)
  
- `GET /api/auth/profile` - Get user profile (requires auth)

## Usage

1. **Register**: Navigate to `/register` and create a new account
2. **Login**: Go to `/login` and enter your credentials
3. **Chat**: Start messaging in the chat interface

## Technologies Used

### Backend
- Node.js
- Express.js
- MongoDB
- JWT for authentication
- Bcrypt for password hashing
- Helmet for security
- CORS for cross-origin requests

### Frontend
- React 19
- TypeScript
- React Router DOM v7
- Axios for HTTP requests
- Tailwind CSS for styling
- Vite for build tooling

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- HTTP-only cookies
- CORS protection
- Rate limiting
- Helmet security headers
- Middleware for error handling

## Future Enhancements

- Real-time messaging with Socket.io
- Multiple chat rooms
- User search functionality
- Message history
- User avatars and profiles
- Typing indicators
- Message reactions
- File sharing

## License

ISC

## Author

Saksham Kumar
