#!/bin/bash
# Render Pre-Deploy Script

echo "🔧 Running Prisma Database Migration..."

# Generate Prisma Client
npx prisma generate

# Push database schema
npx prisma db push --accept-data-loss --skip-generate

echo "✅ Database migration complete!"
