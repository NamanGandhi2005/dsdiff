// src/features/auth/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '../../firebase'; // Ensure this path is correct
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase'; // Ensure this path is correct

export const listenToAuthChanges = createAsyncThunk(
  'auth/listenToAuthChanges',
  async (_, { dispatch }) => {
    return new Promise((resolve, reject) => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            // For JS, spreading user might be okay, but be mindful of what's in user vs userDocSnap.data()
            // Prioritize Firestore data if it's more up-to-date for custom fields
            const firestoreData = userDocSnap.data();
            dispatch(setUser({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || firestoreData.displayName, // Prefer Firebase displayName if available
              photoURL: user.photoURL || firestoreData.photoURL, // Prefer Firebase photoURL
              ...firestoreData // Spread Firestore data for other custom fields
            }));
          } else {
            // User in Auth, not Firestore (e.g., first Google sign-in)
            // Basic user object, can be expanded by other thunks if they create the Firestore doc
            dispatch(setUser({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL
            }));
          }
        } else {
          dispatch(clearUser());
        }
        resolve();
      }, reject);
    });
  }
);

export const signUpWithEmail = createAsyncThunk(
  'auth/signUpWithEmail',
  async ({ email, password, displayName }, { rejectWithValue }) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userToSaveInFirestore = {
        uid: user.uid,
        email: user.email,
        displayName: displayName || user.email?.split('@')[0] || 'User', // Default display name
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', user.uid), userToSaveInFirestore);
      // Return a user object consistent with what setUser expects
      return {
        uid: user.uid,
        email: user.email,
        displayName: userToSaveInFirestore.displayName, // Use the processed displayName
        // photoURL: user.photoURL (not available directly on email sign up)
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Unknown sign-up error');
    }
  }
);

export const signInWithEmail = createAsyncThunk(
  'auth/signInWithEmail',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        return {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || userDocSnap.data().displayName,
          photoURL: user.photoURL || userDocSnap.data().photoURL,
          ...userDocSnap.data()
        };
      }
      // Fallback if Firestore doc doesn't exist (should be rare for existing email users)
      return { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL };
    } catch (error) {
      return rejectWithValue(error.message || 'Unknown sign-in error');
    }
  }
);

export const signInWithGoogle = createAsyncThunk(
  'auth/signInWithGoogle',
  async (_, { rejectWithValue }) => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      let userPayloadToDispatch;

      if (userDocSnap.exists()) {
        userPayloadToDispatch = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName, // Google provides this
            photoURL: user.photoURL, // Google provides this
            ...userDocSnap.data() // Merge with any existing Firestore data
        };
      } else {
        // Create user document in Firestore if it's their first Google sign-in
        const newUserFirestoreData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', user.uid), newUserFirestoreData);
        userPayloadToDispatch = newUserFirestoreData;
      }
      return userPayloadToDispatch;
    } catch (error) {
      return rejectWithValue(error.message || 'Unknown Google sign-in error');
    }
  }
);

export const signOut = createAsyncThunk(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    try {
      await firebaseSignOut(auth);
      // No explicit return value needed, onAuthStateChanged will handle state update
    } catch (error) {
      return rejectWithValue(error.message || 'Unknown sign-out error');
    }
  }
);

const initialState = {
  user: null,
  loading: true,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.loading = false;
      state.error = null;
    },
    clearUser: (state) => {
      state.user = null;
      state.loading = false;
      state.error = null;
    },
    setAuthLoading: (state, action) => {
      state.loading = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // All .addCase calls MUST come before ALL .addMatcher calls.
      // Handle specific thunk lifecycles with .addCase first.

      // listenToAuthChanges
      .addCase(listenToAuthChanges.pending, (state) => {
        state.loading = true;
      })
      .addCase(listenToAuthChanges.fulfilled, (state) => {
        // User state (setUser/clearUser) handled by dispatch within the thunk.
        // Loading state should also be managed by those dispatches.
        // This case primarily indicates listener setup/initial check completed.
        // If loading is still true, it means neither setUser nor clearUser was dispatched by the listener,
        // which would be unusual.
        if (state.loading) { // Safety check
            state.loading = false;
        }
      })
      .addCase(listenToAuthChanges.rejected, (state, action) => {
        state.loading = false;
        state.user = null; // Ensure user is cleared on listener failure
        state.error = action.payload || 'Failed to listen to auth changes';
      })

      // signOut - Placing its .addCase here to ensure all .addCase are together
      .addCase(signOut.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signOut.fulfilled, (state) => {
        // onAuthStateChanged will dispatch clearUser, which sets user to null and loading to false.
        // This is slightly redundant but ensures immediate UI feedback if needed.
        state.user = null;
        state.loading = false;
      })
      .addCase(signOut.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Sign out failed';
      })

      // Now, all .addMatcher calls can follow
      .addMatcher(
        (action) => [
          signUpWithEmail.pending,
          signInWithEmail.pending,
          signInWithGoogle.pending
          // signOut.pending is now handled by its own .addCase above
        ].includes(action.type),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => [
          signUpWithEmail.fulfilled,
          signInWithEmail.fulfilled,
          signInWithGoogle.fulfilled
          // signOut.fulfilled is now handled by its own .addCase above
        ].includes(action.type),
        (state, action) => {
          state.user = action.payload; // The thunks now return a consistent user object
          state.loading = false;
        }
      )
      .addMatcher(
        (action) => [
          signUpWithEmail.rejected,
          signInWithEmail.rejected,
          signInWithGoogle.rejected
          // signOut.rejected is now handled by its own .addCase above
        ].includes(action.type),
        (state, action) => {
          state.loading = false;
          state.error = action.payload || 'An authentication error occurred.'; // Generic fallback
        }
      );
  },
});

export const { setUser, clearUser, setAuthLoading } = authSlice.actions;
export default authSlice.reducer;