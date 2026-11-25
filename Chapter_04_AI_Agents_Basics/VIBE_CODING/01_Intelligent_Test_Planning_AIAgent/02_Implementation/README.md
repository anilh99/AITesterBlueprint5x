# Jira Test Plan Agent

Small React + Express app that reads a Jira issue and drafts a test plan using the supplied template.

## Run

Requires Node.js 20+. From this directory:

```powershell
npm install
npm run dev:backend
```

In another terminal:

```powershell
npm run dev:frontend
```

Open `http://localhost:5173`. Run backend tests with `npm test` and create a production frontend build with `npm run build`.

## Configuration

The backend reads the repository-root `.env` file; credential values are not returned to the browser or logged. `config.md` was not present, so set or update values using environment variables:

```dotenv
JIRA_BASE_URL=https://your-company.atlassian.net
JIRA_EMAIL=your-jira-email
JIRA_API_TOKEN=your-jira-api-token
JIRA_API_VERSION=3
AI_PROVIDER=groq
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=your-enabled-model
```

For Ollama, set `AI_PROVIDER=ollama`, `OLLAMA_BASE_URL` and `OLLAMA_MODEL`. Do not commit credentials. Jira API version defaults to `3`; set it to `2` for a deployment that uses that API.

The Settings screen can test Jira and either the local Ollama connection or Groq API. Credentials entered there are held only in backend process memory and are cleared when the backend restarts. A model must be configured on the backend (`GROQ_MODEL` or `OLLAMA_MODEL`) for plan generation.

## Deploy to Vercel

The project is configured for Vercel's Express deployment. The Express app exports from `src/server.js`; Vite builds static files into `public/`.

1. Push this project to a Git repository without `.env`.
2. Import it in Vercel and set **Root Directory** to `Chapter_04_AI_Agents_Basics/VIBE_CODING/01_Intelligent_Test_Planning_AIAgent/02_Implementation`.
3. Keep the build command as `npm run build` and output directory as `public` (also defined in `vercel.json`).
4. In Vercel **Project Settings → Environment Variables**, set `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `AI_PROVIDER`, and provider settings: `GROQ_API_KEY` + `GROQ_MODEL`, or `OLLAMA_BASE_URL` + `OLLAMA_MODEL`. Optionally set `JIRA_API_VERSION` (`3` by default).
5. Redeploy after setting environment variables.

Vercel does not read the repository's local `.env`. Settings are read-only in Vercel; set them in Project Settings and redeploy. A local Ollama instance at `localhost` is not reachable from Vercel; use a hosted Ollama endpoint or Groq. The Express function has a 60-second maximum duration, and AI requests have a 35-second timeout.

## Use

Enter an issue key such as `QA-123` and select **Generate test plan**. The app retrieves the issue read-only, extracts its description, acceptance criteria and relevant metadata, then requests a draft from the configured model. The exact supplied template sections are retained. The plan is marked as a draft for human review.

## Verification and limits

`npm test` checks issue-key validation, Jira description extraction, and mocked Jira/AI integration; `npm run build` checks frontend compilation. Live Jira and AI calls require valid authorized configuration and were not claimed as verified. Jira content is treated as source data, not instructions. Missing details are marked **Insufficient information to determine.** Model output can vary despite a zero-temperature request; review before use.
