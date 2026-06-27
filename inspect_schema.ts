import dotenv from "dotenv";
dotenv.config();

async function getOpenApi() {
  const url = `${process.env.SUPABASE_URL}/rest/v1/`;
  const response = await fetch(url, {
    headers: {
      "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY!,
      "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`
    }
  });
  if (!response.ok) {
    console.error("Failed to fetch OpenAPI spec:", response.statusText);
    return;
  }
  const spec = await response.json();
  console.log("Tables:", Object.keys(spec.paths));
  
  // Print definitions/properties for users, announcements, assignments, complaints, books
  const tablesToInspect = ["users", "announcements", "assignments", "complaints", "books"];
  for (const t of tablesToInspect) {
    const definition = spec.definitions[t];
    if (definition) {
      console.log(`\nTable '${t}' properties:`);
      console.log(JSON.stringify(definition.properties, null, 2));
    } else {
      console.log(`\nTable '${t}' definition not found in OpenAPI spec.`);
    }
  }
}

getOpenApi();
