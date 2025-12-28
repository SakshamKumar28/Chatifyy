import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import http from 'http';
import { Server } from 'socket.io';

import connectDB from './config/db.js';
import errorMiddleware from './middleware/errorMiddleware.js';

import authRoutes from './routes/authRoute.js';
import chatRoutes from './routes/chatRoute.js';
import messageRoutes from './routes/messageRoute.js';

import socketHandler from './socket/socket.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

/* ---------------- SOCKET SETUP ---------------- */
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow any origin for development
      callback(null, true); 
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

// initialize socket logic
socketHandler(io);

/* ---------------- MIDDLEWARE ---------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inject socket io into request
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(cors({
  origin: (origin, callback) => {
      // Allow any origin for development
      callback(null, true); 
  },
  credentials: true
}));

app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(helmet());
app.use(morgan('dev'));

app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

/* ---------------- ROUTES ---------------- */
app.get('/', (req, res) => {
  res.send('Server is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);

/* ---------------- ERROR HANDLER ---------------- */
app.use(errorMiddleware);

/* ---------------- START SERVER ---------------- */
const PORT = process.env.PORT || 3000;

connectDB(process.env.MONGO_URI).then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
