from google import genai
from google.genai import types
import re
import json
import dotenv
import os

dotenv.load_dotenv()

SYSTEM_PROMPT = """
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

Input format you receive:
Path: <full/path/to/file>
Content:
<entire file content here>
"""

prompt_part = types.Part.from_text(text=SYSTEM_PROMPT)

client = genai.Client(api_key=os.environ.get("GOOGLE_KEY"))

MODEL_NAME = "gemma-3-12b-it"

cfg = types.GenerateContentConfig()


def gemini(fileContent, path):
    content = [types.Content(role="model", parts=[prompt_part])]
    content.append(
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(
                    text=(
                        """path:"""
                        + path
                        + """
                        content:"""
                        + fileContent
                    )
                )
            ],
        )
    )
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=content,
        config=cfg,
    ).text

    if response[:7] != "```json":
        raise Exception('error')
    else:
        return (json.loads(response[8:-4]))