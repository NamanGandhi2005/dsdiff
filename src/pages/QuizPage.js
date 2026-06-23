import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchNotes, setCurrentNote } from '../features/notes/notesSlice'; // To get note content
import QuizView from '../components/AI/QuizView';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { ChevronLeft, AlertTriangle, Brain } from 'lucide-react';
import toast from 'react-hot-toast';

const QuizPage = () => {
  const { noteId } = useParams();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { currentNote, loading: notesLoading, error: notesError } = useSelector(state => state.notes);

  useEffect(() => {
    // Try to set current note from existing list first
    if (noteId) {
      dispatch(setCurrentNote(noteId));
    }
  }, [noteId, dispatch]);

  useEffect(() => {
    // If currentNote is not found or doesn't match, fetch notes.
    if (user?.uid && (!currentNote || currentNote.id !== noteId)) {
      dispatch(fetchNotes(user.uid)).then((action) => {
        if (fetchNotes.fulfilled.match(action)) {
          const note = action.payload.find(n => n.id === noteId);
          if (note) {
            dispatch(setCurrentNote(noteId));
          } else {
            toast.error("Note not found for quiz generation.");
            // Potentially navigate away or show a specific "note not found for quiz" message
          }
        } else if (fetchNotes.rejected.match(action)) {
           toast.error("Failed to fetch note details for quiz.");
        }
      });
    }
  }, [dispatch, user?.uid, noteId, currentNote]);


  if (notesLoading && !currentNote) {
    return <LoadingSpinner text="Loading note content for quiz..." size="lg" />;
  }

  if (notesError && !currentNote) {
    return (
      <div className="text-center p-6">
        <AlertTriangle size={40} className="mx-auto mb-3 text-red-500" />
        <h3 className="text-xl font-semibold text-red-700 dark:text-red-300 mb-2">Error Loading Note</h3>
        <p className="text-sm text-red-600 dark:text-red-400 mb-4">
          Could not load the note content required to generate the quiz.
          Error: {typeof notesError === 'string' ? notesError : 'Unknown error'}
        </p>
        <Link to="/notes" className="text-primary hover:underline">
          Return to Notes List
        </Link>
      </div>
    );
  }

  if (!currentNote && !notesLoading) {
    return (
      <div className="text-center p-6">
        <AlertTriangle size={40} className="mx-auto mb-3 text-yellow-500" />
        <h3 className="text-xl font-semibold text-yellow-700 dark:text-yellow-300 mb-2">Note Not Found</h3>
        <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-4">
          The specified note could not be found. Please select a valid note to generate a quiz.
        </p>
        <Link to="/notes" className="text-primary hover:underline">
          Return to Notes List
        </Link>
      </div>
    );
  }


  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to={currentNote ? `/notes/${currentNote.id}`: "/notes"} className="flex items-center text-primary dark:text-primary-light hover:underline mb-0 text-sm">
        <ChevronLeft size={18} className="mr-1" /> Back to Note: {currentNote?.title || '...'}
      </Link>
      <h1 className="text-2xl sm:text-3xl font-bold text-text-light dark:text-text-dark text-center flex items-center justify-center">
        <Brain size={32} className="mr-3 text-primary" /> AI Quiz Time!
      </h1>
      {currentNote && currentNote.content ? (
        <QuizView noteContent={currentNote.content} noteTitle={currentNote.title} />
      ) : (
        <p className="text-center text-text-muted-light dark:text-text-muted-dark">
          Note content is empty or unavailable. Cannot generate quiz.
        </p>
      )}
    </div>
  );
};

export default QuizPage;