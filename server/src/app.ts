import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { exec } from 'child_process';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Debug Middleware: Log all requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.use('/api', routes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

app.get('/', (req, res) => {
    res.send('Kirana King API is running 🚀');
});

// Start server for Render deployment
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
