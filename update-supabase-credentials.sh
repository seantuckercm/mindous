#!/bin/bash

# Interactive Supabase Credentials Updater
# This script helps you update .env.local with correct Supabase credentials

echo "🔑 Supabase Credentials Updater"
echo "================================"
echo ""
echo "This script will help you update your Supabase credentials in .env.local"
echo ""
echo "Please have ready:"
echo "  1. Your Supabase Project URL"
echo "  2. Your anon/public API key (full JWT token)"
echo "  3. Your service_role API key (full JWT token)"
echo "  4. Your database connection string (DATABASE_URL)"
echo ""
echo "Get these from: https://supabase.com/dashboard → Your Project → Settings → API"
echo ""
read -p "Press Enter to continue..."

# Backup existing .env.local
if [ -f .env.local ]; then
    cp .env.local .env.local.backup
    echo "✅ Backed up existing .env.local to .env.local.backup"
    echo ""
fi

# Get Project URL
echo "1. Project URL"
echo "--------------"
echo "Example: https://abcdefghij.supabase.co"
read -p "Enter your NEXT_PUBLIC_SUPABASE_URL: " SUPABASE_URL

if [ -z "$SUPABASE_URL" ]; then
    echo "❌ Error: Project URL cannot be empty"
    exit 1
fi

# Extract project ref from URL
PROJECT_REF=$(echo "$SUPABASE_URL" | sed -E 's|https://([^.]+)\.supabase\.co|\1|')
echo "Detected project ref: $PROJECT_REF"
echo ""

# Get Anon Key
echo "2. Anon/Public API Key"
echo "----------------------"
echo "This should be a long JWT token (200+ characters)"
echo "Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSI..."
read -p "Enter your NEXT_PUBLIC_SUPABASE_ANON_KEY: " ANON_KEY

if [ -z "$ANON_KEY" ]; then
    echo "❌ Error: Anon key cannot be empty"
    exit 1
fi

# Validate JWT format (should have 3 parts separated by dots)
if [ $(echo "$ANON_KEY" | grep -o "\." | wc -l) -lt 2 ]; then
    echo "⚠️  Warning: This doesn't look like a complete JWT token (should have 2 dots)"
    read -p "Continue anyway? (y/n): " CONTINUE
    if [ "$CONTINUE" != "y" ]; then
        exit 1
    fi
fi

echo ""

# Get Service Role Key
echo "3. Service Role API Key"
echo "-----------------------"
echo "This should also be a long JWT token (200+ characters)"
read -p "Enter your SUPABASE_SERVICE_ROLE_KEY: " SERVICE_ROLE_KEY

if [ -z "$SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Service role key cannot be empty"
    exit 1
fi

echo ""

# Get Database URL
echo "4. Database Connection String"
echo "-----------------------------"
echo "Example: postgresql://postgres:your-password@db.$PROJECT_REF.supabase.co:5432/postgres"
echo ""
echo "Get this from: Supabase Dashboard → Settings → Database → Connection String (URI)"
read -p "Enter your DATABASE_URL: " DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: Database URL cannot be empty"
    exit 1
fi

echo ""
echo "Summary of credentials to be updated:"
echo "======================================="
echo "NEXT_PUBLIC_SUPABASE_URL: $SUPABASE_URL"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY: ${ANON_KEY:0:50}... (truncated for display)"
echo "SUPABASE_SERVICE_ROLE_KEY: ${SERVICE_ROLE_KEY:0:50}... (truncated for display)"
echo "DATABASE_URL: postgresql://postgres:****@db.$PROJECT_REF.supabase.co:5432/postgres"
echo ""
read -p "Update .env.local with these credentials? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "Cancelled. No changes made."
    exit 0
fi

# Update .env.local
# Use a temporary file to avoid issues with sed and special characters
if [ -f .env.local ]; then
    # Update existing values
    sed -i.bak "s|^NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL|" .env.local
    sed -i.bak "s|^NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY|" .env.local
    sed -i.bak "s|^SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY|" .env.local
    sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=$DATABASE_URL|" .env.local
    rm -f .env.local.bak
else
    echo "❌ Error: .env.local not found"
    exit 1
fi

echo ""
echo "✅ Credentials updated successfully!"
echo ""
echo "Next steps:"
echo "1. Run: ./fix-database.sh"
echo "   This will test the connection and apply migrations"
echo ""
echo "2. Or manually test with: npm run dev"
echo ""
