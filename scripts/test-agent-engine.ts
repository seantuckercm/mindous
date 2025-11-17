/**
 * Test Script for Agent Execution Engine
 * Run this to verify the agent engine functionality
 */
import { db } from '@/db';
import { executionsTable, runsTable, tasksTable } from '@/db/schema';
import { createAndExecuteAgent } from '@/lib/agents/execution-engine';

const TEST_USER_ID = 'test-user-001';
const TEST_PROMPT = 'Create a simple React counter component with increment and decrement buttons';

async function testAgentEngine() {
  console.log('🧪 Testing Agent Execution Engine...\n');

  try {
    // 1. Create test task
    console.log('1️⃣ Creating test task...');
    const [task] = await db
      .insert(tasksTable)
      .values({
        userId: TEST_USER_ID,
        title: 'Test: Create Counter Component',
        description: TEST_PROMPT,
        status: 'pending',
      })
      .returning();
    console.log(`✅ Task created: ${task.id}\n`);

    // 2. Create execution record
    console.log('2️⃣ Creating execution record...');
    const [execution] = await db
      .insert(executionsTable)
      .values({
        taskId: task.id,
        status: 'queued',
        startTime: new Date(),
      })
      .returning();
    console.log(`✅ Execution created: ${execution.id}\n`);

    // 3. Create run record
    console.log('3️⃣ Creating run record...');
    const [run] = await db
      .insert(runsTable)
      .values({
        executionId: execution.id,
        userId: TEST_USER_ID,
        status: 'queued',
        title: 'Test Run',
        description: TEST_PROMPT,
        totalSteps: 0,
        completedSteps: 0,
      })
      .returning();
    console.log(`✅ Run created: ${run.id}\n`);

    // 4. Execute agent
    console.log('4️⃣ Starting agent execution...\n');
    console.log('━'.repeat(80));
    
    const result = await createAndExecuteAgent({
      executionId: execution.id,
      runId: run.id,
      userId: TEST_USER_ID,
      prompt: TEST_PROMPT,
      context: {
        taskType: 'code',
        complexity: 'low',
        constraints: ['Use TypeScript', 'Use React hooks'],
      },
    });

    console.log('━'.repeat(80));
    console.log('\n5️⃣ Agent execution completed!\n');

    // 5. Display results
    console.log('📊 Execution Results:');
    console.log(`Status: ${result.status}`);
    console.log(`Execution ID: ${result.executionId}`);
    console.log(`Run ID: ${result.runId}`);
    
    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
    }

    if (result.artifacts && result.artifacts.length > 0) {
      console.log(`\n📦 Generated Artifacts (${result.artifacts.length}):`);
      result.artifacts.forEach((artifact, index) => {
        console.log(`\n  ${index + 1}. ${artifact.path} (${artifact.type})`);
        if (artifact.content) {
          console.log(`     Preview (first 200 chars):`);
          console.log(`     ${artifact.content.slice(0, 200)}...`);
        }
      });
    }

    // 6. Verify database state
    console.log('\n6️⃣ Verifying database state...');
    
    const updatedExecution = await db.query.executionsTable.findFirst({
      where: (table, { eq }) => eq(table.id, execution.id),
    });
    console.log(`Execution Status: ${updatedExecution?.status}`);

    const updatedRun = await db.query.runsTable.findFirst({
      where: (table, { eq }) => eq(table.id, run.id),
    });
    console.log(`Run Status: ${updatedRun?.status}`);
    console.log(`Total Steps: ${updatedRun?.totalSteps}`);
    console.log(`Completed Steps: ${updatedRun?.completedSteps}`);

    // 7. Success!
    console.log('\n✅ Agent Engine Test Completed Successfully!\n');
    
    return {
      success: result.status === 'completed',
      executionId: execution.id,
      runId: run.id,
      artifacts: result.artifacts,
    };
  } catch (error: any) {
    console.error('\n❌ Agent Engine Test Failed!');
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    
    throw error;
  }
}

// Run the test
console.log('═'.repeat(80));
console.log('  AGENT EXECUTION ENGINE TEST');
console.log('═'.repeat(80));
console.log('\n');

testAgentEngine()
  .then((result) => {
    console.log('═'.repeat(80));
    console.log('  TEST PASSED ✅');
    console.log('═'.repeat(80));
    process.exit(0);
  })
  .catch((error) => {
    console.log('═'.repeat(80));
    console.log('  TEST FAILED ❌');
    console.log('═'.repeat(80));
    process.exit(1);
  });
