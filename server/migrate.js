#!/usr/bin/env node

console.log('🔧 Running database migrations...');

const { exec } = require('child_process');

exec('npx prisma generate', (err, stdout, stderr) => {
    if (err) {
        console.error('❌ Prisma generate failed:', err);
        process.exit(1);
    }
    console.log('✅ Prisma client generated');

    exec('npx prisma db push --accept-data-loss', (err2, stdout2, stderr2) => {
        if (err2) {
            console.error('❌ Database push failed:', err2);
            process.exit(1);
        }
        console.log('✅ Database schema updated');
        console.log(stdout2);
        process.exit(0);
    });
});
