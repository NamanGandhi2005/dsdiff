// src/features/ai/aiSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// Import your API helper functions that call the Pi server
import {
  getDailyTipFromPi,
  summarizeTextOnPi,
  generateQuizFromNoteOnPi,
  generateNoteFromProblemOnPi, // You'll need to create this endpoint on Pi & helper in piServerApi.js
  explainDsaTopicOnPi          // You'll need to create this endpoint on Pi & helper in piServerApi.js
} from '../../api/piServerApi'; // Adjust this path to where your piServerApi.js is located

// --- Async Thunks calling the Pi Server ---

export const summarizeText = createAsyncThunk(
  'ai/summarizeText',
  async (text, { rejectWithValue }) => {
    try {
      const response = await summarizeTextOnPi(text); // Call Pi server
      return response.data.summary; // Assuming Pi server returns { summary: "..." }
    } catch (error) {
      console.error("Error summarizing text via Pi:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to summarize text via Pi server.');
    }
  }
);

export const generateNoteFromProblem = createAsyncThunk(
  'ai/generateNoteFromProblem',
  async (problemText, { rejectWithValue }) => {
    try {
      const response = await generateNoteFromProblemOnPi(problemText); // Call Pi server
      return response.data.noteContent; // Assuming Pi server returns { noteContent: "..." }
    } catch (error) {
      console.error("Error generating note from problem via Pi:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to generate note from problem via Pi server.');
    }
  }
);

export const explainDsaTopic = createAsyncThunk(
  'ai/explainDsaTopic',
  async (topicName, { rejectWithValue }) => {
    try {
      const response = await explainDsaTopicOnPi(topicName); // Call Pi server
      return response.data.explanation; // Assuming Pi server returns { explanation: "..." }
    } catch (error) {
      console.error("Error explaining topic via Pi:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to explain topic via Pi server.');
    }
  }
);

export const fetchDailyDsaTip = createAsyncThunk(
  'ai/fetchDailyDsaTip',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getDailyTipFromPi(); // Call Pi server
      return response.data.tip; // Assuming Pi server returns { tip: "..." }
    } catch (error) {
      console.error("Error fetching daily tip from Pi:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to fetch daily tip via Pi server.');
    }
  }
);

export const generateQuizFromNote = createAsyncThunk(
  'ai/generateQuizFromNote',
  async (noteContent, { rejectWithValue }) => {
    try {
      const response = await generateQuizFromNoteOnPi(noteContent); // Call Pi server
      // Pi server should already validate and return { quiz: [...] } or an error
      if (response.data && Array.isArray(response.data.quiz)) {
        return response.data.quiz;
      }
      console.error("Invalid quiz data structure from Pi server:", response.data);
      return rejectWithValue("Received invalid quiz data from Pi server.");
    } catch (error) {
      console.error("Error generating quiz via Pi:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to generate quiz via Pi server.');
    }
  }
);

// --- Initial State and Slice Definition ---
// This part remains the same as your last version of aiSlice.js

const initialState = {
  summary: '',
  generatedNote: '',
  explanation: '',
  dailyTip: '',
  quizQuestions: [],
  loading: {
    summarize: false,
    generateNote: false,
    explainTopic: false,
    dailyTip: false,
    generateQuiz: false,
  },
  error: {
    summarize: null,
    generateNote: null,
    explainTopic: null,
    dailyTip: null,
    generateQuiz: null,
  },
};

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    clearAiData: (state, action) => {
        const fieldToClear = action.payload;
        const dataField = fieldToClear; 
        const loadingField = fieldToClear;
        const errorField = fieldToClear;

        if (typeof fieldToClear === 'string' && state.hasOwnProperty(dataField)) {
            state[dataField] = initialState[dataField];
            if (state.loading && typeof state.loading === 'object' && state.loading.hasOwnProperty(loadingField)) {
                state.loading[loadingField] = false;
            }
            if (state.error && typeof state.error === 'object' && state.error.hasOwnProperty(errorField)) {
                state.error[errorField] = null;
            }
        } else if (fieldToClear === undefined) { 
            state.summary = initialState.summary;
            state.generatedNote = initialState.generatedNote;
            state.explanation = initialState.explanation;
            // state.dailyTip = initialState.dailyTip; // Optional: persist daily tip
            state.quizQuestions = initialState.quizQuestions;

            Object.keys(state.loading).forEach(key => { state.loading[key] = false; });
            Object.keys(state.error).forEach(key => { state.error[key] = null; });
        }
    }
  },
  extraReducers: (builder) => {
    const addThunkCases = (thunk, dataFieldKey, loadingFieldKey, errorFieldKey) => {
      builder
        .addCase(thunk.pending, (state) => {
          if (state.loading && typeof state.loading[loadingFieldKey] !== 'undefined') {
            state.loading[loadingFieldKey] = true;
          }
          if (state.error && typeof state.error[errorFieldKey] !== 'undefined') {
            state.error[errorFieldKey] = null;
          }
          if (dataFieldKey && typeof state[dataFieldKey] !== 'undefined') {
            state[dataFieldKey] = initialState[dataFieldKey];
          }
        })
        .addCase(thunk.fulfilled, (state, action) => {
          if (state.loading && typeof state.loading[loadingFieldKey] !== 'undefined') {
            state.loading[loadingFieldKey] = false;
          }
          if (dataFieldKey && typeof state[dataFieldKey] !== 'undefined') {
            state[dataFieldKey] = action.payload;
          }
        })
        .addCase(thunk.rejected, (state, action) => {
          if (state.loading && typeof state.loading[loadingFieldKey] !== 'undefined') {
            state.loading[loadingFieldKey] = false;
          }
          if (state.error && typeof state.error[errorFieldKey] !== 'undefined') {
            state.error[errorFieldKey] = action.payload;
          }
          if (dataFieldKey === 'quizQuestions' && typeof state[dataFieldKey] !== 'undefined') {
            state[dataFieldKey] = [];
          }
        });
    };

    addThunkCases(summarizeText, 'summary', 'summarize', 'summarize');
    addThunkCases(generateNoteFromProblem, 'generatedNote', 'generateNote', 'generateNote');
    addThunkCases(explainDsaTopic, 'explanation', 'explainTopic', 'explainTopic');
    addThunkCases(fetchDailyDsaTip, 'dailyTip', 'dailyTip', 'dailyTip');
    addThunkCases(generateQuizFromNote, 'quizQuestions', 'generateQuiz', 'generateQuiz');
  },
});

export const { clearAiData } = aiSlice.actions;
export default aiSlice.reducer;