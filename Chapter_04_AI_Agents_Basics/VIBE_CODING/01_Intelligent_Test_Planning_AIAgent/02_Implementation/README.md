# Jira Test Plan Generator

A lightweight React application that retrieves Jira issues and generates structured test plans.

## Quick Start

### Prerequisites
- Node.js (v16+)
- npm
- A `.env` file (any parent folder, git-ignored) **or** the in-app Settings page

### Setup

1. **Configure credentials** – either use the **Settings** page in the app, or add a `.env` file:
```
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_TOKEN=your-api-token
GROQ_API_KEY=your-groq-key
```
Values saved in Settings are stored server-side in `src/backend/settings.local.json` (git-ignored) and override `.env`. Secrets are never returned to the browser.

2. **Install backend dependencies**:
```bash
cd src
npm install
```

3. **Install frontend dependencies**:
```bash
cd src/frontend
npm install
```

### Run

**Terminal 1 - Backend (port 3000)**:
```bash
cd src
npm start
```

**Terminal 2 - Frontend (port 5173)**:
```bash
cd src/frontend
npm run dev
```

**Open browser**:
```
http://localhost:5173
```

## Usage

1. Enter a Jira issue ID (e.g., `QA-123`)
2. Click "Generate Plan"
3. The backend retrieves the issue from Jira
4. A test plan is generated based on the issue details
5. Copy the plan or use it as a template

## Architecture

- **Backend**: Express.js (Node.js)
  - `server.js` - API endpoints
  - `jira.js` - Jira integration
  - `template.js` - Test plan generation
  - `config.js` - Loads `.env` and saved settings
  - `llm.js` - LLM connection test (Ollama / Groq)

- **Frontend**: React + Vite
  - `App.jsx` - Main page and navigation
  - `Settings.jsx` - Settings page (Jira connection, LLM configuration)
  - `api.js` - API client
  - `styles.css` - Styling

## Features

- Simple Jira issue lookup
- Automatic test plan generation
- Loading and error states
- Copy to clipboard functionality
- Clean, minimal UI

## Notes

- Credentials are stored on the backend only
- Frontend makes proxied requests through Vite dev server
- Test plans use template structure with "Insufficient information to determine" for missing details
- No data is persisted or logged beyond request handling
