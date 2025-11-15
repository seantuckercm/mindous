import { db } from './db/index.ts';
import { tasks } from './db/schema/index.ts';

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const allTasks = await db.select().from(tasks);
    console.log('Tasks in database:', JSON.stringify(allTasks, null, 2));
    console.log('Total tasks:', allTasks.length);
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

testConnection();
