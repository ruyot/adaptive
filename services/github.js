const axios = require("axios");
require("dotenv").config();
const gemini = require("./gemini");

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
        console.log(data);

        // Process each object in the tree
        for (const obj of data.tree) {
            if (obj.type === "tree") {
                continue;
            }

            const path = obj.path;
            const lastDotIndex = path.lastIndexOf(".");
            const ext = lastDotIndex !== -1 ? path.substring(lastDotIndex) : "";

            console.log(path, ext);

            // Check if file extension is in the allowed set
            const allowedExtensions = new Set([
                ".py",
                ".ts",
                ".tsx",
                ".jsx",
                ".md",
                ".js",
            ]);
            if (!allowedExtensions.has(ext)) {
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
            const strContent = Buffer.from(fileContent, "base64").toString(
                "utf-8"
            );

            // Process with gemini
            const result = await gemini.gemini(strContent, path);
            console.log(result);
        }
    } catch (error) {
        console.error("Error processing repository:", error.message);
        throw error;
    }
};

const processFileContent = async (fileContent, path) => {
    try {
        const result = await gemini.gemini(fileContent, path);
        console.log(result);
        return result;
    } catch (error) {
        console.error("Error getting summary:", error.message);
        throw error;
    }
};

module.exports = { processGitHubRepo, processFileContent };
