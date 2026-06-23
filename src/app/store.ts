import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import notesReducer from '../features/notes/notesSlice';
import themeReducer from '../features/theme/themeSlice';
import topicsReducer from '../features/dsaTopics/topicsSlice';
import aiReducer from '../features/ai/aiSlice'; // Ensure this is imported

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notes: notesReducer,
    theme: themeReducer,
    topics: topicsReducer,
    ai: aiReducer, // Add the AI reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for non-serializable Firebase Timestamps
        ignoredActions: [
          'notes/fetchNotes/fulfilled', 'notes/addNote/fulfilled', 'notes/updateNote/fulfilled',
          'auth/listenToAuthChanges/fulfilled', // If user object contains non-serializable data
          'auth/signInWithGoogle/fulfilled',
          'auth/signInWithEmail/fulfilled',
          'auth/signUpWithEmail/fulfilled',
        ],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['meta.arg', 'payload.createdAt', 'payload.updatedAt', 'payload.user.stsTokenManager', 'payload.user.providerData'],
        // Ignore these paths in the state (especially for notes with Timestamps)
        ignoredPaths: [
            'notes.notesList', 'notes.currentNote',
            'auth.user.stsTokenManager', 'auth.user.providerData' // Firebase user object has non-serializable parts
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;