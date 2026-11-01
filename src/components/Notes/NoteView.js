// src/components/Notes/NoteView.js (or src/pages/ViewNotePage.js)
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import DOMPurify from 'dompurify'; // For sanitizing HTML
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  Edit3, Trash2, Tag, Calendar, Clock, Brain, ListChecks,Info,
  Share2, Download, Printer, ChevronLeft, History, Globe, ClipboardCheck
} from 'lucide-react';
import LoadingSpinner from '../Common/LoadingSpinner'; // Ensure path is correct
import { deleteNote as deleteNoteAction, fetchNotes, setCurrentNote } from '../../features/notes/notesSlice'; // Renamed deleteNote import
import GeminiSummarizer from '../AI/GeminiSummarizer';
import VersionHistoryViewer from '../VersionHistory/VersionHistoryViewer';
// jsPDF and html2canvas are no longer needed for this function, but kept in imports as you requested
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import TurndownService from 'turndown'; // For Markdown export
import apiClient from '../../api/piServerApi'; // <--- IMPORT YOUR API CLIENT
import ReviewButtons from '../Study/ReviewButtons';
import CodeCheck from './CodeCheck';
import { publishNote } from '../../features/study/studySlice';
import { applyNotePatch } from '../../features/notes/notesSlice';
import { COMPANIES } from '../../features/study/companies';

