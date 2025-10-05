
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const SYSTEM_PROMPT =`
You are a strict file classifier and summarizer.

Goal:
Given a single file path and its full content, output a JSON object with:
{
  "type": "frontend" | "backend" | "database",
  "summary": "<detailed plain-English summary of the file>",
  "functions": { "<functionName>": "<short description>", ... }
}

Categories:
- "frontend": UI pages/views, components, styling, client routing.
  Signals: React/Vue/Svelte/Angular; .tsx/.jsx/.vue; folders pages/, components/, app/, public/; CSS/SCSS/Tailwind.
- "backend": APIs, controllers, services, business logic, background jobs.
  Signals: Express/FastAPI/Django/Spring; route/handler defs; controllers/, services/, jobs/.
- "database": DB schemas/migrations, ORM models, queries, ETL, seeds.
  Signals: Prisma/TypeORM/Sequelize/Mongoose; migrations/, models/; SQL; data pipelines.

Rules:
- Return ONLY the JSON object (no prose, no code fences).
- Choose the most specific category if overlaps:
  database > backend > frontend.
- Base the decision on BOTH path and content.
- "summary": 1–3 sentences; clear and specific.
- "functions": map each defined function to a short description (≤15 words).
  Include:
    • Named functions: function foo() {}
    • Exported functions: export function foo() {}
    • Arrow fns with names: const foo = () => {}
    • Class methods as "ClassName.method"
    • Async/Generator variants (prefix not needed in name)
  Exclude:
    • Anonymous callbacks without a stable name
    • Imported functions (declarations not in this file)
- If no functions exist, set "functions": {}.
- If minimal stubs only, still classify and summarize.
- Never add fields other than "type", "summary", "functions".

Input format you receive:s
Path: <full/path/to/file>
Content:
<entire file content here>
`


// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_KEY);

const MODEL_NAME = "gemini-1.5-flash"; // Note: gemma-3-12b-it may not be available, using gemini-1.5-flash

async function gemini(fileContent, path) {
  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Create the chat with system prompt as first message
    const chat = model.startChat({
      history: [
        {
          role: "model",
          parts: [{ text: SYSTEM_PROMPT }],
        },
      ],
    });

    // Send the user message with path and content
    const userMessage = `path: ${path}\ncontent: ${fileContent}`;
    
    const result = await chat.sendMessage(userMessage);
    const response = result.response.text();

    // Validate and parse JSON response
    if (!response.startsWith("```json")) {
      throw new Error('Response does not start with ```json');
    }

    // Extract JSON from markdown code block
    const jsonStr = response.slice(8, -4); // Remove ```json and ```
    return JSON.parse(jsonStr);

  } catch (error) {
    console.error('Error in gemini function:', error.message);
    throw error;
  }
}

module.exports = { gemini };