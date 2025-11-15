require('dotenv').config({ path: '.env.local' });
const { Pool } = require("pg");

async function checkDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    // Check if tasks table exists
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('tasks', 'profiles', 'agents', 'executions');
    `);
    
    console.log("Tables found:", result.rows);
    
    // If tables exist, check tasks count
    if (result.rows.some(r => r.table_name === 'tasks')) {
      const tasksCount = await pool.query('SELECT COUNT(*) FROM tasks');
      console.log("Tasks count:", tasksCount.rows[0].count);
    }
    
    // Check for profiles table
    if (result.rows.some(r => r.table_name === 'profiles')) {
      const profilesCount = await pool.query('SELECT COUNT(*) FROM profiles');
      console.log("Profiles count:", profilesCount.rows[0].count);
    }
  } catch (error) {
    console.error("Database check error:", error.message);
  } finally {
    await pool.end();
  }
}

checkDatabase();
