const functions = require("firebase-functions");
const admin = require("firebase-admin");
require("dotenv").config(); // To load .env file for local development/emulation

admin.initializeApp();

const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

const API_KEY = functions.config().gemini?.api_key || process.env.GEMINI_API_KEY; // Use Firebase config or .env

let genAI;
let model;

if (!API_KEY) {
  console.error("FATAL ERROR: GEMINI_API_KEY is not set in Firebase Functions config or .env file. AI features will not work.");
} else {
  try {
    genAI = new GoogleGenerativeAI(API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Or "gemini-1.5-flash", "gemini-1.5-pro" etc.
    console.log("Gemini AI SDK initialized successfully.");
  } catch (e) {
    console.error("FATAL ERROR: Failed to initialize GoogleGenerativeAI. AI features will likely fail.", e);
    // genAI and model will remain undefined, functions using them should check
  }
}


// Safety settings for Gemini
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Helper to call Gemini
async function callGemini(prompt, isJson = false) {
  if (!model) { // Check if model was initialized
    console.error("callGemini: Gemini model is not initialized. Did API_KEY load correctly?");
    throw new functions.https.HttpsError("internal", "AI model is not initialized on the server.");
  }
  try {
    const generationConfig = {
      // temperature: 0.9, // Adjust as needed
      // topK: 1,
      // topP: 1,
      // maxOutputTokens: 2048, // Adjust as needed for different models/tasks
    };
    if (isJson) {
        // For gemini-pro, if you specifically need JSON, ensure your prompt also heavily guides it.
        // For newer models like gemini-1.5-pro, responseMimeType is more robust.
        // generationConfig.responseMimeType = "application/json"; // Enable if your model version supports it well
    }

    const result = await model.generateContent(prompt, {safetySettings, generationConfig}); // Pass safetySettings and generationConfig as an object
    const response = await result.response;
    const text = response.text(); // Get text content

    // If JSON is expected, try to parse it here to catch issues early
    // This is a basic check; robust JSON handling would be better if Gemini doesn't always output perfect JSON when asked.
    if (isJson) {
        try {
            JSON.parse(text); // Just to validate if it's parsable JSON
        } catch (e) {
            console.warn("callGemini: AI did not return valid JSON despite being asked. Prompt might need adjustment. Content:", text.substring(0, 200) + "...");
            // Decide if you want to throw an error here or let the calling function handle non-JSON
            // throw new functions.https.HttpsError("internal", "AI response was not valid JSON.");
        }
    }
    return text;

  } catch (error) {
    console.error("Error calling Gemini API within callGemini:", error);
    if (error.response && error.response.promptFeedback) {
      console.error("Prompt Feedback from Gemini:", error.response.promptFeedback);
      throw new functions.https.HttpsError(
          "failed-precondition",
          `Gemini API request failed due to content safety: ${JSON.stringify(error.response.promptFeedback)}`,
      );
    }
    // Ensure error.message exists, provide a fallback
    const errorMessage = error.message || "An unknown error occurred while communicating with the AI model.";
    throw new functions.https.HttpsError(
        "internal",
        `Failed to call Gemini API: ${errorMessage}`,
        error // Pass original error details if available
    );
  }
}

// Callable function for summarizing text
exports.geminiSummarizeText = functions.https.onCall(async (data, context) => {
  if (!API_KEY || !genAI || !model) {
    console.error("AI Service not initialized in geminiSummarizeText.");
    throw new functions.https.HttpsError('internal', 'AI service is not configured correctly on the server.');
  }
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
  }
  const textToSummarize = data.text;
  if (!textToSummarize || typeof textToSummarize !== 'string' || textToSummarize.trim().length < 20) {
    throw new functions.https.HttpsError("invalid-argument", "The function must be called with a 'text' argument containing at least 20 characters.");
  }

  const prompt = `Please summarize the following text concisely for a student studying Data Structures and Algorithms. Focus on the key concepts and takeaways:\n\n---\n${textToSummarize}\n---\n\nSummary:`;
  try {
    const summary = await callGemini(prompt);
    return { summary };
  } catch (error) {
    console.error("Error in geminiSummarizeText:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", error.message || "Failed to summarize text.");
  }
});

