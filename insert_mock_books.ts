import { supabase } from "./config/supabase";
async function run() {
  console.log("Checking and inserting initial mock books...");
  const mockBooks = [
    { title: "Introduction to Java OOP", author: "James Gosling", available: true },
    { title: "Clean Code Handbook", author: "Robert C. Martin", available: true },
    { title: "Data Structures & Algorithms", author: "Thomas Cormen", available: true }
  ];
  for (const book of mockBooks) {
    const { data, error } = await supabase
      .from("books")
      .select("id")
      .eq("title", book.title)
      .limit(1);
    if (error) {
      console.error(`Error checking for "${book.title}":`, error);
      continue;
    }
    if (data && data.length > 0) {
      console.log(`Book "${book.title}" already exists in database.`);
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("books")
        .insert([book])
        .select();
      if (insertError) {
        console.error(`Error inserting "${book.title}":`, insertError);
      } else {
        console.log(`Successfully inserted "${book.title}":`, inserted);
      }
    }
  }
}
run();
