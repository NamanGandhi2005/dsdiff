// src/features/notes/notesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  // Timestamp, // Not directly used if serverTimestamp is preferred for top-level
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase'; // Ensure this path is correct

// Helper to convert Firestore Timestamps (or JS Dates) to ISO string for Redux state
const serializeNote = (note) => {
  const serializeTimestamp = (ts) => {
    if (!ts) return new Date().toISOString(); // Fallback if timestamp is missing
    if (ts.toDate) return ts.toDate().toISOString(); // Firestore Timestamp
    if (ts instanceof Date) return ts.toISOString(); // JavaScript Date
    if (typeof ts === 'string') return ts; // Already a string (hopefully ISO)
    return new Date().toISOString(); // Default fallback
  };

  return {
    ...note,
    createdAt: serializeTimestamp(note.createdAt),
    updatedAt: serializeTimestamp(note.updatedAt),
    versionHistory: note.versionHistory?.map(v => ({
      ...v,
      timestamp: serializeTimestamp(v.timestamp),
    })) || [],
  };
};

export const fetchNotes = createAsyncThunk(
  'notes/fetchNotes',
  async (userId, { rejectWithValue }) => {
    if (!userId) {
        console.error("fetchNotes: User ID is required");
        return rejectWithValue('User ID is required');
    }
    try {
      const notesQuery = query(
        collection(db, 'notes'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc') // This query requires an index on (userId, updatedAt DESC)
      );
      const querySnapshot = await getDocs(notesQuery);
      const notes = querySnapshot.docs.map(docSnapshot => serializeNote({ id: docSnapshot.id, ...docSnapshot.data() }));
      return notes;
    } catch (error) {
      console.error("fetchNotes error:", error);
      return rejectWithValue(error.message || 'Failed to fetch notes.');
    }
  }
);

export const addNote = createAsyncThunk(
  'notes/addNote',
  async ({ userId, title, content, tags }, { rejectWithValue }) => {
    // console.log("ADDNOTE THUNK (LOG A): Received data:", { userId, title, tagsCount: tags?.length }); // Keep your logs
    if (!userId) {
      // console.error("ADDNOTE THUNK ERROR (LOG B): User ID is missing!");
      return rejectWithValue('User ID is required for adding a note.');
    }
    if (!title || !title.trim()) {
      // console.error("ADDNOTE THUNK ERROR (LOG C): Title is missing or empty!");
      return rejectWithValue('Note title cannot be empty.');
    }

    try {
      const clientSideTimestamp = new Date(); // Generate timestamp on the client for the initial version

      const noteDataToSave = {
        userId,
        title: title.trim(),
        content: content || '',
        tags: tags || [],
        createdAt: serverTimestamp(), // For the main document creation time
        updatedAt: serverTimestamp(), // For the main document update time
        versionHistory: [{
          content: content || '',
          timestamp: clientSideTimestamp // Use client-side Date object here for Firestore
        }],
      };
      // console.log("ADDNOTE THUNK (LOG D): Data being prepared for Firestore:", noteDataToSave);

      const docRef = await addDoc(collection(db, 'notes'), noteDataToSave);
      // console.log("ADDNOTE THUNK (LOG E): Note added successfully to Firestore with ID:", docRef.id);

      // Construct a serializable object for the Redux state.
      const newNoteForState = {
        id: docRef.id,
        userId,
        title: noteDataToSave.title,
        content: noteDataToSave.content,
        tags: noteDataToSave.tags,
        // Use the same client-side timestamp for initial Redux state, then serialize
        createdAt: clientSideTimestamp,
        updatedAt: clientSideTimestamp,
        versionHistory: [{
          content: noteDataToSave.content,
          timestamp: clientSideTimestamp
        }],
      };
      return serializeNote(newNoteForState); // serializeNote will convert Dates to ISO strings
    } catch (error) {
      // console.error("ADDNOTE THUNK FIRESTORE ERROR (LOG F):", error);
      const errorMessage = error.message || 'Failed to save note to Firestore.';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateNote = createAsyncThunk(
  'notes/updateNote',
  async ({ id, title, content, tags, existingVersionHistory, userId }, { rejectWithValue }) => {
    if (!id) return rejectWithValue('Note ID is required for update.');
    if (!userId) return rejectWithValue('User ID is required for update context.');

    try {
      const noteRef = doc(db, 'notes', id);
      const clientSideTimestampForNewVersion = new Date(); // Use client Date for the new version entry

      const newVersionEntry = {
        content: content || '',
        timestamp: clientSideTimestampForNewVersion // This will be stored as a Firestore Timestamp
      };

      // Process existing history: if timestamps are ISO strings from Redux, convert to Date objects for Firestore.
      // Firestore can handle Date objects directly and converts them to its Timestamp type.
      const processedExistingHistory = (existingVersionHistory || []).map(v => ({
          content: v.content,
          // If v.timestamp is already a Date or Firestore Timestamp, it's fine.
          // If it's an ISO string (from Redux state after serializeNote), convert to Date.
          timestamp: (typeof v.timestamp === 'string') ? new Date(v.timestamp) : v.timestamp
      }));

      const updatedVersionHistoryForFirestore = [...processedExistingHistory, newVersionEntry].slice(-10);

      await updateDoc(noteRef, {
        title: title.trim(),
        content: content || '',
        tags: tags || [],
        updatedAt: serverTimestamp(), // For the main document update time
        versionHistory: updatedVersionHistoryForFirestore, // Array of objects with Date/Timestamp objects
      });

      // For Redux state, construct with client-side timestamp and then serialize
      const updatedNoteForState = {
        id,
        title: title.trim(),
        content: content || '',
        tags: tags || [],
        userId,
        updatedAt: clientSideTimestampForNewVersion, // Use the new version's timestamp for Redux `updatedAt`
        // Re-serialize the version history for Redux
        versionHistory: updatedVersionHistoryForFirestore.map(v => ({
            content: v.content,
            timestamp: v.timestamp // This will be a Date object, serializeNote will handle it
        })),
        // We need createdAt. If not passed, we'd ideally fetch the note or pass it.
        // For simplicity, if existingVersionHistory is not empty, use its first entry's timestamp as createdAt.
        // This is an approximation if createdAt isn't explicitly managed/passed for the Redux update.
        createdAt: existingVersionHistory && existingVersionHistory.length > 0 ? existingVersionHistory[0].timestamp : clientSideTimestampForNewVersion,
      };
      return serializeNote(updatedNoteForState);
    } catch (error) {
      console.error("UPDATENOTE THUNK FIRESTORE ERROR:", error);
      return rejectWithValue(error.message || 'Failed to update note.');
    }
  }
);

export const deleteNote = createAsyncThunk(
  'notes/deleteNote',
  async (noteId, { rejectWithValue }) => {
    if (!noteId) return rejectWithValue('Note ID is required for deletion.');
    try {
      await deleteDoc(doc(db, 'notes', noteId));
      return noteId; // Return the ID of the deleted note
    } catch (error) {
      console.error("DELETENOTE THUNK FIRESTORE ERROR:", error);
      return rejectWithValue(error.message || 'Failed to delete note.');
    }
  }
);

const initialState = {
  notesList: [],
  currentNote: null,
  // Standardize loading and error states to be booleans/strings directly
  // instead of nested objects, if preferred for easier management.
  // For now, keeping your structure.
  loading: false, // Generic loading for the slice, can be made more granular
  error: null,    // Generic error for the slice
  filters: {
    searchTerm: '',
    tags: [],
    topic: '',
    dateRange: null,
  }
};

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    setCurrentNote: (state, action) => {
      // Find from notesList. If notesList is not typed, action.payload could be anything.
      // Assuming action.payload is the noteId string.
      state.currentNote = state.notesList.find(note => note.id === action.payload) || null;
    },
    clearCurrentNote: (state) => {
      state.currentNote = null;
    },
    setSearchTerm: (state, action) => {
      state.filters.searchTerm = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchNotes
      .addCase(fetchNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.notesList = action.payload; // Payload should be an array of serialized notes
        state.loading = false;
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload; // Payload is the error message from rejectWithValue
      })

      // addNote
      .addCase(addNote.pending, (state) => {
          state.loading = true; // Or a specific loading flag like state.loading.add = true
          state.error = null;
      })
      .addCase(addNote.fulfilled, (state, action) => {
        state.notesList.unshift(action.payload); // action.payload is the serialized new note
        state.loading = false;
        state.error = null;
      })
      .addCase(addNote.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
      })

      // updateNote
      .addCase(updateNote.pending, (state) => {
          state.loading = true;
          state.error = null;
      })
      .addCase(updateNote.fulfilled, (state, action) => {
        const index = state.notesList.findIndex(note => note.id === action.payload.id);
        if (index !== -1) {
          state.notesList[index] = action.payload; // action.payload is the serialized updated note
        }
        if (state.currentNote?.id === action.payload.id) {
            state.currentNote = action.payload;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(updateNote.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
      })

      // deleteNote
       .addCase(deleteNote.pending, (state) => {
          state.loading = true;
          state.error = null;
      })
      .addCase(deleteNote.fulfilled, (state, action) => { // action.payload is the noteId
        state.notesList = state.notesList.filter(note => note.id !== action.payload);
        if (state.currentNote?.id === action.payload) {
            state.currentNote = null;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(deleteNote.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
      });
      // The generic matcher for rejected actions is removed because each thunk now has its own .rejected case.
  },
});

export const { setCurrentNote, clearCurrentNote, setSearchTerm } = notesSlice.actions;
export default notesSlice.reducer;