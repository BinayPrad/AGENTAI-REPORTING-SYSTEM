const axios = require("axios");
require("dotenv").config(); // Load environment variables from .env

async function parseGoal(goal) {
    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You are an AI that breaks down a user's goal into structured subtasks. Respond ONLY in JSON format with a `goal` and `subtasks` array."
                    },
                    { role: "user", content: `Break down this goal into subtasks: ${goal}` }
                ],
                temperature: 0.2
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const rawContent = response.data.choices[0].message.content;

        console.log("🔍 Raw OpenAI Response:", rawContent);

        // Ensure response is properly formatted JSON
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(rawContent);
        } catch (parseError) {
            console.error("🚨 Failed to parse OpenAI response.");
            return { error: "OpenAI response is not structured correctly." };
        }

        if (!parsedResponse.subtasks || !Array.isArray(parsedResponse.subtasks)) {
            console.error("🚨 OpenAI response does not contain a valid `subtasks` array.");
            return { error: "OpenAI response is not structured correctly." };
        }

        console.log("✅ Subtasks Parsed:", parsedResponse.subtasks);

        // Assign task types dynamically
        const enhancedSubtasks = parsedResponse.subtasks.map((subtask, index) => ({
            taskId: `task-${index + 1}`,
            taskName: subtask,
            taskType: determineTaskType(subtask)
        }));

        console.log("✅ Enhanced Subtasks:", enhancedSubtasks);

        return enhancedSubtasks;
    } catch (error) {
        console.error("❌ Error parsing goal:", error.message);
        return { error: "Failed to parse goal." };
    }
}

function determineTaskType(subtask) {
    const keywords = {
        fetchData: ["Identify", "Gather", "Retrieve", "Fetch", "Extract", "Collect"],
        processData: ["Sort", "Organize", "Clean", "Structure", "Filter", "Categorize"],
        analyzeData: ["Calculate", "Analyze", "Evaluate", "Compare", "Assess"],
        generateReport: ["Prepare", "Compile", "Summarize", "Draft", "Review", "Finalize", "Submit", "Adjust", "Conclusions", "Recommendations"]
    };

    for (const [taskType, words] of Object.entries(keywords)) {
        if (words.some(word => subtask.toLowerCase().includes(word.toLowerCase()))) {
            return taskType;
        }
    }

    return "processData"; // Default to `processData` instead of `unknown`
}

module.exports = { parseGoal };