// Callable function for generating notes from a DSA problem
exports.geminiGenerateNoteFromProblem = functions.https.onCall(async (data, context) => {
  if (!API_KEY || !genAI || !model) {
    console.error("AI Service not initialized in geminiGenerateNoteFromProblem.");
    throw new functions.https.HttpsError('internal', 'AI service is not configured correctly on the server.');
  }
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
  }
  const problemText = data.problemText;
  if (!problemText || typeof problemText !== 'string' || problemText.trim().length < 50) {
    throw new functions.https.HttpsError("invalid-argument", "The function must be called with a 'problemText' argument containing at least 50 characters.");
  }

  const prompt = `You are an expert DSA tutor. A student has pasted the following DSA problem. Generate comprehensive study notes based on this problem. The notes should include:
1.  Problem Understanding: Briefly rephrase the problem.
2.  Key Concepts: Identify the main DSA concepts involved (e.g., arrays, sorting, dynamic programming, specific algorithms).
3.  Approach/Intuition: Explain a clear approach to solve the problem.
4.  Pseudo-code or Algorithm Steps: Provide clear steps or pseudo-code. If relevant, provide a code snippet in JavaScript or Python, clearly fenced with markdown (e.g., \`\`\`javascript ... \`\`\`).
5.  Complexity Analysis: Time and Space complexity.
6.  Edge Cases/Considerations: Any important edge cases or alternative solutions.

Format the output clearly using Markdown. Ensure headings are used for sections.

Problem:
---
${problemText}
---

Generated Notes:`;
  try {
    const noteContent = await callGemini(prompt);
    return { noteContent };
  } catch (error) {
    console.error("Error in geminiGenerateNoteFromProblem:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", error.message || "Failed to generate note from problem.");
  }
});

// Callable function for explaining a DSA topic
exports.geminiExplainTopic = functions.https.onCall(async (data, context) => {
  if (!API_KEY || !genAI || !model) {
    console.error("AI Service not initialized in geminiExplainTopic.");
    throw new functions.https.HttpsError('internal', 'AI service is not configured correctly on the server.');
  }
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
  }
  const topicName = data.topicName;
  if (!topicName || typeof topicName !== 'string' || topicName.trim() === '') {
    throw new functions.https.HttpsError("invalid-argument", "The function must be called with a non-empty 'topicName' argument.");
  }

  const prompt = `Explain the Data Structures and Algorithms topic: "${topicName}" in detail for a student.
Provide:
1.  A clear definition and the core intuition behind it.
2.  Common use cases or types of problems where it's applied.
3.  A simple, illustrative code example (JavaScript or Python preferred, clearly fenced with markdown, e.g., \`\`\`javascript ... \`\`\`) with a step-by-step walkthrough of the example.
4.  Time and Space complexity if applicable, with brief explanations.
5.  Key Advantages and Disadvantages or trade-offs.

Format for easy readability using Markdown. Use headings for each section.

Explanation for "${topicName}":`;
  try {
    const explanation = await callGemini(prompt);
    return { explanation };
  } catch (error) {
    console.error("Error in geminiExplainTopic:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", error.message || "Failed to explain topic.");
  }
});

// Callable function for getting a daily DSA tip
exports.geminiGetDailyTip = functions.https.onCall(async (data, context) => {
  if (!API_KEY || !genAI || !model) {
    console.error("AI Service not initialized in geminiGetDailyTip.");
    throw new functions.https.HttpsError('internal', 'AI service is not configured correctly on the server.');
  }
  const prompt = "Provide a concise, actionable, and motivational Data Structures and Algorithms (DSA) tip of the day for students preparing for technical interviews. The tip should be unique and insightful. Example: 'When stuck on a graph problem, try visualizing it with a small example. Often, the path becomes clearer when you see the connections.' Keep the tip to one or two sentences.";
  try {
    const tip = await callGemini(prompt);
    return { tip };
  } catch (error) {
    console.error("Error in geminiGetDailyTip:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", error.message || "Failed to fetch daily tip.");
  }
});

