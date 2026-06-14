import { db } from "./lib/db";
import { flashcards, documents } from "./drizzle/schema";
import { sql } from "drizzle-orm";

async function run() {
  const flashcardCount = await db.select({ count: sql`count(*)` }).from(flashcards);
  console.log("FLASHCARDS COUNT:", flashcardCount);

  const docs = await db.select({
    id: documents.id,
    status: documents.status,
    totalNodes: documents.totalNodes
  }).from(documents).limit(5);
  console.log("DOCUMENTS (LIMIT 5):", docs);
}
run().catch(console.error).finally(() => process.exit(0));
