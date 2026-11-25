# AI Test Strategy Builder

## Run

```powershell
cd src
npm install
npm --prefix frontend install
npm start
npm --prefix frontend run dev
```

Open http://127.0.0.1:5174

The backend reads the parent workspace `.env` file and uses:

- JIRA_BASE_URL
- JIRA_EMAIL
- JIRA_TOKEN
- GROQ_API_KEY
