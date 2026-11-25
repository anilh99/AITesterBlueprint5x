# Shared QA-to-Jira Draft Agent

This n8n Cloud agent turns a QA person's chat instructions into Jira-ready Bug, Story, and Task drafts. It uses `KAN` by default, asks follow-up questions when needed, and does not create Jira issues.

## Set up in n8n Cloud

1. Create a workflow and add a **Chat Trigger**.
2. Add an **AI Agent** and connect the Chat Trigger to it.
3. Set the AI Agent's user prompt to:

   ```text
   {{ $json.chatInput }}
   ```

4. Connect a chat model to the AI Agent. Add its API key using n8n's encrypted credentials.
5. Copy the contents of [agent-system-prompt.md](./agent-system-prompt.md) into the AI Agent's **System Message**.
6. Test the workflow with the QA examples below. Publish/activate it and share its chat link only with the intended QA users.

## Credentials and safety

- n8n Cloud cannot read the workspace's parent `.env` file.
- For this draft-only agent, Jira API credentials are not needed. QA users manually create approved drafts in Jira.
- Store only the model-provider API key in n8n Cloud credentials. Do not put keys in the system message, chat, or workflow export.
- Review the Chat Trigger's access/sharing settings before distributing its link.

## Quick checks

- Bug: describe a failure with actual and expected behavior; confirm the agent keeps those separate.
- Story: provide a user need and verify acceptance criteria use testable Given/When/Then statements.
- Incomplete request: omit key facts and verify the agent asks concise follow-up questions instead of inventing details.
- Task: give an objective and verify the output includes scope and completion criteria only when supported.
- Confirm each final answer says **Not created** and contains no fabricated Jira details.
