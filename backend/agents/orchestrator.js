const axios = require("axios");
const { parseGoal } = require("./goalParser");

const TASK_ENDPOINTS = {
    fetchData: "http://localhost:5000/fetch-salesforce-data",
    processData: "http://localhost:5000/process-data",
    analyzeData: "http://localhost:5000/analyze-data",
    generateReport: "http://localhost:5000/generate-report"
};

async function executeGoal(goal) {
    console.log(`🚀 Received goal: ${goal}`);

    const subtasks = await parseGoal(goal);
    
    if (!Array.isArray(subtasks)) {
        return { error: "Failed to parse goal into valid subtasks." };
    }

    console.log("✅ Executing Subtasks:", subtasks);

    const results = await executeSubtasks(subtasks);
    
    return { message: "Goal execution completed", results };
}

async function executeSubtasks(subtasks) {
    return await Promise.all(subtasks.map(async (task) => {
        const endpoint = TASK_ENDPOINTS[task.taskType];

        if (!endpoint) {
            return { result: "Failed", error: `No endpoint found for task type: ${task.taskType}` };
        }

        try {
            const response = await axios.post(endpoint, { task });
            return { result: "Success", data: response.data };
        } catch (error) {
            return { result: "Failed", error: error.message };
        }
    }));
}

// ✅ Ensure the function is exported properly
module.exports = { executeGoal, executeSubtasks };
