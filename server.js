const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3002;
const services = require("./services/github");

// Enable CORS for all origins in development
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

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
        const { owner, repo, branch } = req.query;
        
        // Validate required parameters
        if (!owner || !repo) {
            return res.status(400).json({ 
                success: false, 
                error: "Missing required parameters: owner and repo" 
            });
        }
        
        const resolution = await services.processGitHubRepo(owner, repo, branch || 'main');
        res.json({
            success: true,
            message: "Repository processed successfully",
            ...resolution
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/process-file", async (req, res) => {
    try {
        const { content, path } = req.body;
        
        if (!path) {
            return res.status(400).json({ 
                success: false, 
                error: "Missing required parameter: path" 
            });
        }

        const resolution = await services.processFileContent(content || "", path);

        res.json({
            success: true,
            message: "Returned file summary successfully",
            data: resolution
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
