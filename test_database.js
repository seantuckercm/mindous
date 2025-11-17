const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);
const db = drizzle(client);

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test basic query
    const result = await client`SELECT NOW() as current_time`;
    console.log('✅ Database connection successful!');
    console.log('Current time:', result[0].current_time);
    
    // Check tables
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('\n📊 Available tables:');
    tables.forEach(t => console.log('  -', t.table_name));
    
    // Check chat sessions
    const sessions = await client`SELECT COUNT(*) as count FROM chat_sessions`;
    console.log('\n💬 Chat sessions:', sessions[0].count);
    
    // Check chat messages
    const messages = await client`SELECT COUNT(*) as count FROM chat_messages`;
    console.log('📝 Chat messages:', messages[0].count);
    
    // Check tasks
    const tasks = await client`SELECT COUNT(*) as count FROM tasks`;
    console.log('📋 Tasks:', tasks[0].count);
    
    await client.end();
    console.log('\n✅ Database test completed successfully!');
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    process.exit(1);
  }
}

testDatabase();
