import { agent, agentGraph, mcpTool } from '@inkeep/agents-sdk';

// MCP servers
const COMMON_CORE_STANDARDS_URL = 'http://localhost:4311/mcp';
const CLASSROOM_MCP_URL = 'http://localhost:4312/mcp';
const VISUALS_MCP_URL = 'http://localhost:4313/mcp';

// Tool connectors (scoped per agent via activeTools)
const standardsTools = mcpTool({
  id: 'edu-standards',
  name: 'Common Core Standards MCP',
  serverUrl: COMMON_CORE_STANDARDS_URL,
  transport: { type: 'streamable_http' },
  activeTools: ['list_jurisdictions', 'get_standard_set_by_id'],
});

// Classroom MCP split into per-agent connectors (least-privilege)
const classroomAnswerKeyTools = mcpTool({
  id: 'classroom-answer-key',
  name: 'Classroom MCP — Answer Key',
  serverUrl: CLASSROOM_MCP_URL,
  transport: { type: 'streamable_http' },
  activeTools: ['vision_answer_key_from_image'],
});

const classroomLessonPlanTools = mcpTool({
  id: 'classroom-lesson-plan',
  name: 'Classroom MCP — Lesson Plan',
  serverUrl: CLASSROOM_MCP_URL,
  transport: { type: 'streamable_http' },
  activeTools: ['vision_plan_lesson_from_image'],
});

const classroomCfuTools = mcpTool({
  id: 'classroom-cfu',
  name: 'Classroom MCP — CFU',
  serverUrl: CLASSROOM_MCP_URL,
  transport: { type: 'streamable_http' },
  activeTools: ['generate_cfu_from_lesson'],
});

const classroomGraderTools = mcpTool({
  id: 'classroom-grader',
  name: 'Classroom MCP — Grader',
  serverUrl: CLASSROOM_MCP_URL,
  transport: { type: 'streamable_http' },
  activeTools: ['vision_grade_from_images'],
});

const visualsTools = mcpTool({
  id: 'visuals',
  name: 'Visuals MCP',
  serverUrl: VISUALS_MCP_URL,
  transport: { type: 'streamable_http' },
  activeTools: ['pick_nano_banana_prompt', 'generate_nano_banana_image'],
});

// Router (skeleton per plan.md)
const router = agent({
  id: 'router',
  name: 'Router',
  description: 'Routes classroom requests to specialized agents and transfers ownership.',
  prompt: `You are the Router for Common Core Teaching Teammates.
Goal: quickly hand the request to the right specialist.
Behaviour:
- If intent clearly matches a teammate, immediately TRANSFER; do not answer yourself.
- If 1 critical detail blocks routing (e.g., grade/jurisdiction), ask one short clarifying question, then transfer.
Mapping:
- Standards/jurisdictions/IDs → Standards Historian
- Answer key from worksheet/image → Answer‑Key Builder
- Lesson plan → Lesson Planner
- CFU/exit ticket → CFU Generator
- Grade student work → Grader
- Nano banana / visuals → Nano Banana Art Director
Style: one short sentence acknowledging routing; no tool calls by you.`,
  canDelegateTo: () => [standardsHistorian, lessonPlanner, grader, answerKeyBuilder, cfuGenerator, nanoBananaArtDirector],
});

// Standards Historian (stub)
const standardsHistorian = agent({
  id: 'standards-historian',
  name: 'Standards Historian',
  description: 'Helps identify and reference exact standards (grade/domain/jurisdiction).',
  prompt: `You are the Standards Historian for CCSS and related frameworks.
Use MCP tools by default.
- If asked to list or explore jurisdictions, CALL list_jurisdictions and return a short bullet list.
- If given a CSP standard set GUID, CALL get_standard_set_by_id and summarize: id, title, grade, domain.
- If the user asks for standards but key details (grade/domain/jurisdiction) are missing, ask 1–2 precise questions.
- When presenting standards, include exact IDs (e.g., CCSS.MATH.CONTENT.5.NF.B.3) with concise titles.
- If nothing is found, say so plainly and suggest a nearest valid query.
Keep outputs compact and practical.`,
  canUse: () => [standardsTools],
});

// Lesson Planner (stub)
const lessonPlanner = agent({
  id: 'lesson-planner',
  name: 'Lesson Planner',
  description: 'Turns standards + worksheet intent into a concise 45–60 min plan.',
  prompt: `You are the Lesson Planner. Produce a concise, teacher‑ready 45–60 minute plan.
If a worksheet image URL is provided, use vision_plan_lesson_from_image and base the plan on the result.
Plan format:
- Objective (student‑friendly)
- Materials (minimal)
- Launch (2–5m), Work Time (25–35m), Share (5–10m), Exit Ticket (3–5m)
- Differentiation: emerging | on‑level | advanced (one line each)
- Standards: list exact IDs if known
Ask a single clarifying question only if a critical detail is missing. Keep output bulleted and crisp.`,
  canUse: () => [classroomLessonPlanTools],
});

