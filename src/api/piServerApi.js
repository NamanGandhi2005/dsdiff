// src/api/piServerApi.js
import axios from 'axios';

// Use environment variable or fallback to local port 3001
const PI_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: PI_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- AI Service Calls ---
export const getDailyTipFromPi = () => apiClient.post('/api/daily-tip'); // POST request
export const summarizeTextOnPi = (text) => apiClient.post('/api/summarize', { text });
export const generateQuizFromNoteOnPi = (noteContent) => apiClient.post('/api/generate-quiz', { text: noteContent });
export const generateNoteFromProblemOnPi = (problemText) => apiClient.post('/api/generate-note-from-problem', { problemText }); 
export const explainDsaTopicOnPi = (topicName) => apiClient.post('/api/explain-topic', { topicName }); 
export const fetchLeetCodeProblem = (problemId) => apiClient.post('/api/leetcode-problem', { problemId }); 

// You might want to add error handling interceptors to apiClient if needed
export default apiClient;