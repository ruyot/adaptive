const axios = require("axios");
require("dotenv").config();
const gemini = require("./gemini");
const { classifyAny } = require("./multiclassifier");
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

const SKIP_FILES = [
    "docker-compose.yml",
    "docker-compose.yaml",
    "Dockerfile",
    "package-lock.json",
];
const SKIP_DIRS = ["node_modules/"];

const processGitHubRepo = async (owner, repo, branch = "main") => {
    // Construct GitHub API URL dynamically
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;

    console.log(`Processing repository: ${owner}/${repo} (branch: ${branch})`);

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
        let words = 0;
        for (const obj of data.tree) {
            if (obj.type === "tree") {
                continue;
            }

            const path = obj.path;
            const lastDotIndex = path.lastIndexOf(".");
            const ext = lastDotIndex !== -1 ? path.substring(lastDotIndex) : "";
            const lower = path.toLowerCase();

            if (path[0] == "." || ext == "") {
                // console.log("skipped: \t", path);
                continue;
            }

            if (!allowedExtensions.has(ext)) {
                // console.log("skipped: \t", path);
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
                // console.log("skipped infra:\t", path);
                continue;
            }

            if (SKIP_DIRS.some((dir) => path.includes(dir))) {
                // console.log("Skipped directory: ", path);
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
                words += strContent.split(" ").length;
            } catch (error) {
                console.log("skipped: \t", path);
                continue;
            }

            // Process with gemini
            const c = classifyAny(path, strContent);
            let type;
            if (c.confidence >= 0.6) {
                console.log("Classifier process: ", path);
                type = c.type;
            } else {
                console.log("AI process: ", path);
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
        console.log("Words: ", words);
        return { all: responseBody };
    } catch (error) {
        console.error("Error processing repository:", error.message);

        // Provide helpful error messages
        if (error.response) {
            if (error.response.status === 404) {
                throw new Error(
                    `Repository not found: ${owner}/${repo}. Check if the repository exists and is public, or if the branch '${branch}' exists. Try 'master' instead of 'main'.`
                );
            } else if (error.response.status === 401) {
                throw new Error(
                    "GitHub authentication failed. Check your GITHUB_TOKEN in .env file."
                );
            } else if (error.response.status === 403) {
                throw new Error(
                    "GitHub API rate limit exceeded or access forbidden. Wait a few minutes or check your token permissions."
                );
            }
        }

        throw error;
    }
};

const processFileContent = async (fileContent, path) => {
    try {
        const result = await gemini.analyzeFile(fileContent, path);
        console.log(result);
        return result;
    } catch (error) {
        console.error("Error getting summary:", error.message);
        throw error;
    }
};

module.exports = { processGitHubRepo, processFileContent };
