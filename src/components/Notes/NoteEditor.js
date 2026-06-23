// src/components/Notes/NoteEditor.js
import React, { useState, useEffect, useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Using Quill v1.x compatible styles is fine

import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

import TagsInput from './TagsInput';
import { useSelector } from 'react-redux';
import { Save, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// Attach hljs to window for Quill's syntax module to find
if (typeof window !== 'undefined') {
    window.hljs = hljs;
}

const NoteEditor = ({
  // The 'noteId' prop is no longer needed by this component for its logic,
  // but the parent might still pass it. We'll ignore it here.
  initialNote,
  initialTitle: propInitialTitle,
  initialContent: propInitialContent,
  initialTags: propInitialTags,
  onSave,
  onCancel,
  saving,
}) => {
  // Internal state for the editor's content
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);

  const { topicsList } = useSelector((state) => state.topics || { topicsList: [] });
  const topicNameSuggestions = useMemo(() =>
    Array.isArray(topicsList) ? topicsList.map(topic => topic.name) : [],
  [topicsList]);

  // This single, simplified useEffect handles all initialization cases
  useEffect(() => {
    // Handle editing an existing note
    if (initialNote && initialNote.id) {
      setTitle(initialNote.title || '');
      setTags(initialNote.tags || []);
      
      // FIX FOR REVERT:
      // Prioritize propInitialContent (from a version history revert).
      // If it exists, use it. Otherwise, use the note's current content.
      if (propInitialContent) {
        setContent(propInitialContent);
      } else {
        setContent(initialNote.content || '');
      }
    } 
    // Handle a new note (from AI, template, or blank)
    else {
      setTitle(propInitialTitle || '');
      setContent(propInitialContent || '');
      setTags(propInitialTags || []);
    }
  }, [initialNote, propInitialTitle, propInitialContent, propInitialTags]);


  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    // `onSave` is called with the current state of the editor
    onSave({
      id: initialNote?.id, // Will be undefined for new notes
      title,
      content,
      tags,
      versionHistory: initialNote?.versionHistory || []
    });
  };

  const quillModules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4] }], ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
    syntax: {
      highlight: text => hljs.highlightAuto(text).value,
    },
    history: { // Use Quill's own local history module
        delay: 2000,
        maxStack: 500,
        userOnly: true
    },
    clipboard: { matchVisual: false }
  }), []);

  const quillFormats = [
    'header', 'font', 'size', 'bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block',
    'list', 'bullet', 'check', 'indent', 'link', 'image', 'video', 'color', 'background', 'script', 'align',
  ];

  return (
    <div className="p-6 sm:p-8 glass-panel rounded-3xl border border-white/20 dark:border-white/10 relative z-10">
      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="Note Title (e.g., Two Sum Problem, DFS Explanation)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-grow w-full pb-3 mb-5 text-xl sm:text-3xl font-extrabold border-b-2 border-black/5 dark:border-white/10 focus:border-indigo-500 dark:focus:border-indigo-400 bg-transparent focus:outline-none text-text-light dark:text-text-dark placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
        />
        {/* Removed collaborator count UI */}
      </div>

      <div className="mb-5">
        <TagsInput tags={tags} setTags={setTags} suggestions={topicNameSuggestions} />
      </div>
      <div className="quill-editor-container rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 shadow-inner relative">
        <ReactQuill
          // Key helps re-initialize Quill if the content changes from an external source like a revert
          key={initialNote?.id || `${propInitialTitle}-${(propInitialContent || '').substring(0,10)}`}
          theme="snow"
          value={content}
          onChange={setContent}
          modules={quillModules}
          formats={quillFormats}
          placeholder="Start writing your DSA notes here..."
          className="bg-white/40 dark:bg-slate-900/40 text-text-light dark:text-text-dark backdrop-blur-md"
          style={{ minHeight: '300px' }}
        />
      </div>
      <div className="mt-6 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={saving} className="w-full sm:w-auto flex items-center justify-center px-6 py-3 rounded-xl btn-apple-secondary font-semibold text-sm">
            <XCircle size={18} className="mr-2" /> Cancel
          </button>
        )}
        <button type="button" onClick={handleSave} disabled={saving || !title.trim()} className="w-full sm:w-auto flex items-center justify-center px-6 py-3 rounded-xl btn-apple-primary font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed">
          <Save size={18} className="mr-2" />
          {saving ? 'Saving...' : (initialNote?.id ? 'Update Note' : 'Save Note')}
        </button>
      </div>
    </div>
  );
};

export default NoteEditor;