// Grader (stub)
const grader = agent({
  id: 'grader',
  name: 'Worksheet Grader',
  description: 'Grades student responses given an AnswerKey; summarizes mistakes.',
  prompt: `You are the Worksheet Grader.
If no AnswerKey is provided, request it (or ask the Router to get one from the Answer‑Key Builder).
When student images are provided, use vision_grade_from_images.
Return a compact GradeReport:
- Score: X/Y
- Notable mistakes (bullets)
- One next‑step tip
Be crisp and actionable.`,
  canUse: () => [classroomGraderTools],
});

// Answer‑Key Builder (stub)
const answerKeyBuilder = agent({
  id: 'answer-key-builder',
  name: 'Answer‑Key Builder',
  description: 'Extracts an AnswerKey schema from a worksheet description/image (stub: no tools).',
  prompt: `You are the Answer‑Key Builder.
When given a worksheet image URL, use vision_answer_key_from_image.
Output a concise JSON AnswerKey: items[{ id, prompt?, answer, rationale? }].
Ask at most 1–2 targeted questions if essential details are missing (e.g., item numbering). Keep explanations short.`,
  canUse: () => [classroomAnswerKeyTools],
});

// CFU Generator (stub)
const cfuGenerator = agent({
  id: 'cfu-generator',
  name: 'CFU Generator',
  description: 'Creates quick checks for understanding aligned to a standard (stub: no tools).',
  prompt: `You are the CFU Generator.
If a LessonPlan is provided, use generate_cfu_from_lesson and return 3 items aligned to its standards.
Otherwise, create 3 CFU items aligned to the given standard/topic: emerging, on‑level, advanced. Include expected answers and standard_id when known. Keep language simple and printable.`,
  canUse: () => [classroomCfuTools],
});

// Nano Banana Art Director (stub)
const nanoBananaArtDirector = agent({
  id: 'nano-banana-art-director',
  name: 'Nano Banana Art Director',
  description: "Turns user intent into an optimal 'nano banana' image prompt and outlines generation steps (stub: no tools).",
  prompt: `You are the Nano Banana Art Director.
Goal: turn user intent into a vivid prompt and optional image generation.
Process:
1) Clarify missing details: count, activity/pose, mode ('bw' coloring‑book vs 'photo'), size (default 1024x1024).
2) Use pick_nano_banana_prompt to select and fill the best template.
3) Present the chosen prompt plus 2 short variants.
4) On approval, call generate_nano_banana_image (n=1–4).
If mode='bw', enforce black‑and‑white line art with bold outlines and no shading. Keep responses tight and creative.`,
  canUse: () => [visualsTools],
});

// Graph (router-only baseline)
export const graph = agentGraph({
  id: 'common-core-agents',
  name: 'Common Core Teaching Teammates',
  description: 'CCSS planning & assessment (router-only skeleton).',
  defaultAgent: router,
  graphPrompt: 'Team norms: be concise, safe with student data, and helpful.',
  agents: () => [router, standardsHistorian, lessonPlanner, grader, answerKeyBuilder, cfuGenerator, nanoBananaArtDirector],
  statusUpdates: {
    enabled: true,
    numEvents: 1,
    timeInSeconds: 1,
    model: 'openai/gpt-4.1-nano-2025-04-14',
    prompt: 'Emit very short, user-facing micro-updates (1 short sentence). Avoid internal names; use plain language. When possible, fill statusComponents with current values.',
    statusComponents: [
      {
        id: 'task_progress',
        name: 'Task Progress',
        type: 'progress',
        schema: {
          type: 'object',
          properties: {
            stage: { type: 'string' },
            progress: { type: 'number' },
            agent: { type: 'string' }
          },
        },
      },
      {
        id: 'edu_status',
        name: 'Education Status',
        type: 'edu',
        schema: {
          type: 'object',
          properties: {
            grade: { type: 'string' },
            domain: { type: 'string' },
            jurisdiction: { type: 'string' },
            standard_ids: { type: 'array', items: { type: 'string' } }
          },
        },
      },
      {
        id: 'lesson_status',
        name: 'Lesson Status',
        type: 'lesson',
        schema: {
          type: 'object',
          properties: {
            objective_ready: { type: 'boolean' },
            sections_prepared: { type: 'number' },
            time_plan_minutes: { type: 'number' }
          },
        },
      },
      {
        id: 'grading_status',
        name: 'Grading Status',
        type: 'grading',
        schema: {
          type: 'object',
          properties: {
            student_count: { type: 'number' },
            graded_count: { type: 'number' },
            average_score: { type: 'number' }
          },
        },
      },
      {
        id: 'art_status',
        name: 'Art Status',
        type: 'art',
        schema: {
          type: 'object',
          properties: {
            mode: { type: 'string' },
            chosen_id: { type: 'string' },
            generated_count: { type: 'number' }
          },
        },
      }
    ],
  },
});
