// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const axios = require('axios');

const app = express();
const PORT = process.env.PI_SERVER_PORT || 3001;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
    console.error("FATAL ERROR: GROQ_API_KEY is not set in the .env file.");
    process.exit(1);
} else {
    console.log("Groq API configuration initialized successfully.");
}

// Middleware
const allowedOrigins = [
    'http://localhost:3000',
    'http://192.168.1.38:3000',
    'https://dsdiff.web.app',
    'https://dsa-notes-app.web.app',
    'https://dsdiff.com',
    'https://www.dsdiff.com'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            console.warn(`CORS: Origin ${origin} not allowed.`);
            callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
    }
}));
// Increase the limit for JSON body parser to handle potentially large note content
app.use(express.json({ limit: '5mb' }));

// --- Helper to call Groq API (aliased as callGeminiOnPi for route compatibility) ---
const FALLBACK_GROQ_MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"];

async function callGeminiOnPi(prompt, isJson = false) {
    if (!GROQ_API_KEY) {
        console.error("callGroq: GROQ_API_KEY is not defined in the environment.");
        throw new Error("Groq API key is not configured on the server.");
    }

    let lastError = null;

    for (const modelName of FALLBACK_GROQ_MODELS) {
        try {
            console.log(`[callGroq] Attempting Groq model: ${modelName}`);
            
            const requestBody = {
                model: modelName,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.3
            };

            if (isJson) {
                requestBody.response_format = { type: "json_object" };
            }

            const response = await axios.post(
                "https://api.groq.com/openai/v1/chat/completions",
                requestBody,
                {
                    headers: {
                        "Authorization": `Bearer ${GROQ_API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    timeout: 45000 // 45 seconds timeout
                }
            );

            let text = response.data.choices[0].message.content;
            console.log(`[callGroq] Received response from ${modelName} (length ${text?.length || 0})`);

            if (isJson) {
                let processedText = text.trim();
                const markdownMatch = processedText.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/s);
                if (markdownMatch && markdownMatch[1]) {
                    processedText = markdownMatch[1].trim();
                }
                try {
                    JSON.parse(processedText);
                    return processedText;
                } catch (e) {
                    console.error(`[callGroq] FAILED to parse processed text as JSON for model ${modelName}. Error:`, e.message);
                    throw new Error("AI response was not in a valid JSON format after processing.");
                }
            }
            return text;
        } catch (error) {
            const errorMsg = error.response?.data?.error?.message || error.message;
            console.warn(`[callGroq] Failed with model ${modelName}:`, errorMsg);
            lastError = error;
            // Fallback to next model in loop
        }
    }

    // If all models failed, handle and log the last error
    console.error("Error calling Groq API from server after trying all models:", lastError?.response?.data || lastError?.message);
    const errorMessage = lastError?.response?.data?.error?.message || lastError?.message || "Failed to query Groq API after trying all fallback models.";
    throw new Error(errorMessage);
}

// --- API Endpoints ---

app.post('/api/daily-tip', async (req, res) => {
    // ... (This endpoint remains the same)
    console.log(`[${new Date().toISOString()}] POST /api/daily-tip received`);
    const prompt = "Provide a concise, actionable, and motivational Data Structures and Algorithms (DSA) tip of the day for students preparing for technical interviews. The tip should be unique and insightful. Example: 'When stuck on a graph problem, try visualizing it with a small example. Often, the path becomes clearer when you see the connections.' Keep the tip to one or two sentences.";
    try {
        const tip = await callGeminiOnPi(prompt);
        res.json({ tip });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error in /api/daily-tip:`, error.message);
        res.status(500).json({ error: error.message || "Failed to fetch daily tip from AI." });
    }
});

app.post('/api/summarize', async (req, res) => {
    // ... (This endpoint remains the same)
    const { text } = req.body;
    console.log(`[${new Date().toISOString()}] POST /api/summarize received. Text length: ${text?.length}`);
    if (!text || typeof text !== 'string' || text.trim().length < 20) {
        return res.status(400).json({ error: "Text for summarization must be a string with at least 20 characters." });
    }
    const prompt = `Please summarize the following text concisely for a student studying Data Structures and Algorithms. Focus on the key concepts and takeaways:\n\n---\n${text}\n---\n\nSummary:`;
    try {
        const summary = await callGeminiOnPi(prompt);
        res.json({ summary });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error in /api/summarize:`, error.message);
        res.status(500).json({ error: error.message || "Failed to summarize text." });
    }
});

app.post('/api/generate-quiz', async (req, res) => {
    // ... (This endpoint remains the same)
    const { text } = req.body;
    console.log(`[${new Date().toISOString()}] POST /api/generate-quiz received. Text length: ${text?.length}`);
    if (!text || typeof text !== 'string' || text.trim().length < 50) {
        return res.status(400).json({ error: "Note content for quiz generation must be a string with at least 50 characters." });
    }
    const prompt = `Based on the following DSA note content, generate 3-5 multiple-choice questions (MCQs). Each MCQ **must** be a JSON object with the following **exact keys and value types**: 1. "question": A string. 2. "options": An array of 4 unique strings. 3. "correctAnswer": A string that **exactly matches** one of the strings in the "options" array. 4. "explanation": A string. The final output **must be a valid JSON array** of these objects. Do not include any text outside this array. Example: { "question": "Time complexity of binary search?", "options": ["O(N)", "O(log N)", "O(N log N)", "O(1)"], "correctAnswer": "O(log N)", "explanation": "It halves the search space." } DSA Note Content:\n---\n${text}\n---\nStrictly return **only** the JSON array of MCQ objects:`;
    let jsonOutputFromGemini = "";
    try {
        jsonOutputFromGemini = await callGeminiOnPi(prompt, true);
        const parsedResponse = JSON.parse(jsonOutputFromGemini);
        if (!Array.isArray(parsedResponse)) { throw new Error("AI response for quiz was not an array after parsing."); }
        const validatedQuiz = parsedResponse.filter(q => q && typeof q.question === 'string' && Array.isArray(q.options) && q.options.length >= 2 && q.options.every(opt => typeof opt === 'string') && typeof q.correctAnswer === 'string' && q.options.includes(q.correctAnswer) && typeof q.explanation === 'string');
        if (validatedQuiz.length === 0 && parsedResponse.length > 0) { throw new Error("AI returned malformed question objects; none were valid after validation."); }
        res.json({ quiz: validatedQuiz });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error in /api/generate-quiz:`, error.message, "\nString that led to error:\n", jsonOutputFromGemini ? jsonOutputFromGemini.substring(0, 500) + "..." : "N/A");
        res.status(500).json({ error: `Failed to generate quiz. ${error.message}` });
    }
});

app.post('/api/generate-note-from-problem', async (req, res) => {
    // ... (This endpoint remains the same)
    const { problemText } = req.body;
    console.log(`[${new Date().toISOString()}] POST /api/generate-note-from-problem. Text length: ${problemText?.length}`);
    if (!problemText || typeof problemText !== 'string' || problemText.trim().length < 50) {
        return res.status(400).json({ error: "Problem text must be a string with at least 50 characters." });
    }
    const prompt = `You are an expert Data Structures and Algorithms (DSA) tutor and technical writer. 
Generate comprehensive, high-quality, structured study notes in Markdown format for the following problem. 
The notes must include:
1. **Problem Analysis**: A clear explanation of what the problem is asking in simple terms, identifying the key constraints and edge cases.
2. **Intuition & Approach**: Detail how to think about the problem, from the brute force approach to the optimal approach. Explain why the optimal approach is chosen.
3. **Algorithm Design & Dry Run**: Step-by-step logic of the optimal algorithm, followed by a quick trace/dry-run using a small example input.
4. **Code Implementation**: Provide clean, production-grade, well-commented code in a standard programming language (like C++, Java, Python, or JavaScript). Use code block syntax highlighting.
5. **Complexity Analysis**: Explicitly explain both the Time Complexity and Space Complexity using Big O notation, detailing the reasons behind them.
6. **Key Patterns & Takeaways**: Highlight general concepts or patterns used (e.g. Sliding Window, Two Pointers, Backtracking) that can be applied to other similar problems.

Make the tone encouraging, technical, and precise.

Problem Statement and Context:
---
${problemText}
---
Generated Notes:`;
    try {
        const noteContent = await callGeminiOnPi(prompt);
        res.json({ noteContent });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error in /api/generate-note-from-problem:`, error.message);
        res.status(500).json({ error: error.message || "Failed to generate note from problem." });
    }
});

app.post('/api/leetcode-problem', async (req, res) => {
    const { problemId } = req.body;
    console.log(`[${new Date().toISOString()}] POST /api/leetcode-problem received. ID: ${problemId}`);
    if (!problemId) {
        return res.status(400).json({ error: "Problem ID or Slug is required." });
    }
    try {
        const response = await axios.get(`https://leetcode-api-pied.vercel.app/problem/${encodeURIComponent(problemId)}`);
        if (response.data && response.data.title) {
            res.json({
                title: response.data.title,
                content: response.data.content, // HTML description
                difficulty: response.data.difficulty,
                tags: response.data.tags || [],
                problemId: response.data.questionFrontendId || problemId
            });
        } else {
            console.error("Invalid response from LeetCode API wrapper:", response.data);
            res.status(404).json({ error: `LeetCode problem "${problemId}" not found or empty response.` });
        }
    } catch (error) {
        console.error("Error fetching Leetcode problem:", error.message);
        res.status(500).json({ error: `Failed to fetch LeetCode problem details: ${error.message}` });
    }
});

app.post('/api/explain-topic', async (req, res) => {
    // ... (This endpoint remains the same)
    const { topicName } = req.body;
    console.log(`[${new Date().toISOString()}] POST /api/explain-topic. Topic: ${topicName}`);
    if (!topicName || typeof topicName !== 'string' || topicName.trim() === '') {
        return res.status(400).json({ error: "Topic name cannot be empty." });
    }
    const prompt = `You are an expert Data Structures and Algorithms (DSA) tutor.
Explain the following topic in depth and clarity, suitable for students preparing for FAANG+ technical interviews.
Topic: "${topicName}"

Your explanation must be formatted in Markdown and include:
1. **Overview & High-Level Concept**: What is it? Why do we use it? Real-world analogies.
2. **Core Mechanics & Visual Representation**: How does it work step-by-step? (Use ASCII diagrams or flowcharts if appropriate).
3. **Key Operations & Complexity**: Detail standard operations (e.g., insert, delete, search, traverse) with their Time and Space complexities.
4. **Common Patterns & Use Cases**: When should a student recognize this topic as the correct tool? What standard interview problems use it?
5. **Code Example**: A clean, fully commented implementation (e.g., custom class, utility function, or algorithm) in Python, Java, or C++.
6. **Common Pitfalls & Pro-Tips**: What mistakes do candidates make in interviews? What are the key optimizations?

Keep the explanation clear, professional, and structured.

Explanation for "${topicName}":`;
    try {
        const explanation = await callGeminiOnPi(prompt);
        res.json({ explanation });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error in /api/explain-topic:`, error.message);
        res.status(500).json({ error: error.message || "Failed to explain topic." });
    }
});

// --- NEW ENDPOINT FOR PROPER PDF EXPORT ---
app.post('/api/export-pdf', async (req, res) => {
    const { htmlContent, noteTitle } = req.body;

    if (!htmlContent) {
        return res.status(400).json({ error: 'HTML content is required.' });
    }

    console.log(`[${new Date().toISOString()}] POST /api/export-pdf received for title: ${noteTitle}`);

    let browser;
    try {
        // Launch Puppeteer. The 'args' are often needed for running in server/docker/pi environments.
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            // For Raspberry Pi, if the bundled Chromium download fails or has issues,
            // you might need to install Chromium via apt-get and specify the path:
            // executablePath: '/usr/bin/chromium-browser', 
        });
        
        const page = await browser.newPage();

        // Construct a full HTML document to provide context and styles to Puppeteer.
        const fullHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>${noteTitle || 'Note'}</title>
                
                <!-- Link to Quill's Snow theme CSS to render formatting correctly -->
                <link rel="stylesheet" href="https://cdn.quilljs.com/1.3.6/quill.snow.css">

                <!-- Link to a syntax highlighting theme CSS for code blocks -->
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
                
                <style>
                    /* Basic styles for print-friendly PDF output */
                    body { 
                        font-family: 'Helvetica', 'Arial', sans-serif;
                        -webkit-print-color-adjust: exact; /* Crucial for backgrounds in PDF */
                    }
                    /* The ql-editor class provides the base styling for Quill content */
                    .ql-editor {
                        padding: 0 !important; /* Override editor padding for a clean page */
                        font-size: 11pt;
                        line-height: 1.5;
                    }
                    /* Style Quill's code blocks specifically for the PDF */
                    .ql-syntax {
                        background-color: #282c34 !important; /* atom-one-dark background */
                        color: #abb2bf !important;
                        padding: 1em !important;
                        border-radius: 5px !important;
                        white-space: pre-wrap !important;   /* Allow code to wrap */
                        word-wrap: break-word !important;   /* Break long words */
                        font-size: 9pt !important;
                    }
                </style>
            </head>
            <body class="ql-snow">
                <h1>${noteTitle || 'Note'}</h1>
                <hr />
                <div class="ql-editor">${htmlContent}</div>
            </body>
            </html>
        `;

        await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true, // Renders background colors and images
            margin: { top: '1in', right: '1in', bottom: '1in', left: '1in' }
        });

        await browser.close();

        const filename = `${noteTitle?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'note'}.pdf`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/pdf');
        res.send(pdfBuffer);

        console.log(`[${new Date().toISOString()}] PDF generated successfully for: ${noteTitle}`);

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error generating PDF on server:`, error);
        if (browser) await browser.close(); // Ensure browser is closed on error
        res.status(500).json({ error: `Failed to generate PDF. ${error.message}` });
    }
});


const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';

app.listen(PORT, HOST, () => {
    console.log(`dsdiff API Server running on http://${HOST}:${PORT} (bound to ${HOST === '127.0.0.1' ? 'this device only' : 'all interfaces'})`);
});