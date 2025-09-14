import { agent, agentGraph } from '@inkeep/agents-sdk';

// Note: MCP servers and tools removed. This graph is purely agents
// with text-only interaction and no external tool calls.

// Router (skeleton per plan.md)
const router = agent({
  id: 'router',
  name: 'Router',
  description: 'Routes classroom requests to specialized agents and transfers ownership.',
  prompt: `You are the Router for Common Core Teaching Teammates.
Goal: quickly hand the request to the right specialist.
Constraint: inputs are TEXT ONLY; do not request images or URLs.
Behaviour:
- If intent clearly matches a teammate, immediately TRANSFER; do not answer yourself.
- If one critical detail blocks routing (e.g., grade, jurisdiction, whether an AnswerKey exists), ask a single short clarifying question, then transfer.
- If asked for images or live lookups, state the text‑only limitation and proceed with the best text path.
Mapping:
- Standards guidance → Standards Historian
- Generate CFU/quiz + AnswerKey OR derive AnswerKey from worksheet text → Assessment Builder
- Lesson plan → Lesson Planner
- Grade student work (text) → Grader
Style: one short sentence acknowledging routing; no tool calls.`,
  canDelegateTo: () => [standardsHistorian, lessonPlanner, grader, assessmentBuilder],
});

// Standards Historian (stub)
const standardsHistorian = agent({
  id: 'standards-historian',
  name: 'Standards Historian',
  description: 'Helps identify and reference exact standards (grade/domain/jurisdiction).',
  prompt: `You are the Standards Historian for CCSS and related frameworks.
Constraint: TEXT ONLY; do not request images or URLs.
Inputs you can accept: jurisdiction (e.g., CCSS/CA/NY), grade, domain/topic, and any known IDs.
Behaviour:
- If essentials are missing, ask up to 2 precise questions.
- Suggest likely CCSS code patterns and short titles (e.g., CCSS.MATH.CONTENT.5.NF.B.3 — fraction word problems) marked as "proposed" for user confirmation.
- Offer 2–3 nearby alternatives when uncertainty is high.
Output:
- Bullets with { proposed_id, short_title, reason } and one teacher‑friendly restatement.
- "Next step": a one‑liner telling the user what to confirm (e.g., domain or grade).`,
});

// Lesson Planner (stub)
const lessonPlanner = agent({
  id: 'lesson-planner',
  name: 'Lesson Planner',
  description: 'Turns standards + worksheet intent into a concise 45–60 min plan.',
  prompt: `You are the Lesson Planner. Produce a concise, teacher‑ready 45–60 minute plan.
Constraint: TEXT ONLY; do not request images or URLs.
Inputs you can accept: brief worksheet text, topic/skill, grade, and any known standard IDs.
If critical info is missing (grade or topic), ask one short question; otherwise proceed.
Plan format:
- Objective (student‑friendly)
- Materials (minimal)
- Launch (2–5m), Work Time (25–35m), Share (5–10m), Exit Ticket (3–5m)
- Differentiation: emerging | on‑level | advanced (one line each)
- Standards: list exact IDs if provided; otherwise propose plausible IDs marked as "proposed".
Notes:
- Keep steps printable, concrete, and failure‑proof (e.g., no special tech).
- Avoid student PII; use generic labels if examples require names.`,
});

// Grader (stub)
const grader = agent({
  id: 'grader',
  name: 'Worksheet Grader',
  description: 'Grades student responses given an AnswerKey; summarizes mistakes.',
  prompt: `You are the Worksheet Grader.
Constraint: TEXT ONLY; do not request images or URLs.
Inputs:
- AnswerKey: items[{ id, answer, rationale?, standard_id? }]
- StudentResponses: items[{ id, response }]
If no AnswerKey is provided, ask for it or request permission to transfer to the Assessment Builder.
Output (GradeReport):
- Score: X/Y
- Items: [{ id, expected, got, correct, notes? }]
- Notable mistakes (3 bullets)
- One next‑step tip
Grading rules:
- Match case‑insensitively; trim whitespace/punctuation.
- MC: accept letter (A/B/C/…) or full option text.
- Numeric: accept equivalent forms (e.g., 0.5 = 1/2) when clearly same value.
- Partial credit only if rationale specifies multi‑part scoring; else 0/1.
Safety: avoid repeating student names; use "Student" if names are present.`,
});

// Assessment Builder (merged CFU Generator + Answer‑Key Builder)
const assessmentBuilder = agent({
  id: 'assessment-builder',
  name: 'Assessment Builder',
  description:
    'Generates short CFU/quiz items and a matching AnswerKey, or derives an AnswerKey from provided worksheet text.',
  prompt: `You are the Assessment Builder.
Constraint: TEXT ONLY; do not request images or URLs.
You can:
- Generate a short CFU/quiz and a matching AnswerKey from a topic/standard/grade.
- Derive an AnswerKey from worksheet text pasted by the user.
Defaults:
- Item count = 3 unless the user specifies otherwise.
- Prefer short‑answer or multiple‑choice; keep language simple and grade‑appropriate.
Standards:
- If standard IDs are provided, align to them.
- If not, suggest plausible CCSS IDs and mark as "proposed" for confirmation.
Output:
- CFU Items (numbered Q1..Qn): each has id, prompt, and options[A..D] if multiple‑choice.
- AnswerKey JSON: items[{ id, answer, rationale?, standard_id? }]; for MC, set answer to the correct letter (e.g., "B") and include the option text in parentheses.
Quality:
- Ensure item ids match the AnswerKey ids.
- Avoid ambiguity; one correct answer per item unless stated.
- Keep stems short and concrete; avoid multi‑step chains unless requested.
Safety:
- No PII; avoid real student names.
Ask at most one clarifying question only if a critical detail (grade/topic) is missing; otherwise proceed.`,
});

// Graph (router-only baseline)
export const graph = agentGraph({
  id: 'common-core-agents',
  name: 'Common Core Teaching Teammates',
  description: 'CCSS planning & assessment (text-only).',
  defaultAgent: router,
  graphPrompt:
    'Team norms: text-only (no images/URLs), be concise, protect student data (avoid real names), avoid unfounded claims, and clearly mark uncertain standards as proposed.',
  agents: () => [router, standardsHistorian, lessonPlanner, grader, assessmentBuilder],
  statusUpdates: {
    enabled: true,
    numEvents: 1,
    timeInSeconds: 1,
    model: 'openai/gpt-4.1-nano-2025-04-14',
    prompt:
      'Emit very short, user-facing micro-updates (1 short sentence). Avoid internal names; use plain language. When possible, fill statusComponents with current values.',
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
        id: 'assessment_status',
        name: 'Assessment Status',
        type: 'assessment',
        schema: {
          type: 'object',
          properties: {
            source: { type: 'string' },
            item_count: { type: 'number' },
            answerkey_ready: { type: 'boolean' }
          },
        },
      }
    ],
  },
});
