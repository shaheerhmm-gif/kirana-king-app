import { PrismaClient } from '@prisma/client';

const getDatabaseUrl = () => {
    let url = process.env.DATABASE_URL;
    if (!url) return undefined;

    // Append ?pgbouncer=true if missing, to support Supabase Transaction Pooler
    if (!url.includes('pgbouncer=true')) {
        url += url.includes('?') ? '&pgbouncer=true' : '?pgbouncer=true';
    }
    return url;
};

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: getDatabaseUrl(),
        },
    },
});

export default prisma;
