// src/components/Notes/NoteList.js
import React, { useMemo } from 'react';
import NoteItem from './NoteItem';
import { FilePlus, Search, FileText } from 'lucide-react'; // 'Filter' was unused, so it can be removed from imports if you wish
import { Link } from 'react-router-dom';
import LoadingSpinner from '../Common/LoadingSpinner';

const NoteList = ({ notes, onDeleteNote, loading, error, searchTerm, setSearchTerm, currentFilters }) => {
  
  const filteredNotes = useMemo(() => {
    // Start with a safety check for the notes array
    if (!notes || !Array.isArray(notes)) {
        return [];
    }

    // Sanitize the topic filter from the URL parameter once
    const topicFilter = currentFilters?.topic?.toLowerCase().trim() || '';
    const searchFilter = searchTerm?.toLowerCase().trim() || '';

    return notes.filter(note => {
      // --- SEARCH FILTER LOGIC ---
      // If a search term exists, the note must match it in title or tags.
      let searchMatch = true; // Default to true (pass filter) if no search term
      if (searchFilter) {
        const titleMatch = note.title?.toLowerCase().includes(searchFilter);
        const tagMatch = note.tags?.some(tag => tag.toLowerCase().includes(searchFilter));
        searchMatch = titleMatch || tagMatch;
      }
      
      // --- TOPIC FILTER LOGIC ---
      // If a topic filter exists (from URL), the note must have a matching tag.
      let topicMatch = true; // Default to true (pass filter) if no topic filter
      if (topicFilter) {
        topicMatch = note.tags?.some(tag => {
            const lowercasedTag = tag.toLowerCase();
            // Create a "slug" from the full tag name for better matching
            // e.g., "Arrays & Hashing" -> "arrays-hashing"
            const tagAsSlug = lowercasedTag.replace(/ & /g, '-').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

            // Check for exact match, slug match, or if the tag contains the filter
            // e.g., this allows `topic=arrays` to match the tag "Arrays & Hashing"
            return lowercasedTag === topicFilter || tagAsSlug === topicFilter || lowercasedTag.includes(topicFilter);
        });
      }

      // The note is included in the final list only if it passes both filters.
      return searchMatch && topicMatch;
    });
  }, [notes, searchTerm, currentFilters]);


  if (loading) {
    return <LoadingSpinner text="Fetching your notes..." size="lg" />;
  }

  if (error) {
    return <div className="text-center text-red-500 dark:text-red-400 p-4 bg-red-100 dark:bg-red-900 rounded-md">Error loading notes: {typeof error === 'string' ? error : 'An unexpected error occurred.'}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 glass-card rounded-2xl border border-white/20 dark:border-white/10 shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Search notes by title or tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-2 pl-10 pr-4 glass-input rounded-xl text-text-light dark:text-text-dark placeholder-gray-400 dark:placeholder-gray-500"
          />
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        {/* The commented-out Filter button is kept as a placeholder for future implementation */}
        {/* <button 
            onClick={() => alert("Filter functionality coming soon!")}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 border ... "
        >
          <Filter size={16} className="mr-2" />
          Filters
        </button> */}
        <Link
          to="/notes/new"
          className="w-full sm:w-auto flex items-center justify-center px-5 py-2.5 btn-apple-primary text-white font-semibold rounded-xl shadow-sm"
        >
          <FilePlus size={18} className="mr-2" />
          Create New Note
        </Link>
      </div>

      {filteredNotes.length === 0 && !loading && (
        <div className="text-center py-10">
          <FileText size={48} className="mx-auto text-gray-400 dark:text-gray-500" />
          <h3 className="mt-2 text-xl font-medium text-text-light dark:text-text-dark">
            { (searchTerm || currentFilters?.topic) ? 'No notes match your filters.' : 'No notes yet.' }
          </h3>
          <p className="mt-1 text-sm text-text-muted-light dark:text-text-muted-dark">
            { (searchTerm || currentFilters?.topic) ? 'Try a different search or clear filters.' : 'Get started by creating a new note.' }
          </p>
          {/* Only show "Create Your First Note" button if there are no notes at all and no filters active */}
          {notes.length === 0 && !searchTerm && !currentFilters?.topic && (
             <Link
                to="/notes/new"
                className="mt-4 inline-flex items-center px-4 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-md shadow-sm transition-colors"
            >
                <FilePlus size={18} className="mr-2" />
                Create Your First Note
            </Link>
          )}
        </div>
      )}

      {filteredNotes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <NoteItem key={note.id} note={note} onDelete={onDeleteNote} />
          ))}
        </div>
      )}
    </div>
  );
};

export default NoteList;