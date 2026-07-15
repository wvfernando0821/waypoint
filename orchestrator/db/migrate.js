import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schema = readFileSync(path.join(__dirname, "schema.sql"), "utf-8");

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query(schema);
await client.end();

console.log("Schema applied.");
