import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../../firebase';

export const INTERVAL_DAYS = { hard: 1, okay: 3, easy: 7 };

export function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isNoteDue(note, now = new Date()) {
  if (!note?.nextReviewAt) return false;
  const due = new Date(note.nextReviewAt);
  return !Number.isNaN(due.getTime()) && due.getTime() <= now.getTime();
}

export function reviewFields(note, ease) {
  const now = new Date();
  const next = new Date(now);
  next.setDate(next.getDate() + (INTERVAL_DAYS[ease] || 3));
  return {
    lastReviewedAt: now.toISOString(),
    nextReviewAt: next.toISOString(),
    reviewEase: ease,
    reviewCount: (note?.reviewCount || 0) + 1,
  };
}

export function computeStreak(dayMap) {
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!dayMap[dateKey(cursor)]) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (dayMap[dateKey(cursor)]) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function buildHeatmap(dayMap, weeks = 16) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - start.getDay() - (weeks - 1) * 7);
  const cells = [];
  for (let i = 0; i < weeks * 7; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const key = dateKey(day);
    cells.push({
      key,
      count: dayMap[key] || 0,
      future: day.getTime() > today.getTime(),
    });
  }
  return cells;
}

const toIso = (value) => {
  if (!value) return new Date().toISOString();
  if (value.toDate) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return String(value);
};

export const recordStudyDay = createAsyncThunk(
  'study/recordStudyDay',
  async (userId, { rejectWithValue }) => {
    if (!userId) return rejectWithValue('User ID is required.');
    const date = dateKey();
    try {
      await setDoc(
        doc(db, 'studyDays', `${userId}_${date}`),
        { userId, date, count: increment(1) },
        { merge: true }
      );
      return { date };
    } catch (error) {
      return rejectWithValue(error.message || 'Could not record study day.');
    }
  }
);

export const fetchStudyDays = createAsyncThunk(
  'study/fetchStudyDays',
  async (userId, { rejectWithValue }) => {
    if (!userId) return rejectWithValue('User ID is required.');
    try {
      const snapshot = await getDocs(query(collection(db, 'studyDays'), where('userId', '==', userId)));
      const dayMap = {};
      snapshot.docs.forEach((item) => {
        const data = item.data();
        if (data.date) dayMap[data.date] = data.count || 1;
      });
      return dayMap;
    } catch (error) {
      return rejectWithValue(error.message || 'Could not load study days.');
    }
  }
);

