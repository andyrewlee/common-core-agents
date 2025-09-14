# common-core-agents

An Inkeep Agent Framework project with multi-service architecture.

<img width="1408" height="670" alt="Screenshot 2025-09-14 at 11 00 06 AM" src="https://github.com/user-attachments/assets/b069878f-49cf-4abf-857a-46bef54eb6b9" />

<img width="1206" height="969" alt="Screenshot 2025-09-14 at 10 59 32 AM" src="https://github.com/user-attachments/assets/81f08afe-4051-48df-b373-e152e02225a0" />

## Purpose & Vision

- Goal: help teachers and parents teach students. A Router agent analyzes the user’s request and hands it to the best specialist (standards, planning, grading, CFU, visuals) so the right workflow runs with minimal friction.
- Built on Inkeep Agents so the same graph can run locally or on the platform with status updates, tool calls, and clear separation of concerns.

## How It Works (Inkeep)

- Uses `@inkeep/agents-sdk` to define an Agent Graph in `src/default/common-core-agents.graph.ts`.
- Agents Run API executes the graph and streams status updates; Agents Manage API stores configuration.
- Tools connect to Model Context Protocol (MCP) servers (standards, classroom, visuals) to keep model prompts clean and push integration logic to tools.

## Agents & Routing

- Router: determines intent and transfers to the appropriate specialist with one-line acknowledgments.
- Standards Historian: lists jurisdictions and fetches exact CCSS identifiers using the Standards MCP.
- Answer‑Key Builder: turns a worksheet image/description into a concise JSON AnswerKey.
- Lesson Planner: creates a 45–60 minute, teacher‑ready plan.
- CFU Generator: produces 3 differentiated checks for understanding aligned to standards.
- Grader: grades student work against an AnswerKey and summarizes mistakes.
- Nano Banana Art Director: picks a prompt and optionally generates visuals for playful activities.

## UI (Separate Repo)

The UI for this project lives here: https://github.com/andyrewlee/common-core-agents-ui

- Chat with the agent team, upload assets, and view streaming status updates.
- This backend repo defines the graph and connectors; the UI repo focuses on the user experience.

## MCP Status (Submission Note)

- We removed live MCP servers last minute due to technical issues in the hackathon environment.
- The intended server implementations and design notes are here: https://github.com/andyrewlee/common-core-mcp-servers
- Connectors remain defined in the graph for future wiring (Standards, Classroom, Visuals).


## Architecture

This project follows a workspace structure with the following services:

- **Agents Manage API** (Port 3002): Agent configuration and managemen
  - Handles entity management and configuration endpoints.
- **Agents Run API** (Port 3003): Agent execution and chat processing  
  - Handles agent communication. You can interact with your agents either over MCP from an MCP client or through our React UI components library
- **Agents Manage UI** (Port 3000): Web interface available via `inkeep dev`
  - The agent framework visual builder. From the builder you can create, manage and visualize all your graphs.

## Quick Start
1. **Install the Inkeep CLI:**
   ```bash
   pnpm install -g @inkeep/agents-cli
   ```

1. **Start services:**
   ```bash
   # Start Agents Manage API and Agents Run API
   pnpm dev
   
   # Start the Dashboard
   inkeep dev
   ```

3. **Deploy your first agent graph:**
   ```bash
   # Navigate to your project's graph directory
   cd src/default/
   
   # Push the weather graph to create it
   inkeep push weather.graph.ts
   ```
  - Follow the prompts to create the project and graph
  - Click on the "View graph in UI:" link to see the graph in the management dashboard

## Project Structure

```
common-core-agents/
├── src/
│   ├── /default              # Agent configurations
├── apps/
│   ├── manage-api/          # Agents Manage API service
│   ├── run-api/             # Agents Run API service
│   └── shared/              # Shared code between API services
│       └── credential-stores.ts  # Shared credential store configuration
├── turbo.json               # Turbo configuration
├── pnpm-workspace.yaml      # pnpm workspace configuration
└── package.json             # Root package configuration
```

## Configuration

### Environment Variables

Environment variables are defined in the following places:

- `apps/manage-api/.env`: Agents Manage API environment variables
- `apps/run-api/.env`: Agents Run API environment variables
- `src/default/.env`: Inkeep CLI environment variables
- `.env`: Root environment variables 

To change the API keys used by your agents modify `apps/run-api/.env`. You are required to define at least one LLM provider key.

```bash
# AI Provider Keys
ANTHROPIC_API_KEY=your-anthropic-key-here
OPENAI_API_KEY=your-openai-key-here
```



### Agent Configuration

Your graphs are defined in `src/default/weather.graph.ts`. The default setup includes:

- **Weather Graph**: A graph that can forecast the weather in a given location.

Your inkeep configuration is defined in `src/default/inkeep.config.ts`. The inkeep configuration is used to configure defaults for the inkeep CLI. The configuration includes:

- `tenantId`: The tenant ID
- `projectId`: The project ID
- `agentsManageApiUrl`: The Manage API URL
- `agentsRunApiUrl`: The Run API URL


## Development

### Updating Your Agents

1. Edit `src/default/weather.graph.ts`
2. Push the graph to the platform to update: `inkeep pus weather.graph.ts` 

### API Documentation

Once services are running, view the OpenAPI documentation:

- Manage API: http://localhost:3002/docs
- Run API: http://localhost:3003/docs

## Learn More

- [Inkeep Documentation](https://docs.inkeep.com)

## Troubleshooting

## Inkeep CLI commands

- Ensure you are runnning commands from `cd src/default`.
- Validate the `inkeep.config.ts` file has the correct api urls.
- Validate that the `.env` file in `src/default` has the correct `DB_FILE_NAME`.

### Services won't start

1. Ensure all dependencies are installed: `pnpm install`
2. Check that ports 3000-3003 are available

### Agents won't respond

1. Ensure that the Agents Run API is running and includes a valid Anthropic or OpenAI API key in its .env file

## Roadmap

- Properly hook up MCP servers (Standards, Classroom, Visuals) using stateless HTTP transport and verify health in the dashboard.
- End‑to‑end assets: reliable image upload from the UI, worksheet vision parsing, grading from photos, and image generation (Visuals MCP).
- Tighter status components tailored to classroom workflows (lesson progress, grading counts, art generation status).
- One‑command local demo and deployment scripts for hackathon judges and educators.
