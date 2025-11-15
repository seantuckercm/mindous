#!/bin/bash

# Mindous.ai Database Fix Script
# This script will test connection, apply migration, and verify the database setup

set -e

echo "🔧 Mindous.ai Database Fix Script"
echo "================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ Error: .env.local file not found!${NC}"
    exit 1
fi

source .env.local

echo "Step 1: Testing Supabase Project Availability..."
echo "-------------------------------------------------"

# Test if Supabase project is accessible
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/")

if [ "$HTTP_CODE" = "000" ]; then
    echo -e "${RED}❌ Cannot reach Supabase project${NC}"
    echo "Project URL: $NEXT_PUBLIC_SUPABASE_URL"
    echo ""
    echo "Possible issues:"
    echo "  - Project is paused (unpause it in Supabase dashboard)"
    echo "  - Project doesn't exist"
    echo "  - Network connectivity issues"
    exit 1
fi

echo -e "${GREEN}✅ Supabase project is reachable${NC}"
echo ""

echo "Step 2: Testing API Key..."
echo "--------------------------"

# Test API key
API_TEST=$(curl -s -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
     "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/")

if echo "$API_TEST" | grep -q "Invalid API key"; then
    echo -e "${RED}❌ Invalid API key!${NC}"
    echo "Your NEXT_PUBLIC_SUPABASE_ANON_KEY is incorrect or truncated"
    echo "Please get the complete key from Supabase Dashboard"
    exit 1
fi

echo -e "${GREEN}✅ API key is valid${NC}"
echo ""

echo "Step 3: Testing Database Connection..."
echo "---------------------------------------"

# Create a Node.js script to test DB connection
cat > /tmp/test_db.js << 'ENDOFSCRIPT'
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testDB() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    const result = await client.query('SELECT NOW()');
    console.log('Current database time:', result.rows[0].now);
    
    client.release();
    await pool.end();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    await pool.end();
    return false;
  }
}

testDB().then(success => process.exit(success ? 0 : 1));
ENDOFSCRIPT

if ! node /tmp/test_db.js; then
    echo -e "${RED}❌ Database connection failed!${NC}"
    echo "Please check your DATABASE_URL in .env.local"
    exit 1
fi

echo ""

echo "Step 4: Checking Database Tables..."
echo "------------------------------------"

cat > /tmp/check_tables.js << 'ENDOFSCRIPT'
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkTables() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    client.release();
    await pool.end();
    
    if (result.rows.length === 0) {
      console.log('No tables found - migration needed');
      return false;
    }
    
    console.log('Found tables:');
    result.rows.forEach(row => console.log('  -', row.table_name));
    return true;
  } catch (error) {
    console.error('Error checking tables:', error.message);
    await pool.end();
    return false;
  }
}

checkTables().then(success => process.exit(success ? 0 : 1));
ENDOFSCRIPT

TABLES_EXIST=false
if node /tmp/check_tables.js; then
    TABLES_EXIST=true
    echo -e "${GREEN}✅ Database tables exist${NC}"
else
    echo -e "${YELLOW}⚠️  No tables found - will apply migration${NC}"
fi

echo ""

if [ "$TABLES_EXIST" = false ]; then
    echo "Step 5: Applying Database Migration..."
    echo "---------------------------------------"
    
    echo "Running: npx drizzle-kit push"
    if npx drizzle-kit push --dialect=postgresql --driver=node-postgres; then
        echo -e "${GREEN}✅ Migration applied successfully!${NC}"
    else
        echo -e "${RED}❌ Migration failed!${NC}"
        exit 1
    fi
    echo ""
else
    echo "Step 5: Skipping Migration (tables already exist)"
    echo "--------------------------------------------------"
    echo -e "${GREEN}✅ Tables already exist${NC}"
    echo ""
fi

echo "Step 6: Verifying Database Schema..."
echo "-------------------------------------"

cat > /tmp/verify_schema.js << 'ENDOFSCRIPT'
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function verifySchema() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const requiredTables = ['profiles', 'pending_profiles', 'tasks', 'agents', 'executions', 'llm_configs', 'context'];
  
  try {
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = ANY($1)
      ORDER BY table_name;
    `, [requiredTables]);
    
    const foundTables = result.rows.map(row => row.table_name);
    const missingTables = requiredTables.filter(t => !foundTables.includes(t));
    
    if (missingTables.length > 0) {
      console.log('❌ Missing tables:', missingTables.join(', '));
      client.release();
      await pool.end();
      return false;
    }
    
    console.log('✅ All required tables exist:');
    foundTables.forEach(table => console.log('  -', table));
    
    client.release();
    await pool.end();
    return true;
  } catch (error) {
    console.error('Error verifying schema:', error.message);
    await pool.end();
    return false;
  }
}

verifySchema().then(success => process.exit(success ? 0 : 1));
ENDOFSCRIPT

if ! node /tmp/verify_schema.js; then
    echo -e "${RED}❌ Schema verification failed!${NC}"
    exit 1
fi

echo ""

echo "Step 7: Testing Database Operations..."
echo "---------------------------------------"

cat > /tmp/test_operations.js << 'ENDOFSCRIPT'
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testOperations() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const client = await pool.connect();
    
    // Test SELECT
    const selectResult = await client.query('SELECT 1 as test');
    console.log('✅ SELECT query works');
    
    // Test INSERT (with rollback)
    await client.query('BEGIN');
    await client.query(`
      INSERT INTO profiles (user_id, email, membership) 
      VALUES ('test_user', 'test@example.com', 'free')
    `);
    console.log('✅ INSERT query works');
    await client.query('ROLLBACK');
    console.log('✅ Transaction handling works');
    
    client.release();
    await pool.end();
    return true;
  } catch (error) {
    console.error('❌ Operation test failed:', error.message);
    await pool.end();
    return false;
  }
}

testOperations().then(success => process.exit(success ? 0 : 1));
ENDOFSCRIPT

if ! node /tmp/test_operations.js; then
    echo -e "${RED}❌ Database operations test failed!${NC}"
    exit 1
fi

echo ""
echo "================================="
echo -e "${GREEN}🎉 SUCCESS! Database is fully operational${NC}"
echo "================================="
echo ""
echo "Summary:"
echo "  ✅ Supabase project is accessible"
echo "  ✅ API key is valid"
echo "  ✅ Database connection works"
echo "  ✅ All tables exist"
echo "  ✅ Database operations work"
echo ""
echo "Your Mindous.ai database is now ready to use!"
echo ""

# Cleanup
rm -f /tmp/test_db.js /tmp/check_tables.js /tmp/verify_schema.js /tmp/test_operations.js

exit 0
