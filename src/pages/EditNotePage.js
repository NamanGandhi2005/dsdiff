// src/pages/EditNotePage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchNotes, updateNote, setCurrentNote } from '../features/notes/notesSlice';
import { updateTopicProgress } from '../features/dsaTopics/topicsSlice';
import NoteEditor from '../components/Notes/NoteEditor';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';
import { Edit, ChevronLeft } from 'lucide-react';

const EditNotePage = () => {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const { user } = useSelector(state => state.auth);
  const { currentNote, loading: notesLoading, error: globalNotesError } = useSelector(state => state.notes);
  
  // --- NEW STATE TO CONTROL EDITOR'S INITIAL CONTENT ---
  // Starts as null to indicate we haven't determined the content yet.
  const [editorContent, setEditorContent] = useState(null);

  // Effect to fetch and set the current note from Redux
  useEffect(() => {
    // If we have a noteId but no currentNote, or the wrong currentNote, fetch all notes.
    // A more optimized app might have a `fetchNoteById` thunk.
    if (user?.uid && noteId && (!currentNote || currentNote.id !== noteId)) {
      dispatch(fetchNotes(user.uid)).then((action) => {
        if (fetchNotes.fulfilled.match(action)) {
          // After fetching, try to set the current note from the now-populated list.
          dispatch(setCurrentNote(noteId));
        } else {
          toast.error("Failed to fetch note details.");
          navigate("/notes");
        }
      });
    } else if (noteId) {
      // If notes are already in the list, just ensure the correct one is set.
      dispatch(setCurrentNote(noteId));
    }
  }, [dispatch, user?.uid, noteId]);


  // --- NEW, ROBUST EFFECT TO SET THE EDITOR'S INITIAL CONTENT ---
  useEffect(() => {
    // Check for reverted content passed in location state first.
    const revertedContent = location.state?.contentToRevert;

    if (revertedContent !== undefined) {
      // If we have reverted content, it takes priority. Use it.
      console.log("EDIT PAGE: Using reverted content from location state.");
      setEditorContent(revertedContent);
      // Clear the location state immediately to prevent this from running again on a simple refresh
      navigate(location.pathname, { replace: true, state: {} });
    } else if (currentNote && currentNote.id === noteId && editorContent === null) {
      // If there's no reverted content AND we haven't set the content yet,
      // use the content from the currently loaded note from Redux.
      // This runs only once per note load.
      console.log("EDIT PAGE: Using current note content from Redux store.");
      setEditorContent(currentNote.content);
    }
  }, [currentNote, noteId, location, navigate, editorContent]);


  const handleUpdateNote = async (noteDataFromEditor) => {
    if (!currentNote || !noteId) {
        toast.error("Cannot update: Original note data is missing.");
        return;
    }
    if (!noteDataFromEditor.title || !noteDataFromEditor.title.trim()) {
        toast.error("Note title cannot be empty.");
        return;
    }

    const resultAction = await dispatch(updateNote({
      id: noteId,
      userId: user.uid,
      title: noteDataFromEditor.title,
      content: noteDataFromEditor.content,
      tags: noteDataFromEditor.tags || [],
      existingVersionHistory: currentNote.versionHistory || [],
    }));

    if (updateNote.fulfilled.match(resultAction)) {
      toast.success('Note updated successfully!');
      dispatch(updateTopicProgress());
      navigate(`/notes/${noteId}`);
    } else {
      const errorMessage = resultAction.payload || globalNotesError || 'Failed to update note.';
      toast.error(`Failed to update note: ${errorMessage}`);
    }
  };

  // Show loading spinner until we have determined the initial content for the editor.
  if (notesLoading || editorContent === null) {
    return <LoadingSpinner text="Loading note for editing..." size="lg" />;
  }

  // Handle case where note is not found after loading
  if (!currentNote && !notesLoading) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold">Note Not Found</h2>
        <p className="text-text-muted-light dark:text-text-muted-dark">
          The note you are trying to edit could not be found.
        </p>
        <Link to="/notes" className="mt-4 inline-block px-4 py-2 bg-primary text-white rounded-md">
          Go to Notes List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to={currentNote ? `/notes/${currentNote.id}` : '/notes'} className="flex items-center text-primary dark:text-primary-light hover:underline mb-4 text-sm">
        <ChevronLeft size={18} className="mr-1" /> Back to Note View
      </Link>
      <h1 className="text-2xl sm:text-3xl font-bold text-text-light dark:text-text-dark flex items-center">
        <Edit size={28} className="mr-3 text-primary" /> Edit DSA Note
      </h1>
      
      {/* NoteEditor is now simpler; it just receives the definitive initial state */}
      {currentNote && (
        <NoteEditor
          initialNote={currentNote} // Still needed for title, tags, versionHistory
          // Pass the definitive content from our state.
          // NoteEditor's useEffect will now correctly pick this up on first render and on revert.
          propInitialContent={editorContent}
          propInitialTags={currentNote.tags}
          propInitialTitle={currentNote.title}
          
          onSave={handleUpdateNote}
          onCancel={() => navigate(currentNote ? `/notes/${currentNote.id}`: '/notes')}
          saving={notesLoading}
        />
      )}
    </div>
  );
};

export default EditNotePage;