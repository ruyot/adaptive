// multiClassifier.js (FE/BE only)
const path = require("path");

// --- Language detection by extension + light content cues ---
const LANG_BY_EXT = {
  ".py": "python",
  ".pyw": "python",
  ".ipynb": "python",
  ".cpp": "cpp", ".cc": "cpp", ".cxx": "cpp", ".hpp": "cpp", ".hh": "cpp", ".hxx": "cpp",
  ".c": "c", ".h": "c",
  ".java": "java",
  ".js": "js", ".mjs": "js", ".cjs": "js",
  ".ts": "ts", ".tsx": "ts", ".jsx": "js",
  ".go": "go",
  ".rb": "ruby",
  ".php": "php",
  ".rs": "rust",
  ".cs": "csharp",
  ".sql": "sql",
  ".prisma": "prisma",
};

// --- Paths ---
const FRONTEND_DIRS = /(^|\/)(app|pages|components|public|styles|assets|static|client|ui)(\/|$)/i;
const BACKEND_DIRS  = /(^|\/)(server|api|backend|controllers|routes|services|middleware|handlers|cli|scripts)(\/|$)/i;
// pages/api is backend in Next.js
const PAGES_API = /(^|\/)pages\/api(\/|$)/i;

// --- Generic signals (any language) ---
const GENERIC = {
  sql: /\b(SELECT|INSERT|UPDATE|DELETE|CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE|WITH\s+RECURSIVE)\b/i,
  orm: /\b(prisma|@prisma|Sequelize|TypeORM|Mongoose|Drizzle|knex|SQLAlchemy|peewee|Hibernate|JPA|JpaRepository|MyBatis)\b/,
};

// --- Language-specific backend/web framework hints ---
const HINTS = {
  python: /\b(flask|fastapi|django|pyramid|tornado|sqlalchemy|psycopg2|pymysql|alembic)\b/i,
  java:   /\b(spring-boot|spring\.|@RestController|@RequestMapping|ResponseEntity|JAX\-RS|jakarta\.ws\.rs|Hibernate|JpaRepository)\b/i,
  cpp:    /\b(crow::|pistache::|cpprestsdk|restbed|boost::beast|httplib::|oatpp::)\b/,
  js:     /\b(express|fastify|koa|hapi|apollo-server|graphql-yoga|mongoose|prisma|sequelize|next\/|react|vue|svelte)\b/,
  ts:     /\b(express|fastify|koa|nestjs|apollo-server|graphql-yoga|prisma|sequelize|next\/|react|vue|svelte)\b/,
  go:     /\b(gin\.|echo\.|fiber|chi\.|net\/http|gorm|sqlx)\b/,
  ruby:   /\b(rails|sinatra|sequel|activerecord)\b/i,
  php:    /\b(Laravel|Symfony|PDO|Eloquent)\b/,
  rust:   /\b(actix-web|rocket|axum|diesel|sqlx)\b/,
  csharp: /\b(ASP\.NET|MinimalApis|EntityFramework|DbContext)\b/i,
};

// --- Frontend-only hints (beyond paths) ---
const FE_HINTS = {
  js: /\b(react|next\/|vite|vite\.config|vue|svelte|solid-js|@mui\/|chakra-ui|tailwindcss|framer-motion|recharts|react-router)\b/,
  ts: /\b(react|next\/|vite|vue|svelte|solid-js|@mui\/|chakra-ui|tailwindcss|framer-motion|recharts|react-router)\b/,
};

// Read lightweight slices
function sampleContent(raw) {
  const head = raw.slice(0, 6000);
  const tail = raw.slice(-3000);
  return `${head}\n${tail}`;
}

function detectLang(filePath, raw) {
  const ext = path.extname(filePath).toLowerCase();
  if (LANG_BY_EXT[ext]) return LANG_BY_EXT[ext];
  const s = sampleContent(raw);
  if (/\bclass\s+\w+\s*{/.test(s) && /\bpublic\s+(class|interface)\b/.test(s)) return "java";
  if (/#include\s+<[^>]+>/.test(s) || /\bnamespace\b/.test(s)) return "cpp";
  if (/\bdef\s+\w+\(/.test(s) && /\bimport\s+\w+/.test(s)) return "python";
  return "unknown";
}

// --- Scoring (FE/BE only) ---
function scoreFrontend(p, lang, s) {
  let sc = 0;
  if (FRONTEND_DIRS.test(p)) sc += 2;
  if (!PAGES_API.test(p) && (lang === "js" || lang === "ts")) {
    if (FE_HINTS[lang]?.test(s)) sc += 2;
  }
  // Browser-only cues
  if (/\b(window|document|localStorage|navigator)\b/.test(s)) sc += 1.2;
  if (/\bjs-cookie\b/.test(s)) sc += 0.8;

  // Penalize strong server cues
  if (HINTS[lang]?.test(s)) sc -= 1;
  if (/(app|router|server)\s*\.(get|post|put|patch|delete|use)\s*\(/i.test(s)) sc -= 0.8;

  return sc;
}

function scoreBackend(p, lang, s) {
  let sc = 0;
  if (BACKEND_DIRS.test(p) || PAGES_API.test(p)) sc += 2;
  if (HINTS[lang]?.test(s)) sc += 2;
  if (/(app|router|server)\s*\.(get|post|put|patch|delete|use)\s*\(/i.test(s)) sc += 1.2;
  if (/\b(process\.env(?!\.NEXT_PUBLIC))\b/.test(s)) sc += 0.6;
  if (/\b(require\('dotenv'\)|node:fs|node:path|fs\.|path\.)\b/.test(s)) sc += 0.6;

  // DB-related cues *do not* make it "database"; they nudge backend since they are server-side.
  if (GENERIC.sql.test(s) || GENERIC.orm.test(s)) sc += 0.6;

  // Penalize obvious FE cues
  if (FRONTEND_DIRS.test(p) && !PAGES_API.test(p)) sc -= 0.8;
  if ((lang === "js" || lang === "ts") && FE_HINTS[lang]?.test(s)) sc -= 0.8;

  return sc;
}

function classifyAny(filePath, raw) {
  const p = filePath.replace(/\\/g, "/");
  const lang = detectLang(p, raw);
  const s = sampleContent(raw);

  const fe = scoreFrontend(p, lang, s);
  const be = scoreBackend(p, lang, s);

  // Decide
  let type = fe >= be ? "frontend" : "backend";

  // Confidence: map score gap and magnitude to 0..1
  const top = Math.max(fe, be);
  const gap = Math.abs(fe - be);
  // scale: top up to ~6; gap up to ~3 → tuneable
  const confidence = Math.max(0, Math.min(1, (top * 0.15) + (gap * 0.2)));

  const reasons = [
    `lang=${lang}`,
    FRONTEND_DIRS.test(p) && "frontend-dir",
    BACKEND_DIRS.test(p) && "backend-dir",
    PAGES_API.test(p) && "pages/api-backend",
    (lang === "js" || lang === "ts") && FE_HINTS[lang]?.test(s) && "fe-framework",
    HINTS[lang]?.test(s) && "backend-framework",
    GENERIC.sql.test(s) && "sql-cues",
    GENERIC.orm.test(s) && "orm-cues",
    /\b(window|document|localStorage|navigator)\b/.test(s) && "browser-apis",
  ].filter(Boolean);

  return {
    type,
    confidence: Number(confidence.toFixed(2)),
    reasons,
    language: lang,
    scores: { frontend: Number(fe.toFixed(2)), backend: Number(be.toFixed(2)) }
  };
}

module.exports = { classifyAny };