export const fetchMistakes = createAsyncThunk(
  'study/fetchMistakes',
  async (userId, { rejectWithValue }) => {
    if (!userId) return rejectWithValue('User ID is required.');
    try {
      const snapshot = await getDocs(query(collection(db, 'mistakes'), where('userId', '==', userId)));
      return snapshot.docs
        .map((item) => ({ id: item.id, ...item.data(), createdAt: toIso(item.data().createdAt) }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      return rejectWithValue(error.message || 'Could not load mistakes.');
    }
  }
);

export const addMistake = createAsyncThunk(
  'study/addMistake',
  async (mistake, { rejectWithValue }) => {
    if (!mistake?.userId || !mistake?.question) return rejectWithValue('Mistake is incomplete.');
    try {
      const payload = {
        userId: mistake.userId,
        noteId: mistake.noteId || '',
        noteTitle: mistake.noteTitle || '',
        question: mistake.question,
        options: mistake.options || [],
        correctAnswer: mistake.correctAnswer || '',
        userAnswer: mistake.userAnswer || '',
        explanation: mistake.explanation || '',
        resolved: false,
        createdAt: new Date().toISOString(),
      };
      const ref = await addDoc(collection(db, 'mistakes'), payload);
      return { id: ref.id, ...payload };
    } catch (error) {
      return rejectWithValue(error.message || 'Could not save mistake.');
    }
  }
);

export const resolveMistake = createAsyncThunk(
  'study/resolveMistake',
  async (mistakeId, { rejectWithValue }) => {
    if (!mistakeId) return rejectWithValue('Mistake ID is required.');
    try {
      await updateDoc(doc(db, 'mistakes', mistakeId), { resolved: true });
      return mistakeId;
    } catch (error) {
      return rejectWithValue(error.message || 'Could not update mistake.');
    }
  }
);

export const fetchInterviews = createAsyncThunk(
  'study/fetchInterviews',
  async (userId, { rejectWithValue }) => {
    if (!userId) return rejectWithValue('User ID is required.');
    try {
      const snapshot = await getDocs(query(collection(db, 'interviews'), where('userId', '==', userId)));
      return snapshot.docs
        .map((item) => ({ id: item.id, ...item.data(), createdAt: toIso(item.data().createdAt) }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      return rejectWithValue(error.message || 'Could not load interviews.');
    }
  }
);

export const saveInterview = createAsyncThunk(
  'study/saveInterview',
  async (interview, { rejectWithValue }) => {
    if (!interview?.userId) return rejectWithValue('User ID is required.');
    try {
      const payload = {
        userId: interview.userId,
        techStack: interview.techStack || '',
        experience: interview.experience || '',
        questions: interview.questions || [],
        answers: interview.answers || [],
        score: interview.score ?? 0,
        feedback: interview.feedback || '',
        areasForImprovement: interview.areasForImprovement || [],
        detailedFeedback: interview.detailedFeedback || [],
        createdAt: new Date().toISOString(),
      };
      const ref = await addDoc(collection(db, 'interviews'), payload);
      await setDoc(
        doc(db, 'studyDays', `${interview.userId}_${dateKey()}`),
        { userId: interview.userId, date: dateKey(), count: increment(1) },
        { merge: true }
      );
      return { id: ref.id, ...payload };
    } catch (error) {
      return rejectWithValue(error.message || 'Could not save interview.');
    }
  }
);

export const scheduleReview = createAsyncThunk(
  'study/scheduleReview',
  async ({ note, ease, userId }, { rejectWithValue }) => {
    if (!note?.id) return rejectWithValue('Note is required.');
    if (!INTERVAL_DAYS[ease]) return rejectWithValue('Choose easy, okay, or hard.');
    try {
      const fields = reviewFields(note, ease);
      await updateDoc(doc(db, 'notes', note.id), fields);
      if (userId) {
        await setDoc(
          doc(db, 'studyDays', `${userId}_${dateKey()}`),
          { userId, date: dateKey(), count: increment(1) },
          { merge: true }
        );
      }
      return { id: note.id, fields, date: dateKey() };
    } catch (error) {
      return rejectWithValue(error.message || 'Could not schedule review.');
    }
  }
);

export const publishNote = createAsyncThunk(
  'study/publishNote',
  async ({ note, isPublic, authorName, userId }, { rejectWithValue }) => {
    if (!note?.id) return rejectWithValue('Note is required.');
    const ownerId = userId || note.userId;
    if (!ownerId) return rejectWithValue('You need to be signed in to share a note.');
    try {
      await updateDoc(doc(db, 'notes', note.id), { isPublic: !!isPublic });
      const publicRef = doc(db, 'publicNotes', note.id);
      if (isPublic) {
        await setDoc(publicRef, {
          title: note.title || 'Untitled',
          content: note.content || '',
          tags: note.tags || [],
          authorName: authorName || 'DSDIFF student',
          ownerId,
          publishedAt: new Date().toISOString(),
        });
      } else {
        await deleteDoc(publicRef).catch(() => {});
      }
      return { id: note.id, isPublic: !!isPublic };
    } catch (error) {
      return rejectWithValue(error.message || 'Could not update sharing.');
    }
  }
);

const studySlice = createSlice({
  name: 'study',
  initialState: {
    dayMap: {},
    mistakes: [],
    interviews: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudyDays.fulfilled, (state, action) => {
        state.dayMap = action.payload;
      })
      .addCase(recordStudyDay.fulfilled, (state, action) => {
        const { date } = action.payload;
        state.dayMap[date] = (state.dayMap[date] || 0) + 1;
      })
      .addCase(scheduleReview.fulfilled, (state, action) => {
        const { date } = action.payload;
        if (date) state.dayMap[date] = (state.dayMap[date] || 0) + 1;
      })
      .addCase(saveInterview.fulfilled, (state, action) => {
        state.interviews.unshift(action.payload);
        const date = dateKey();
        state.dayMap[date] = (state.dayMap[date] || 0) + 1;
      })
      .addCase(fetchMistakes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMistakes.fulfilled, (state, action) => {
        state.loading = false;
        state.mistakes = action.payload;
      })
      .addCase(fetchMistakes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addMistake.fulfilled, (state, action) => {
        state.mistakes.unshift(action.payload);
      })
      .addCase(resolveMistake.fulfilled, (state, action) => {
        const match = state.mistakes.find((item) => item.id === action.payload);
        if (match) match.resolved = true;
      })
      .addCase(fetchInterviews.fulfilled, (state, action) => {
        state.interviews = action.payload;
      })
      .addCase(fetchInterviews.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default studySlice.reducer;
