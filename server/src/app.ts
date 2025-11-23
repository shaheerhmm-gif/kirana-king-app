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

app.get('/debug-db', (req, res) => {
    const dbUrl = process.env.DATABASE_URL || 'NOT_SET';
    // Show only the part with the ID (between postgres:// and @)
    const masked = dbUrl.replace(/:[^:@]*@/, ':***@');
    res.json({ url: masked });
});

import prisma from './prisma';

app.get('/debug-tables', async (req, res) => {
    try {
        const tables = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        `;

        const storeColumns = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'Store';
        `;

        res.json({ tables, storeColumns });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

import { exec } from 'child_process';

// Start server immediately to satisfy Render's port scan
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Run migrations in background after server starts
    console.log('Running database sync in background...');
    exec('npx prisma db push --accept-data-loss', (error, stdout, stderr) => {
        if (error) {
            console.error(`Migration Error: ${error.message}`);
        }
        if (stderr) {
            console.error(`Migration Stderr: ${stderr}`);
        }
        console.log(`Migration Stdout: ${stdout}`);
    });
});
