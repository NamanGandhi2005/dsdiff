import React, { useEffect } from 'react';
import {Link} from 'react-router-dom';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import type { RootState, AppDispatch } from './app/store';

import { listenToAuthChanges } from './features/auth/authSlice';
import { setTheme } from './features/theme/themeSlice';
import { fetchDailyDsaTip } from './features/ai/aiSlice'; // For the daily tip
import { fetchTopics } from './features/dsaTopics/topicsSlice'; // Fetch topics on app load


import Navbar from './components/Common/Navbar';
import Footer from './components/Common/Footer';
import PrivateRoute from './components/Auth/PrivateRoute';
import LoadingSpinner from './components/Common/LoadingSpinner';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import DashboardPage from './pages/DashboardPage';
import NotesListPage from './pages/NotesListPage';
import CreateNotePage from './pages/CreateNotePage';
import EditNotePage from './pages/EditNotePage';
import ViewNotePage from './pages/ViewNotePage';
import QuizPage from './pages/QuizPage';
import SettingsPage from './pages/SettingsPage';
import TopicExplorerPage from './pages/TopicExplorerPage'; // AI Topic Explainer page

function App() {
  const dispatch = useDispatch<AppDispatch>(); // Typed dispatch
  const themeMode = useSelector((state: RootState) => state.theme.mode);
  const authLoading = useSelector((state: RootState) => state.auth.loading);
  const user = useSelector((state: RootState) => state.auth.user);


  useEffect(() => {
    // Start listening to auth changes as soon as the app loads
    dispatch(listenToAuthChanges());

    // Fetch initial data that doesn't strictly depend on the user being logged in immediately
    // (or that can gracefully handle being called before user is known)
    dispatch(fetchDailyDsaTip());
    dispatch(fetchTopics()); // Fetch DSA topics list

    const savedTheme = localStorage.getItem('themeMode');
    if (savedTheme) {
      dispatch(setTheme(savedTheme));
    }
  }, [dispatch]);

  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode]);

  // This initial loading spinner is crucial for waiting for Firebase auth state to be determined.
  // `authLoading` in authSlice should be true initially and set to false after the first onAuthStateChanged event.
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <LoadingSpinner text="Initializing App..." size="xl" />
      </div>
    );
  }

  return (
    <Router>
      <div className="relative min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark transition-colors duration-500 flex flex-col">
        {/* Floating animated blobs in the background (liquid glass aesthetic) */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[8%] left-[-15%] w-[55vw] h-[55vw] sm:w-[40vw] sm:h-[40vw] rounded-full bg-gradient-to-tr from-indigo-500/30 to-purple-500/30 dark:from-indigo-600/18 dark:to-purple-600/18 blur-[90px] sm:blur-[130px] animate-blob"></div>
          <div className="absolute bottom-[8%] right-[-15%] w-[60vw] h-[60vw] sm:w-[45vw] sm:h-[45vw] rounded-full bg-gradient-to-br from-blue-400/30 to-teal-400/30 dark:from-blue-500/18 dark:to-teal-500/18 blur-[100px] sm:blur-[140px] animate-blob animation-delay-2000"></div>
          <div className="absolute top-[35%] right-[10%] w-[50vw] h-[50vw] sm:w-[35vw] sm:h-[35vw] rounded-full bg-gradient-to-tl from-pink-400/25 to-rose-400/25 dark:from-pink-500/12 dark:to-rose-500/12 blur-[90px] sm:blur-[120px] animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
          <Toaster
              position="top-right"
              reverseOrder={false}
              toastOptions={{
                  className: '',
                  duration: 4000,
                  style: {
                      background: themeMode === 'dark' ? '#1E293B' : '#FFFFFF',
                      color: themeMode === 'dark' ? '#F1F5F9' : '#1E293B',
                      fontSize: '0.9rem',
                      backdropFilter: 'blur(8px)',
                      border: themeMode === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
                  },
                  success: {
                      duration: 3000,
                  },
                  error: {
                      duration: 5000,
                  }
              }}
          />
          <Navbar />
        <main className="flex-grow container mx-auto px-2 sm:px-4 py-6 sm:py-8"> {/* Reduced horizontal padding slightly */}
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            {/* If user is logged in, redirect from login/signup to dashboard */}
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
            <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <SignUpPage />} />

            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/notes" element={<NotesListPage />} />
              <Route path="/notes/new" element={<CreateNotePage />} />
              <Route path="/notes/edit/:noteId" element={<EditNotePage />} />
              <Route path="/notes/:noteId" element={<ViewNotePage />} />
              <Route path="/quiz/:noteId" element={<QuizPage />} />
              <Route path="/ai/explain-topic" element={<TopicExplorerPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            
            {/* Fallback/404 Route - Consider a dedicated 404 page component */}
            <Route path="*" element={
                <div className="text-center py-20">
                    <h1 className="text-6xl font-bold text-primary">404</h1>
                    <p className="text-2xl mt-4 mb-8 text-text-light dark:text-text-dark">Page Not Found</p>
                    <Link to="/" className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary-dark">
                        Go Home
                    </Link>
                </div>
            } />
          </Routes>
        </main>
        <Footer />
        </div>
      </div>
    </Router>
  );
}

export default App;