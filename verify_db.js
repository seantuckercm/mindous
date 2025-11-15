const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const client = postgres(process.env.DATABASE_URL);

async function verifyData() {
  try {
    console.log('\n=== EXECUTIONS ===');
    const executions = await client`
      SELECT id, task_id, status, created_at 
      FROM executions 
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    console.log(executions);

    console.log('\n=== TASKS ===');
    const tasks = await client`
      SELECT id, title, status, parent_task_id, created_at 
      FROM tasks 
      ORDER BY created_at DESC 
      LIMIT 10
    `;
    console.log(tasks);

    console.log('\n=== TASK WITH SUBTASKS ===');
    const taskWithSubtasks = await client`
      SELECT 
        t.id, 
        t.title, 
        t.status,
        (SELECT json_agg(json_build_object(
          'id', st.id,
          'title', st.title,
          'status', st.status
        ))
        FROM tasks st
        WHERE st.parent_task_id = t.id
        ) as subtasks
      FROM tasks t
      WHERE t.parent_task_id IS NULL
      ORDER BY t.created_at DESC
      LIMIT 2
    `;
    console.log(JSON.stringify(taskWithSubtasks, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

verifyData();
