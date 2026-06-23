import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchNotes, deleteNote as deleteNoteAction, setSearchTerm as setGlobalSearchTerm } from '../features/notes/notesSlice';
import NoteList from '../components/Notes/NoteList';
import toast from 'react-hot-toast';
import { FileText } from 'lucide-react';

const NotesListPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { notesList, loading, error, filters } = useSelector((state) => state.notes);
  
  const [searchParams] = useSearchParams();
  const topicFilterFromURL = searchParams.get('topic');

  // Local search term for this page, distinct from global filter if needed, or sync them.
  // For simplicity, let's use the global search term from Redux.
  const searchTerm = filters.searchTerm;

  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchNotes(user.uid));
    }
  }, [dispatch, user?.uid]);
  
  useEffect(() => {
    if (topicFilterFromURL) {
      // If you want to set this as a global filter immediately:
      // dispatch(setTopicFilter(topicFilterFromURL)); // Assuming you have such an action
      // For now, NoteList component will use it directly for filtering if passed
    }
  }, [topicFilterFromURL, dispatch]);


  const handleDeleteNote = async (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      const result = await dispatch(deleteNoteAction(noteId));
      if (deleteNoteAction.fulfilled.match(result)) {
        toast.success('Note deleted successfully.');
      } else {
        toast.error('Failed to delete note.');
      }
    }
  };

  const handleSearch = (term) => {
    dispatch(setGlobalSearchTerm(term));
  };
  
  // Construct currentFilters for NoteList
  const currentFiltersForList = {
      topic: topicFilterFromURL || '', // Use URL param for topic filtering
      // ... add other filters if you implement them (dateRange, etc.)
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-text-light dark:text-text-dark flex items-center">
          <FileText size={30} className="mr-3 text-indigo-500" /> My DSDIFF Notes
        </h1>
      </div>
      <p className="text-text-muted-light dark:text-text-muted-dark mb-6">
        Manage all your notes in DSDIFF. Search, filter, and stay organized on your learning path.
        {topicFilterFromURL && <span className="block mt-1">Currently filtering by topic: <strong className="text-primary">{topicFilterFromURL}</strong></span>}
      </p>

      <NoteList
        notes={notesList}
        onDeleteNote={handleDeleteNote}
        loading={loading}
        error={error}
        searchTerm={searchTerm}
        setSearchTerm={handleSearch}
        currentFilters={currentFiltersForList}
        // onApplyFilters={(newFilters) => console.log("Apply filters:", newFilters)} // Placeholder
      />
    </div>
  );
};

export default NotesListPage;