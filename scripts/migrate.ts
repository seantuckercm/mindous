import { client } from "../db/db";
import { readFileSync } from "fs";
import { join } from "path";

async function runMigrations() {
  try {
    console.log("🚀 Starting database migration...");
    
    // Read the migration file
    const migrationPath = join(process.cwd(), "db/migrations/0000_odd_mongoose.sql");
    const migrationSQL = readFileSync(migrationPath, "utf-8");
    
    // Split by statement-breakpoint and execute each statement
    const statements = migrationSQL.split("--> statement-breakpoint");
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
        await client.unsafe(statement);
        console.log(`✅ Statement ${i + 1} completed`);
      }
    }
    
    console.log("\n✨ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigrations();
