import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';

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
    res.send('Kirana King API v2 - Debug Mode');
});

import { exec } from 'child_process';

const startServer = () => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

// Auto-run migrations on startup
console.log('Running database sync...');
exec('npx prisma db push --accept-data-loss', (error, stdout, stderr) => {
    if (error) {
        console.error(`Migration Error: ${error.message}`);
    }
    if (stderr) {
        console.error(`Migration Stderr: ${stderr}`);
    }
    console.log(`Migration Stdout: ${stdout}`);

    // Start server regardless of migration success (to avoid crash loops, but log heavily)
    startServer();
});
