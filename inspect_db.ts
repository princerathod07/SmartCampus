import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testConnection() {
  console.log("Testing connection...");
  console.log("URL:", process.env.SUPABASE_URL);
  
  // Test query
  const { data, error } = await supabase.from("books").select("*").limit(5);
  if (error) {
    console.error("Connection failed or 'books' table doesn't exist:", error);
  } else {
    console.log("Connection successful. Books sample:", data);
  }

  // Check database tables
  const tables = ["users", "announcements", "assignments", "complaints", "reminders", "timetable"];
  for (const table of tables) {
    const { data: tData, error: tErr } = await supabase.from(table).select("*").limit(1);
    if (tErr) {
      console.log(`Table '${table}' does not exist or error:`, tErr.message);
    } else {
      console.log(`Table '${table}' exists! Data sample:`, tData);
    }
  }
}

testConnection();
