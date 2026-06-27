import dotenv from "dotenv";
dotenv.config();

async function getRpcs() {
  const url = `${process.env.SUPABASE_URL}/rest/v1/`;
  const response = await fetch(url, {
    headers: {
      "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY!,
      "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`
    }
  });
  if (!response.ok) return;
  const spec = await response.json();
  const paths = Object.keys(spec.paths);
  const rpcs = paths.filter(p => p.startsWith("/rpc/"));
  console.log("RPC endpoints:", rpcs);
}

getRpcs();
