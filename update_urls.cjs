const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// A function to get the base API URL
const apiBase = 'const API_BASE = import.meta.env.VITE_API_URL || \'\';\n';
if (!content.includes('const API_BASE = import.meta.env.VITE_API_URL')) {
    content = content.replace('export default function App() {', 'export default function App() {\n  ' + apiBase);
}

// Replace constants
content = content.replace(/const API = \"https:\/\/smartcampus-backend-eubv\.onrender\.com\";\s*/g, '');
content = content.replace(/const ANN = \"https:\/\/smartcampus-backend-eubv\.onrender\.com\";\s*/g, '');
content = content.replace(/const ASS = \"https:\/\/smartcampus-backend-eubv\.onrender\.com\";\s*/g, '');
content = content.replace(/const CMP = \"https:\/\/smartcampus-backend-eubv\.onrender\.com\";\s*/g, '');
content = content.replace(/const usr = \"https:\/\/smartcampus-backend-eubv\.onrender\.com\";\s*/g, '');

content = content.replace(/\`\$\{API\}\/api\/books\`/g, '\`${API_BASE}/api/books\`');
content = content.replace(/\`\$\{ANN\}\/api\/announcements\`/g, '\`${API_BASE}/api/announcements\`');
content = content.replace(/\`\$\{ASS\}\/api\/assignments\`/g, '\`${API_BASE}/api/assignments\`');
content = content.replace(/\`\$\{CMP\}\/api\/complaints\`/g, '\`${API_BASE}/api/complaints\`');
content = content.replace(/\`\$\{usr\}\/api\/users\`/g, '\`${API_BASE}/api/users\`');

// Replace https://smartcampus-backend-eubv.onrender.com/api/... with \`${API_BASE}/api/...\`
content = content.replace(/\"https:\/\/smartcampus-backend-eubv\.onrender\.com\/api\/(.*?)\"/g, '\`${API_BASE}/api/$1\`');

// Replace relative "/api/..." calls with \`${API_BASE}/api/...\`
content = content.replace(/\"\/api\/(.*?)\"/g, '\`${API_BASE}/api/$1\`');
// Replace relative \`/api/...\` calls with \`${API_BASE}/api/...\` (where not already replaced)
// Careful with double replacing: only replace if it starts with /api/
content = content.replace(/\`\/api\/(.*?)\`/g, '\`${API_BASE}/api/$1\`');

fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx updated');
