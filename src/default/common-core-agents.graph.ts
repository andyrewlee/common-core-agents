import { agent, agentGraph, mcpTool } from '@inkeep/agents-sdk';

// MCP servers (URLs come from environment with localhost fallbacks)
const COMMON_CORE_STANDARDS_URL = 'http://localhost:4311/mcp';
const CLASSROOM_MCP_URL = 'http://localhost:4312/mcp';
const VISUALS_MCP_URL = 'http://localhost:4313/mcp';

// Tool connectors (scoped per agent via activeTools)
const standardsTools = mcpTool({
  id: 'edu-standards',
  name: 'Common Core Standards MCP',
  serverUrl: COMMON_CORE_STANDARDS_URL,
  activeTools: ['list_jurisdictions', 'get_standard_set_by_id'],
});

const visionAnswerKeyTool = mcpTool({
  id: 'edu-vision-answer-key',
  name: 'Classroom MCP — Answer Key',
  serverUrl: CLASSROOM_MCP_URL,
  activeTools: ['vision_answer_key_from_image'],
});

const visionLessonPlanTool = mcpTool({
  id: 'edu-vision-lesson-plan',
  name: 'Classroom MCP — Lesson Plan',
  serverUrl: CLASSROOM_MCP_URL,
  activeTools: ['vision_plan_lesson_from_image'],
});

const visionCfuTool = mcpTool({
  id: 'edu-vision-cfu',
  name: 'Classroom MCP — CFU',
  serverUrl: CLASSROOM_MCP_URL,
  activeTools: ['generate_cfu_from_lesson'],
});

const visionGraderTool = mcpTool({
  id: 'edu-vision-grader',
  name: 'Classroom MCP — Grader',
  serverUrl: CLASSROOM_MCP_URL,
  activeTools: ['vision_grade_from_images'],
});

const visualsPickTool = mcpTool({
  id: 'visuals-pick',
  name: 'Visuals MCP — Pick Prompt',
  serverUrl: VISUALS_MCP_URL,
  activeTools: ['pick_nano_banana_prompt'],
});

const visualsGenerateTool = mcpTool({
  id: 'visuals-generate',
  name: 'Visuals MCP — Generate Image',
  serverUrl: VISUALS_MCP_URL,
  activeTools: ['generate_nano_banana_image'],
});

// Router (skeleton per plan.md)
const router = agent({
  id: 'router',
  name: 'Router',
  description: 'Routes classroom requests to specialized agents (skeleton).',
  prompt: `You are the Router for Common Core Teaching Teammates.
For now, do not call tools. Briefly acknowledge the user intent and outline which teammate would handle it (Standards Historian, Answer-Key Builder, Lesson Planner, CFU Generator, Grader, Nano Banana Art Director). Keep replies short until those agents are wired.`,
  canDelegateTo: () => [standardsHistorian, lessonPlanner, grader, answerKeyBuilder, cfuGenerator, nanoBananaArtDirector],
});

// Standards Historian (stub)
const standardsHistorian = agent({
  id: 'standards-historian',
  name: 'Standards Historian',
  description: 'Helps identify and reference exact standards (grade/domain/jurisdiction).',
  prompt: `You are the Standards Historian. Clarify missing details (grade, domain, jurisdiction) if needed. When listing standards, include exact IDs (e.g., CCSS.MATH.CONTENT.5.NF.B.3) and concise titles. Use tools when helpful: list_jurisdictions, get_standard_set_by_id. Keep responses short and practical.`,
  canUse: () => [standardsTools],
});

// Lesson Planner (stub)
const lessonPlanner = agent({
  id: 'lesson-planner',
  name: 'Lesson Planner',
  description: 'Turns standards + worksheet intent into a concise 45–60 min plan.',
  prompt: `You are the Lesson Planner. Produce a concise, teacher-ready plan with:
  - Objective (student-friendly)
  - Materials (minimal)
  - Launch (2–5 min), Work Time (25–35), Share (5–10), Exit Ticket (3–5)
  - Differentiation: emerging/on-level/advanced (1 line each)
  Keep it brief and bulleted. If an image URL is provided, use vision_plan_lesson_from_image.`,
  canUse: () => [visionLessonPlanTool],
});

// Grader (stub)
const grader = agent({
  id: 'grader',
  name: 'Worksheet Grader',
  description: 'Grades student responses given an AnswerKey; summarizes mistakes.',
  prompt: `You are the Grader. If an AnswerKey is not provided, ask for it. Otherwise, return a short GradeReport:
  - Score summary
  - Notable mistakes (bullet list)
  - Next-step tip (1 line)
  Keep it succinct. Use vision_grade_from_images when images are provided.`,
  canUse: () => [visionGraderTool],
});

// Answer‑Key Builder (stub)
const answerKeyBuilder = agent({
  id: 'answer-key-builder',
  name: 'Answer‑Key Builder',
  description: 'Extracts an AnswerKey schema from a worksheet description/image (stub: no tools).',
  prompt: `You are the Answer‑Key Builder. When given a worksheet description or sample items, produce a concise JSON AnswerKey with item IDs, correct answers, and brief rationale if needed. If an image URL is provided, use vision_answer_key_from_image. If details are missing, ask 1–2 clarifying questions. Keep output compact.`,
  canUse: () => [visionAnswerKeyTool],
});

// CFU Generator (stub)
const cfuGenerator = agent({
  id: 'cfu-generator',
  name: 'CFU Generator',
  description: 'Creates quick checks for understanding aligned to a standard (stub: no tools).',
  prompt: `You are the CFU Generator. Given a standard and topic, return 3 items: emerging, on-level, advanced. Provide brief correct answers. Keep language simple and printable. If a LessonPlan is provided, use generate_cfu_from_lesson.`,
  canUse: () => [visionCfuTool],
});

// Nano Banana Art Director (stub)
const nanoBananaArtDirector = agent({
  id: 'nano-banana-art-director',
  name: 'Nano Banana Art Director',
  description: "Turns user intent into an optimal 'nano banana' image prompt and outlines generation steps (stub: no tools).",
  prompt: `You are a creative art director specializing in 'nano banana' imagery.
Steps:
1) Clarify missing intent (count, activity/pose, 'bw' coloring-book vs 'photo' style).
2) Propose 1 best prompt (short, vivid). If 'bw', enforce black-and-white, line-art, bold outlines, printable.
3) Offer 2 quick variants.
 Return a concise plan and the exact chosen prompt. Use pick_nano_banana_prompt to select a template; on approval, call generate_nano_banana_image.`,
  canUse: () => [visualsPickTool, visualsGenerateTool],
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
