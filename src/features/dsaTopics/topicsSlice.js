import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

// Sample DSA Topics (can be seeded or managed via an admin interface)
const initialDSATopics = [
  { id: "arrays", name: "Arrays & Hashing", description: "Fundamental data structure for storing collections.", solvedCount: 0, totalProblems: 10 },
  { id: "two-pointers", name: "Two Pointers", description: "Technique using two pointers to iterate through data.", solvedCount: 0, totalProblems: 8 },
  { id: "sliding-window", name: "Sliding Window", description: "Algorithm pattern for processing subarrays/substrings.", solvedCount: 0, totalProblems: 7 },
  { id: "stack", name: "Stack", description: "LIFO data structure.", solvedCount: 0, totalProblems: 5 },
  { id: "binary-search", name: "Binary Search", description: "Efficient search algorithm for sorted arrays.", solvedCount: 0, totalProblems: 6 },
  { id: "linked-list", name: "Linked List", description: "Linear data structure with nodes.", solvedCount: 0, totalProblems: 7 },
  { id: "trees", name: "Trees", description: "Hierarchical data structure.", solvedCount: 0, totalProblems: 12 },
  { id: "tries", name: "Tries", description: "Tree-like structure for efficient string operations.", solvedCount: 0, totalProblems: 4 },
  { id: "heap", name: "Heap / Priority Queue", description: "Specialized tree-based data structure.", solvedCount: 0, totalProblems: 5 },
  { id: "backtracking", name: "Backtracking", description: "Algorithmic technique for solving problems recursively.", solvedCount: 0, totalProblems: 8 },
  { id: "graphs", name: "Graphs", description: "Data structure representing relationships between objects.", solvedCount: 0, totalProblems: 10 },
  { id: "dp-1d", name: "Dynamic Programming (1D)", description: "Optimization over plain recursion.", solvedCount: 0, totalProblems: 9 },
  { id: "dp-2d", name: "Dynamic Programming (2D)", description: "DP with two-dimensional states.", solvedCount: 0, totalProblems: 7 },
  { id: "greedy", name: "Greedy Algorithms", description: "Making locally optimal choices.", solvedCount: 0, totalProblems: 6 },
  { id: "intervals", name: "Intervals", description: "Problems involving ranges or intervals.", solvedCount: 0, totalProblems: 5 },
  { id: "bit-manipulation", name: "Bit Manipulation", description: "Operating on data at the bit level.", solvedCount: 0, totalProblems: 4 },
  // Add more topics as needed
];


export const fetchTopics = createAsyncThunk(
  'topics/fetchTopics',
  async (_, { rejectWithValue, getState }) => {
    try {
      const topicsCollectionRef = collection(db, 'dsa_topics');
      const querySnapshot = await getDocs(topicsCollectionRef);
      if (querySnapshot.empty) {
        // Seed initial topics if collection is empty (optional)
        console.log("Seeding DSA topics to Firestore...");
        for (const topic of initialDSATopics) {
          await setDoc(doc(db, 'dsa_topics', topic.id), topic);
        }
        return initialDSATopics;
      }
      const topics = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return topics;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk to update progress based on notes
// This is a conceptual thunk. Actual implementation depends on how "solved" is defined.
// For now, let's assume a note existing with a specific tag means progress for that topic.
export const updateTopicProgress = createAsyncThunk(
  'topics/updateTopicProgress',
  async (_, { getState, dispatch }) => {
    const { notesList } = getState().notes;
    const { topicsList } = getState().topics;

    if (!notesList.length || !topicsList.length) return;

    const newTopicsList = topicsList.map(topic => {
      const notesForTopic = notesList.filter(note =>
        note.tags && note.tags.some(tag => tag.toLowerCase() === topic.name.toLowerCase() || tag.toLowerCase() === topic.id.toLowerCase())
      );
      // This is a simplified solvedCount. You might have a more complex logic
      // e.g. if each note corresponds to a specific problem.
      return { ...topic, solvedCount: notesForTopic.length };
    });
    dispatch(setTopics(newTopicsList)); // Assuming setTopics is a reducer
  }
);


const initialState = {
  topicsList: [], // Will be populated by fetchTopics or initialDSATopics
  loading: false,
  error: null,
};

const topicsSlice = createSlice({
  name: 'topics',
  initialState,
  reducers: {
    setTopics: (state, action) => {
        state.topicsList = action.payload;
    }
    // Reducers for managing topics if they are user-editable
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTopics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTopics.fulfilled, (state, action) => {
        state.topicsList = action.payload;
        state.loading = false;
      })
      .addCase(fetchTopics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setTopics } = topicsSlice.actions;
export default topicsSlice.reducer;