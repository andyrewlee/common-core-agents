import { agent, agentGraph, mcpTool } from '@inkeep/agents-sdk';

// MCP Tools
const forecastWeatherTool = mcpTool({
  id: 'fUI2riwrBVJ6MepT8rjx0',
  name: 'Forecast weather',
  serverUrl: 'https://weather-forecast-mcp.vercel.app/mcp',
});

const geocodeAddressTool = mcpTool({
  id: 'fdxgfv9HL7SXlfynPx8hf',
  name: 'Geocode address',
  serverUrl: 'https://geocoder-mcp.vercel.app/mcp',
});

// Agents
const weatherAssistant = agent({
  id: 'weather-assistant',
  name: 'Weather assistant',
  description: 'Responsible for routing between the geocoder agent and weather forecast agent',
  prompt:
    'You are a helpful assistant. When the user asks about the weather in a given location, first ask the geocoder agent for the coordinates, and then pass those coordinates to the weather forecast agent to get the weather forecast',
  canDelegateTo: () => [weatherForecaster, geocoderAgent],
});

const weatherForecaster = agent({
  id: 'weather-forecaster',
  name: 'Weather forecaster',
  description:
    'This agent is responsible for taking in coordinates and returning the forecast for the weather at that location',
  prompt:
    'You are a helpful assistant responsible for taking in coordinates and returning the forecast for that location using your forecasting tool',
  canUse: () => [forecastWeatherTool],
});

const geocoderAgent = agent({
  id: 'geocoder-agent',
  name: 'Geocoder agent',
  description: 'Responsible for converting location or address into coordinates',
  prompt:
    'You are a helpful assistant responsible for converting location or address into coordinates using your geocode tool',
  canUse: () => [geocodeAddressTool],
});

// Agent Graph
export const weatherGraph = agentGraph({
  id: 'weather-graph',
  name: 'Weather graph',
  defaultAgent: weatherAssistant,
  statusUpdates: {
    enabled: true,
    // Emit an update after every event (tool call, generation, transfer)
    numEvents: 1,
    // Also emit time-based updates for longer operations (max chatty)
    timeInSeconds: 1,
    // Use a fast model for summaries so frequent updates stay snappy
    model: 'openai/gpt-4.1-nano-2025-04-14',
    // Keep updates short and human-friendly
    prompt:
      'Write concise, user-facing progress updates (1 short sentence). Avoid internal agent/tool names; use plain language like "looking up coordinates", "fetching forecast", "summarizing results". Mention the location when known.',
    // If you want structured components later, add statusComponents here.
  },
  agents: () => [weatherAssistant, weatherForecaster, geocoderAgent],
});
