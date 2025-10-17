const axios = require("axios");
require("dotenv").config();
const crypto = require('crypto');
const gemini = require("./gemini");
const { classifyAny } = require("./multiclassifier");
const { pool } = require('./db');
// Check if file extension is in the allowed set
const allowedExtensions = new Set([
    // code & config we care about
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".mjs",
    ".cjs",
    ".py",
    ".java",
    ".c",
    ".cc",
    ".cpp",
    ".cxx",
    ".h",
    ".hh",
    ".hpp",
    ".hxx",
    ".cs",
    ".go",
    ".rs",
    ".php",
    ".rb",
    ".swift",
    ".kt",
    ".kts",
    ".m",
    ".mm",
    ".scala",
    ".dart",
    ".pl",
    ".pm",
    ".r",
    ".jl",
    ".lua",
    ".sh",
    ".bash",
    ".zsh",
    ".html",
    ".htm",
    ".css",
    ".scss",
    ".sass",
    ".less",
    ".json",
    ".yml",
    ".yaml",
    ".toml",
    ".ini",
    ".cfg",
    ".env",
    // database formats (special-cased below)
    ".sql",
    ".prisma",
    ".dbml",
    ".ddl",
    ".dump",
]);

// STRICT database formats only (anything here => classified "database")
const databaseExtensions = new Set([
    ".sql", // raw SQL (schema, migrations, seeds)
    ".prisma", // Prisma schema
    ".dbml", // DBML schema files
    ".ddl", // explicit DDL exports
    ".dump", // SQL dumps (careful—can be big)
    // add ".sqlite" only if you want to treat actual db files as "database" (usually skip binaries)
]);
const SKIP_EXT = new Set([
    ".config.js", // webpack.config.js, next.config.js, etc.
    ".config.cjs",
    ".config.mjs",
    ".config.ts",
]);

const SKIP_FILES = ["docker-compose.yml", "docker-compose.yaml", "Dockerfile"];

