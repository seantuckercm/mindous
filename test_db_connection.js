const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Test query to check if tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📊 Tables in database:');
    if (result.rows.length === 0) {
      console.log('❌ No tables found! Migration needs to be applied.');
    } else {
      result.rows.forEach(row => console.log(`  - ${row.table_name}`));
    }
    
    client.release();
    await pool.end();
    return result.rows.length > 0;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    await pool.end();
    return false;
  }
}

testConnection();
