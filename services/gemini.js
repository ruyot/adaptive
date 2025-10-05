
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const CLASSIFY_PROMPT = `
Return ONLY a single JSON object matching this exact schema:
{"type": "frontend"|"database"}
Most specific wins: backend>frontend. Use path+content. No extra text.
Respond with VALID JSON only, no code fences, no explanation.
`

const ANALYZE_PROMPT = `
You are a strict file summarizer.

Goal:
Given a single file path and its full content, output ONLY valid JSON with this schema:
{"summary": "<1-3 sentence plain-English summary>", "functions": {"<functionName>": "<short description>", ...}}

Rules:
- Return ONLY the JSON object (no prose, no code fences).
- "summary": 1–3 sentences; clear and specific.
- "functions": map each defined function to a short description (≤15 words).
  Include named and exported functions, arrow functions assigned to names, and class methods as "ClassName.method".
- If no functions exist, set "functions": {}.
- Never add fields other than "summary" and "functions".

Input format you receive:
Path: <full/path/to/file>
Content:
<entire file content here>
Respond with VALID JSON only.
`


// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_KEY);

const MODEL_NAME = process.env.GEMINI_MODEL || "gemma-3-27b-it"; // configurable
const MAX_CONTENT_CHARS = parseInt(process.env.GEMINI_MAX_CHARS || '2000000000000', 10);
const MAX_RETRIES = parseInt(process.env.GEMINI_MAX_RETRIES || '2', 10);
const RETRY_DELAY_MS = parseInt(process.env.GEMINI_RETRY_DELAY_MS || '500', 10);

async function classifyRepo(fileContent, path) {
  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Create the chat with system prompt as first message
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: CLASSIFY_PROMPT }],
        },
      ],
    });

    // Send the user message with path and content
    const userMessage = `path: ${path}\ncontent: ${fileContent}`;
    
    // send and try parse with retries
    let lastErr = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const result = await chat.sendMessage(userMessage);
      const response = await result.response.text();
      try {
        const json = extractJSON(response);
        // ensure it matches expected shape
        if (json && typeof json.type === 'string') return json;
        throw new Error('Parsed JSON missing "type"');
      } catch (err) {
        lastErr = err;
        // send a short correction prompt before retrying
        if (attempt < MAX_RETRIES) {
          await chat.sendMessage('Your last response was not valid JSON. Reply with ONLY valid JSON matching the schema: {"type":"frontend|backend|database"}');
          await sleep(RETRY_DELAY_MS);
          continue;
        }
      }
    }
    throw lastErr;

  } catch (error) {
    console.error('Error in gemini function:', error.message);
    throw error;
  }
}

async function analyzeFile(fileContent, path) {
    try {
      // Get the generative model
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  
      // Create the chat with system prompt as first message
      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: ANALYZE_PROMPT }],
          },
        ],
      });
  
      // Send the user message with path and content
      const userMessage = `path: ${path}\ncontent: ${fileContent}`;
      
      // Trim content if too large
      let trimmed = fileContent;
      if (trimmed && trimmed.length > MAX_CONTENT_CHARS) {
        const head = Math.floor(MAX_CONTENT_CHARS * 0.6);
        const tail = MAX_CONTENT_CHARS - head;
        trimmed = trimmed.slice(0, head) + '\n\n...TRUNCATED...\n\n' + trimmed.slice(-tail);
      }

      const userMsg = `path: ${path}\ncontent: ${trimmed}`;

      let lastErr = null;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const result = await chat.sendMessage(userMsg);
        const response = await result.response.text();
        try {
          const json = extractJSON(response);
          if (json && typeof json.summary === 'string' && typeof json.functions === 'object') return json;
          throw new Error('Parsed JSON missing required fields');
        } catch (err) {
          lastErr = err;
          if (attempt < MAX_RETRIES) {
            await chat.sendMessage('Your last response was not valid JSON. Reply NOW with only valid JSON matching this schema: {"summary":"...","functions":{}}');
            await sleep(RETRY_DELAY_MS);
            continue;
          }
        }
      }
      throw lastErr;
  
    } catch (error) {
      console.error('Error in gemini function:', error.message);
      throw error;
    }
  }

  function extractJSON(text) {
    if (!text || typeof text !== 'string') throw new Error('No text to parse');

    // If there's a ```json``` block, prefer that
    const fenceJson = /```json\s*([\s\S]*?)```/i.exec(text);
    if (fenceJson && fenceJson[1]) {
      return JSON.parse(fenceJson[1].trim());
    }
    // If there's any fenced block, take content
    const fenceAny = /```(?:[\s\S]*?)```/i.exec(text);
    if (fenceAny && fenceAny[0]) {
      const inner = fenceAny[0].replace(/```/g, '').trim();
      try { return JSON.parse(inner); } catch (e) {}
    }

    // Otherwise try to find first balanced JSON object
    const firstBrace = text.indexOf('{');
    if (firstBrace === -1) throw new Error('No JSON object found');
    let i = firstBrace;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (; i < text.length; i++) {
      const ch = text[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') depth++;
      if (ch === '}') {
        depth--;
        if (depth === 0) {
          const candidate = text.slice(firstBrace, i + 1);
          return JSON.parse(candidate);
        }
      }
    }
    throw new Error('No balanced JSON found');
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // Default exported shim to match existing callers that expect a single function
  module.exports = {classifyRepo, analyzeFile}