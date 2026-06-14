import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  
  // Fetch users with no username
  const users = await sql`SELECT id, name FROM users WHERE username IS NULL`;
  
  for (const user of users) {
    const username = user.name.toLowerCase().replace(/[^a-z0-9]/g, "") + Math.floor(Math.random() * 1000);
    await sql`UPDATE users SET username = ${username} WHERE id = ${user.id}`;
    console.log(`Updated user ${user.id} with username ${username}`);
  }
  
  console.log("Done updating usernames");
}

main().catch(console.error);