const getLatestCommitSha = async (owner, repo, branch = 'main') => {
    const refUrl = `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`;
    const refRes = await axios.get(refUrl, {
        headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` },
    });
    return refRes.data.object.sha;
};

const processGitHubRepo = async (owner, repo, branch = 'main') => {
    
    // Get latest commit SHA
    const latestSha = await getLatestCommitSha(owner, repo, branch);
    console.log(`Latest commit SHA: ${latestSha}`);
    
    // Check if we already have analysis for this commit
    const existing = await pool.query(
        'SELECT analysis, analyzed_at FROM repository_analyses WHERE owner=$1 AND repo=$2 AND branch=$3 AND commit_sha=$4 LIMIT 1',
        [owner, repo, branch, latestSha]
    );
    
    if (existing.rows.length > 0) {
        console.log(`Cache hit for ${owner}/${repo}@${latestSha}`);
        return {
            ...existing.rows[0].analysis,
            meta: {
                owner,
                repo,
                branch,
                commit_sha: latestSha,
                analyzed_at: existing.rows[0].analyzed_at,
                freshness: 'up_to_date'
            }
        };
    }
    
    console.log(`Cache miss for ${owner}/${repo}@${latestSha}, analyzing...`);
    
    // Construct GitHub API URL dynamically
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;

    try {
        // Get the repository tree
        const response = await axios.get(apiUrl, {
            headers: {
                Authorization: `token ${process.env.GITHUB_TOKEN}`,
            },
        });

        const data = response.data;
        // console.log(data);

        let responseBody = [];
        // Process each object in the tree
        for (const obj of data.tree) {
            if (obj.type === "tree") {
                continue;
            }

            const path = obj.path;
            const lastDotIndex = path.lastIndexOf(".");
            const ext = lastDotIndex !== -1 ? path.substring(lastDotIndex) : "";
            const lower = path.toLowerCase();
            
            if (path[0] == "." || ext == "") {
                console.log("skipped: \t", path);
                continue;
            }

            if (!allowedExtensions.has(ext)) {
                console.log("skipped: \t", path);
                continue;
            }

            if (databaseExtensions.has(ext)) {
                responseBody.push({ type: "database", path: path });
                continue;
            }

            if (
                SKIP_FILES.some((f) => lower.endsWith(f)) ||
                [...SKIP_EXT].some((ext) => lower.endsWith(ext))
            ) {
                console.log("skipped infra:\t", path);
                continue;
            }

            const fileURL = obj.url;

            // Fetch file content
            const fileResponse = await axios.get(fileURL, {
                headers: {
                    Authorization: `token ${process.env.GITHUB_TOKEN}`,
                },
            });

            const fileContent = fileResponse.data.content;

            // Decode base64 content
            try {
                strContent = Buffer.from(fileContent, "base64").toString(
                    "utf-8"
                );
            } catch (error) {
                console.log("skipped: \t", path);
                continue;
            }

            // Process with gemini
            console.log("processing: ", path);
            const c = classifyAny(path, strContent);
            let type;
            if (c.confidence >= 0.6) {
                console.log("classifier");
                type = c.type;
            } else {
                const result = await gemini.classifyRepo(strContent, path);
                type = result.type;
            }
            responseBody.push({
                type: c.type,
                lines: strContent.split("\n").slice(0, 10).join("\n"),
                path: path,
                content: strContent, // Store full content for AI analysis
                // ...c
            });
        }
        const analysisResult = { all: responseBody };
        
        // Store the complete analysis in database
        await pool.query(
            'INSERT INTO repository_analyses (owner, repo, branch, commit_sha, analysis) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (owner, repo, branch, commit_sha) DO UPDATE SET analysis = $5, analyzed_at = NOW()',
            [owner, repo, branch, latestSha, JSON.stringify(analysisResult)]
        );
        
        return {
            ...analysisResult,
        };
    } catch (error) {
        console.error("Error processing repository:", error.message);
        
        // Provide helpful error messages
        if (error.response) {
            if (error.response.status === 404) {
                throw new Error(`Repository not found: ${owner}/${repo}. Check if the repository exists and is public, or if the branch '${branch}' exists. Try 'master' instead of 'main'.`);
            } else if (error.response.status === 401) {
                throw new Error('GitHub authentication failed. Check your GITHUB_TOKEN in .env file.');
            } else if (error.response.status === 403) {
                throw new Error('GitHub API rate limit exceeded or access forbidden. Wait a few minutes or check your token permissions.');
            }
        }
        
        throw error;
    }
};

const processFileContent = async (fileContent, path) => {
    
    try {
        // Compute content hash for caching
        const contentHash = crypto.createHash('sha256').update(fileContent).digest('hex');
        
        // Check if we already have analysis for this file content
        const existing = await pool.query(
            'SELECT ai_analysis FROM file_analyses WHERE path=$1 AND content_hash=$2 LIMIT 1',
            [path, contentHash]
        );
        
        if (existing.rows.length > 0) {
            console.log(`Cache hit for file analysis: ${path}`);
            return existing.rows[0].ai_analysis;
        }
        
        console.log(`Cache miss for file analysis: ${path}, analyzing...`);
        
        // Run AI analysis
        const result = await gemini.analyzeFile(fileContent, path);
        
        // Store analysis for future use
        await pool.query(
            'INSERT INTO file_analyses (repo_owner, repo_name, branch, commit_sha, path, content_hash, preview, ai_analysis) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (repo_owner, repo_name, branch, path, content_hash) DO UPDATE SET ai_analysis = $8',
            ['unknown', 'unknown', 'main', 'unknown', path, contentHash, fileContent.substring(0, 500), result]
        );
        
        return result;
    } catch (error) {
        console.error("Error analyzing file:", error.message);
        throw error;
    }
};

module.exports = { processGitHubRepo, processFileContent };
