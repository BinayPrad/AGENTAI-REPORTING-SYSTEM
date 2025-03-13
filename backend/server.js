const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config(); // Load environment variables

const { executeGoal, executeSubtasks } = require("./agents/orchestrator");

const app = express();
const PORT = 5000;

app.use(cors({
    origin: "http://localhost:3000",  // Allow frontend origin
    methods: ["GET", "POST", "OPTIONS"], // Allowed methods
    allowedHeaders: ["Content-Type", "Authorization"] // Allowed headers
}));
app.use(bodyParser.json());

// 👉 Execute goal and subtasks
app.post("/execute-goal", async (req, res) => {
    try {
        const { goal } = req.body;
        if (!goal) return res.status(400).json({ error: "Goal is required." });

        const result = await executeGoal(goal);
        res.json(result);
    } catch (error) {
        console.error("❌ Error executing goal:", error.message);
        res.status(500).json({ error: "Failed to execute goal." });
    }
});

// 👉 Fetch Salesforce data using Power Automate
app.post("/fetch-salesforce-data", async (req, res) => {
    try {
        console.log("🔍 Fetching Salesforce data...");

        const powerAutomateURL = process.env.POWER_AUTOMATE_URL;
        if (!powerAutomateURL) throw new Error("Missing Power Automate URL in .env");

        const response = await axios.post(powerAutomateURL, {
            soqlQuery: "SELECT Id, Name, Amount, CloseDate FROM Opportunity WHERE CloseDate = LAST_QUARTER"
        });

        if (!response.data || !response.data.records) {
            throw new Error("Invalid response format from Power Automate");
        }

        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error("❌ Error fetching Salesforce data:", error.message);
        res.status(500).json({ error: "Failed to fetch Salesforce data." });
    }
});

// 👉 Process and clean data
app.post("/process-data", (req, res) => {
    try {
        console.log("🔍 Processing data...");
        const { data } = req.body;

        if (!data) return res.status(400).json({ error: "No data provided." });

        // Simulating data processing
        const cleanedData = data.map(entry => ({
            ...entry,
            processed: true
        }));

        res.json({ success: true, data: cleanedData });
    } catch (error) {
        console.error("❌ Error processing data:", error.message);
        res.status(500).json({ error: "Failed to process data." });
    }
});

// 👉 Analyze data for insights
app.post("/analyze-data", (req, res) => {
    try {
        console.log("🔍 Analyzing data...");
        const { data } = req.body;

        if (!data) return res.status(400).json({ error: "No data provided." });

        // Simulated analysis
        const insights = {
            totalSales: data.reduce((sum, entry) => sum + (entry.Amount || 0), 0),
            topRegion: "North America"
        };

        res.json({ success: true, insights });
    } catch (error) {
        console.error("❌ Error analyzing data:", error.message);
        res.status(500).json({ error: "Failed to analyze data." });
    }
});

// 👉 Generate report using OpenAI
app.post("/generate-report", async (req, res) => {
    try {
        console.log("📊 Generating report...");
        const { insights } = req.body;

        if (!insights) return res.status(400).json({ error: "No insights provided." });

        const openaiAPIKey = process.env.OPENAI_API_KEY;
        if (!openaiAPIKey) throw new Error("Missing OpenAI API key in .env");

        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4",
                messages: [
                    { role: "system", content: "Generate a structured report based on the provided sales insights." },
                    { role: "user", content: `Create a Q3 sales report based on these insights: ${JSON.stringify(insights)}` }
                ]
            },
            {
                headers: {
                    Authorization: `Bearer ${openaiAPIKey}`,
                    "Content-Type": "application/json"
                }
            }
        );

        res.json({ success: true, report: response.data.choices[0].message.content });
    } catch (error) {
        console.error("❌ Error generating report:", error.message);
        res.status(500).json({ error: "Failed to generate report." });
    }
});

// 👉 Execute subtasks
app.post("/execute-subtasks", async (req, res) => {
    try {
        const { subtasks } = req.body;
        if (!subtasks || !Array.isArray(subtasks)) {
            throw new Error("Invalid subtasks format");
        }

        const results = await executeSubtasks(subtasks);
        res.json({ success: true, results });
    } catch (error) {
        console.error("❌ Error executing subtasks:", error.message);
        res.status(500).json({ error: "Failed to execute subtasks." });
    }
});

// 👉 Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
