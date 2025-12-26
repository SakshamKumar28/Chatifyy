import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import errorMiddleware from './middleware/errorMiddleware.js';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoute.js';

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(helmet());
app.use(morgan('dev'));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, //15 minutes limit
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;

app.get('/', (req, res)=>{
    res.send('Server is running');
});
app.use('/api/auth', authRoutes);

connectDB(process.env.MONGO_URI).then(()=>{
    app.listen(PORT, () => {
        console.log(`Server is runnning on port: ${PORT}`);
    })
});