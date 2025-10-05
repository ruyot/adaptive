const express = require("express");
const app = express();
const PORT = 3002;
const services = require("./services/github");

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "hello",
    });
});

app.get("/healthtest", (req, res) => {
    res.status(200).json({
        status: "healthy",
        message: "Backend is running successfully",
        timestamp: new Date().toISOString(),
    });
});

app.get("/process-repo", async (req, res) => {
    try {
        const resolution = await services.processGitHubRepo();
        res.json({
            success: true,
            message: "Repository processed successfully",
            ...resolution
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get("/process-file", async (req, res) => {
    try {
        const body = await req.body;

        const resolution = await services.processFileContent(body["content"], body["path"]);

        res.json({
            success: true,
            message: "Returned file summary successfully",
            ...resolution
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
