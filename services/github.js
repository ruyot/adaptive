const axios = require("axios");
require("dotenv").config();
const gemini = require("./gemini");
const { classifyAny } = require("./multiclassifier");

const processGitHubRepo = async () => {
    const testLink =
        "https://api.github.com/repos/taseskics/devconnect/git/trees/main?recursive=1";

    try {
        // Get the repository tree
        const response = await axios.get(testLink, {
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
            if (path[0] == "." || ext == "") {
                console.log("skipped: \t", path);
                continue;
            }
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

            if (!allowedExtensions.has(ext)) {
                console.log("skipped: \t", path);
                continue;
            }

            if (databaseExtensions.has(ext)) {
                responseBody.push({ type: "database", path: path });
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
                // ...c
            });
        }
        return { all: responseBody };
    } catch (error) {
        console.error("Error processing repository:", error.message);
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