const NoteView = () => {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentNote, loading: notesLoading, error: notesError } = useSelector(state => state.notes);
  const { user } = useSelector(state => state.auth);
  const [showSummarizer, setShowSummarizer] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showCodeCheck, setShowCodeCheck] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [companyToAdd, setCompanyToAdd] = useState(COMPANIES[0]);

  useEffect(() => {
    if (noteId) {
      dispatch(setCurrentNote(noteId));
    }
  }, [noteId, dispatch]);

  useEffect(() => {
    if (user && user.uid && (!currentNote || currentNote.id !== noteId) && noteId) {
      dispatch(fetchNotes(user.uid)).then((action) => {
        if (fetchNotes.fulfilled.match(action)) {
          dispatch(setCurrentNote(noteId));
        }
      });
    }
  }, [user, currentNote, noteId, dispatch]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      if (currentNote?.id) {
        const result = await dispatch(deleteNoteAction(currentNote.id)); // Use aliased import
        if (deleteNoteAction.fulfilled.match(result)) {
          toast.success('Note deleted successfully.');
          navigate('/notes');
        } else {
          toast.error('Failed to delete note.');
        }
      }
    }
  };

  const handlePublish = async () => {
    if (!currentNote?.id) return;
    const nextPublic = !currentNote.isPublic;
    setPublishing(true);
    const result = await dispatch(publishNote({
      note: currentNote,
      isPublic: nextPublic,
      authorName: user?.displayName || 'DSDIFF student',
      userId: user?.uid,
    }));
    setPublishing(false);
    if (publishNote.fulfilled.match(result)) {
      dispatch(applyNotePatch({ id: currentNote.id, fields: { isPublic: nextPublic } }));
      if (nextPublic) {
        const url = `${window.location.origin}/p/${currentNote.id}`;
        try {
          await navigator.clipboard.writeText(url);
          toast.success('Public link copied.');
        } catch (error) {
          toast.success(url);
        }
      } else {
        toast.success('This note is private again.');
      }
    } else {
      toast.error(result.payload || 'Could not update sharing.');
    }
  };

  const addCompanyTag = async () => {
    if (!currentNote?.id || !companyToAdd) return;
    const tags = currentNote.tags || [];
    if (tags.some((tag) => tag.toLowerCase() === companyToAdd.toLowerCase())) {
      toast('That company tag is already on this note.');
      return;
    }
    const nextTags = [...tags, companyToAdd];
    try {
      await updateDoc(doc(db, 'notes', currentNote.id), { tags: nextTags });
      dispatch(applyNotePatch({ id: currentNote.id, fields: { tags: nextTags } }));
      toast.success(`Tagged ${companyToAdd}.`);
    } catch (error) {
      toast.error(error.message || 'Could not add the company tag.');
    }
  };

  const exportToMarkdown = () => {
    if (!currentNote?.content) return;
    const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
    // Add rules to keep Quill's code block structure if possible, or ensure pre/code are kept.
    turndownService.keep((node) => {
        return node.nodeName === 'PRE' || (node.nodeName === 'CODE' && node.parentElement.nodeName === 'PRE');
    });
    const markdown = turndownService.turndown(currentNote.content);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${currentNote.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'note'}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Note exported to Markdown.');
  };

  // --- UPDATED exportToPDF function ---
  const exportToPDF = async () => {
    if (!currentNote?.content || !currentNote.title) {
        toast.error("Note content or title is missing.");
        return;
    }

    toast.loading("Generating high-quality PDF...", { id: "pdf-toast" });

    try {
        const response = await apiClient.post('/api/export-pdf', {
            htmlContent: currentNote.content, // Send Quill's HTML content to the server
            noteTitle: currentNote.title
        }, {
            responseType: 'blob' // IMPORTANT: Tell axios to expect a binary file blob back
        });

        // Create a URL from the blob response
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);

        // Create a link element to trigger the download
        const link = document.createElement('a');
        link.href = url;

        // Try to get filename from server's Content-Disposition header, with a fallback
        const contentDisposition = response.headers['content-disposition'];
        let filename = `${currentNote.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'note'}.pdf`;
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/);
            if (filenameMatch && filenameMatch.length === 2) {
                filename = filenameMatch[1];
            }
        }
        
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();

        // Clean up by removing the link and revoking the object URL
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success("PDF downloaded successfully!", { id: "pdf-toast" });

    } catch (error) {
        console.error("Error exporting PDF via server:", error);
        // Attempt to parse error message from the server if it sent JSON back on failure
        let errorMessage = "Server-side PDF generation failed.";
        if (error.response && error.response.data && error.response.data instanceof Blob) {
            try {
                // If the server sent a JSON error, the blob needs to be parsed
                const errorJsonText = await error.response.data.text();
                const errorJson = JSON.parse(errorJsonText);
                errorMessage = errorJson.error || errorMessage;
            } catch (e) {
                // Fallback if parsing the error blob fails
                console.error("Could not parse error response blob:", e);
            }
        } else if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        toast.error(`PDF Export Failed: ${errorMessage}`, { id: "pdf-toast" });
    }
  };

  // --- sanitizedHtmlContentToRender remains the same ---
  const sanitizedHtmlContentToRender = useMemo(() => {
    if (!currentNote?.content) return '';
    return DOMPurify.sanitize(currentNote.content, { USE_PROFILES: { html: true } });
  }, [currentNote?.content]);

  // --- Loading/Error/Not Found logic remains the same ---
  if (notesLoading && !currentNote) return <LoadingSpinner text="Loading note details..." size="lg" />;
  if (notesError) return <div className="text-center text-red-500 dark:text-red-400 p-4">Error: {typeof notesError === 'string' ? notesError : 'Failed to load note.'}</div>;
  if (!currentNote && !notesLoading) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 p-4">
        Note not found or not loaded yet. <Link to="/notes" className="text-primary hover:underline">Go back to notes.</Link>
      </div>
    );
  }
  if (!currentNote) {
      return (
          <div className="text-center text-gray-500 dark:text-gray-400 p-4">
            Note is no longer available. <Link to="/notes" className="text-primary hover:underline">Return to notes list.</Link>
          </div>
      );
  }

  // --- JSX return remains the same ---
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Link to="/notes" className="flex items-center text-primary dark:text-primary-light hover:underline mb-4 text-sm">
          <ChevronLeft size={20} className="mr-1" /> Back to Notes
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-text-light dark:text-text-dark break-words">
            {currentNote.title}
          </h1>
          <div className="flex space-x-2 mt-2 sm:mt-0 flex-shrink-0">
            <Link
              to={`/notes/edit/${currentNote.id}`}
              className="p-2 text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary-light rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Edit Note"
            >
              <Edit3 size={20} />
            </Link>
            <button
              onClick={handleDelete}
              className="p-2 text-gray-600 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Delete Note"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center text-sm text-text-muted-light dark:text-text-muted-dark gap-x-4 gap-y-1">
          <span className="flex items-center">
            <Calendar size={14} className="mr-1.5" />
            Created: {currentNote.createdAt ? format(new Date(currentNote.createdAt), 'MMM d, yyyy') : 'N/A'}
          </span>
          <span className="flex items-center">
            <Clock size={14} className="mr-1.5" />
            Last Updated: {currentNote.updatedAt ? format(new Date(currentNote.updatedAt), 'MMM d, yyyy, p') : 'N/A'}
          </span>
        </div>
        {currentNote.tags && currentNote.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <Tag size={16} className="text-gray-500 dark:text-gray-400" />
            {currentNote.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2.5 py-1 bg-secondary/20 dark:bg-secondary-dark/30 text-secondary dark:text-secondary-light text-xs font-medium rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="my-6 p-4 bg-card-light dark:bg-card-dark shadow rounded-lg">
        <h2 className="text-lg font-semibold mb-3 text-text-light dark:text-text-dark flex items-center">
          <Brain size={20} className="mr-2 text-primary" /> AI Tools
        </h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setShowSummarizer(!showSummarizer)} className="flex items-center px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors" >
            <ListChecks size={16} className="mr-1.5" /> {showSummarizer ? 'Hide' : 'Show'} Summarizer
          </button>
          <Link to={`/quiz/${currentNote.id}`} className="flex items-center px-4 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors" >
            <Brain size={16} className="mr-1.5" /> Generate Quiz
          </Link>
          <button onClick={() => setShowCodeCheck(!showCodeCheck)} className="flex items-center px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors" >
            <ClipboardCheck size={16} className="mr-1.5" /> {showCodeCheck ? 'Hide' : 'Check'} code
          </button>
           <button onClick={() => setShowVersionHistory(!showVersionHistory)} className="flex items-center px-4 py-2 text-sm bg-purple-500 hover:bg-purple-600 text-white rounded-md transition-colors" >
            <History size={16} className="mr-1.5" /> {showVersionHistory ? 'Hide' : 'View'} Version History
          </button>
        </div>
        {showSummarizer && currentNote.content && ( <div className="mt-4"> <GeminiSummarizer textToSummarize={currentNote.content} /> </div> )}
        {showCodeCheck && (
          <CodeCheck
            noteTitle={currentNote.title}
            noteContext={(currentNote.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')}
          />
        )}
        {showVersionHistory && currentNote.versionHistory && currentNote.versionHistory.length > 0 && ( <div className="mt-4"> <VersionHistoryViewer versions={currentNote.versionHistory} currentContent={currentNote.content} onRevert={(versionContent) => { navigate(`/notes/edit/${currentNote.id}`, { state: { contentToRevert: versionContent } }); toast("Editor pre-filled with the selected version.", {
                          icon: <Info size={20} className="text-blue-500" />,
                          duration: 4000
                        }); }} /> </div> )}
      </div>

       <div className="my-6 p-4 bg-card-light dark:bg-card-dark shadow rounded-lg">
        <h2 className="text-lg font-semibold mb-3 text-text-light dark:text-text-dark flex items-center">
          <Share2 size={20} className="mr-2 text-primary" /> Revision, companies, and sharing
        </h2>
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-2">
          {currentNote.nextReviewAt
            ? `Next review ${format(new Date(currentNote.nextReviewAt), 'MMM d, yyyy')}.`
            : 'This note is not on a review schedule yet.'}
        </p>
        <ReviewButtons note={currentNote} />
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <select
            value={companyToAdd}
            onChange={(event) => setCompanyToAdd(event.target.value)}
            className="px-3 py-2 rounded-xl text-sm bg-white dark:bg-gray-800 border border-black/10 dark:border-white/10"
          >
            {COMPANIES.map((company) => <option key={company} value={company}>{company}</option>)}
          </select>
          <button type="button" onClick={addCompanyTag} className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-800 text-white rounded-xl">
            <Tag size={14} className="inline mr-1" /> Add company tag
          </button>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <button onClick={exportToMarkdown} className="flex items-center px-4 py-2 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors" >
            <Download size={16} className="mr-1.5" /> Export to Markdown
          </button>
          <button onClick={exportToPDF} className="flex items-center px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors" >
            <Printer size={16} className="mr-1.5" /> Export to PDF
          </button>
          <button onClick={handlePublish} disabled={publishing} className="flex items-center px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors disabled:opacity-60" >
            <Globe size={16} className="mr-1.5" /> {publishing ? 'Saving...' : currentNote.isPublic ? 'Make private' : 'Copy public link'}
          </button>
        </div>
        {currentNote.isPublic && (
          <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-3 break-all">
            Public page: {window.location.origin}/p/{currentNote.id}
          </p>
        )}
      </div>

      <article 
        id="note-content-for-pdf"
        className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl dark:prose-invert max-w-none p-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg ql-snow" 
      >
        <div
            className="ql-editor"
            dangerouslySetInnerHTML={{ __html: sanitizedHtmlContentToRender }}
        />
      </article>
    </div>
  );
};

export default NoteView;