// Callable function for generating a quiz from note content
exports.geminiGenerateQuiz = functions.https.onCall(async (data, context) => {
  if (!API_KEY || !genAI || !model) {
    console.error("AI Service not initialized in geminiGenerateQuiz.");
    throw new functions.https.HttpsError('internal', 'AI service is not configured correctly on the server.');
  }
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
  }
  const text = data.text;
  if (!text || typeof text !== 'string' || text.trim().length < 50) {
    throw new functions.https.HttpsError("invalid-argument", "The function must be called with a 'text' argument containing at least 50 characters of note content.");
  }

  const prompt = `Based on the following DSA note content, generate 3-5 multiple-choice questions (MCQs).
Each MCQ **must** be a JSON object with the following **exact keys and value types**:
1.  "question": A string containing the question text.
2.  "options": An array of exactly 4 unique string values representing the multiple choice options (e.g., ["Option A", "Option B", "Option C", "Option D"]).
3.  "correctAnswer": A string that **exactly matches** one of the strings in the "options" array, indicating the correct answer.
4.  "explanation": A string briefly explaining why the "correctAnswer" is correct.

The final output **must be a valid JSON array** containing these MCQ objects. Do not include any text or formatting outside of this JSON array.

Example of a single MCQ object structure to follow:
{
  "question": "What is the time complexity of a binary search on a sorted array of N elements?",
  "options": ["O(N)", "O(log N)", "O(N log N)", "O(1)"],
  "correctAnswer": "O(log N)",
  "explanation": "Binary search divides the search interval in half at each step, leading to logarithmic time complexity."
}

DSA Note Content:
---
${text}
---

Strictly return **only** the JSON array of MCQ objects:
`;

  console.log("GEMINI QUIZ PROMPT (Sent to AI):\n", prompt);

  let quizJsonString;
  try {
    quizJsonString = await callGemini(prompt, true); // Requesting JSON, but Gemini might not always comply perfectly.
  } catch (error) {
      console.error("Error from callGemini inside geminiGenerateQuiz:", error);
      if (error instanceof functions.https.HttpsError) throw error; // Re-throw if already HttpsError
      throw new functions.https.HttpsError("internal", error.message || "Failed to get response from AI for quiz generation.");
  }

  console.log("GEMINI QUIZ RAW RESPONSE (Received from AI):\n", quizJsonString);

  try {
    // Attempt to clean common non-JSON prefixes/suffixes (like markdown code fences)
    const cleanedJsonString = quizJsonString.replace(/^```json\s*([\s\S]*?)\s*```$/s, '$1').trim();
    const parsedResponse = JSON.parse(cleanedJsonString);

    if (!Array.isArray(parsedResponse)) {
      console.error("Gemini response for quiz is not an array after parsing:", parsedResponse);
      throw new Error("AI response for quiz was not an array.");
    }

    const validatedQuiz = parsedResponse.filter(q => {
      const isValid = q &&
             typeof q.question === 'string' && q.question.trim() !== '' &&
             Array.isArray(q.options) &&
             q.options.length >= 2 && // At least 2 options
             q.options.every(opt => typeof opt === 'string' && opt.trim() !== '') &&
             typeof q.correctAnswer === 'string' && q.correctAnswer.trim() !== '' &&
             q.options.includes(q.correctAnswer) &&
             typeof q.explanation === 'string' && q.explanation.trim() !== '';
      if (!isValid) {
        console.warn("Malformed question object from AI, filtering out:", JSON.stringify(q));
      }
      return isValid;
    });

    if (validatedQuiz.length === 0 && parsedResponse.length > 0) {
      console.error("All question objects from AI were malformed or filtered out. Original parsed count:", parsedResponse.length);
      throw new Error("AI returned malformed question objects; none were valid after validation.");
    }
    // If validatedQuiz is empty (either AI returned nothing or all were filtered), it will be sent as an empty array.
    
    console.log("VALIDATED QUIZ (Sent to client):\n", JSON.stringify(validatedQuiz));
    return { quiz: validatedQuiz };

  } catch (e) {
    console.error(
        "Failed to parse JSON from Gemini for quiz or validation failed:",
        e.message,
        "\nReceived string (raw):\n", quizJsonString.substring(0, 500) + "...",
        "\nCleaned string attempt:\n", (typeof cleanedJsonString !== 'undefined' ? cleanedJsonString.substring(0,500) + "..." : "N/A")
    );
    throw new functions.https.HttpsError("internal", `Failed to process AI response for quiz. ${e.message}`);
  }
});