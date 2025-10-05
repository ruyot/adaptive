const axios = require("axios");
require("dotenv").config();
const gemini = require("./gemini");

const processGitHubRepo = async () => {
    const testLink =
        "https://api.github.com/repos/taseskics/devconnect/git/trees/main?recursive=1";

    try {
        // Get the repository tree
        const response = await axios.get(testLink, {
           
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
            if (path[0] == "." || ext == "") continue;
            console.log(path, ext);

            // Check if file extension is in the allowed set
            const notAllowedExtensions = new Set([".yaml", ".md", ".json"]);
            if (notAllowedExtensions.has(ext)) {
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
                continue;
            }

            // Process with gemini
            const result = await gemini.classifyRepo(strContent, path);
            console.log(result);
            return result;
        }
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
