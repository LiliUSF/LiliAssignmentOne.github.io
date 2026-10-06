# Lili's Little Sky

## Run the website and AI oracle

The site uses a small Node.js server to serve the pages and keep the OpenAI API key out of the browser. Install Node.js 18 or newer, then configure `OPENAI_API_KEY` in the server's environment and start it from this folder:

```powershell
$env:OPENAI_API_KEY = "your-api-key"
npm start
```

Open `http://localhost:3000`. The key is read only by the server; do not put it in an HTML file, JavaScript file, or commit it. `OPENAI_MODEL` can optionally be set in the server environment; it defaults to `gpt-4.1-mini`.

The oracle requires this Node.js server. Opening `oracle.html` directly as a file, or serving the site with a static-only preview such as Live Server, will not provide the `/api/oracle` endpoint.

The oracle sends only the submitted question to OpenAI, does not retain conversation history, and uses the Responses API with response storage disabled. The service applies a small per-IP request limit. If no API key is configured, the rest of the website still works and the oracle displays a setup message.
