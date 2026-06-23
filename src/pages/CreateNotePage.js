// src/pages/CreateNotePage.js
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { addNote } from '../features/notes/notesSlice';
import { updateTopicProgress } from '../features/dsaTopics/topicsSlice';
import NoteEditor from '../components/Notes/NoteEditor';
import GeminiNoteGenerator from '../components/AI/GeminiNoteGenerator';
import toast from 'react-hot-toast';
import { FilePlus, Wand2, ChevronLeft, FileText, BookCopy, GitCompareArrows } from 'lucide-react'; // Added icons for templates
import { marked } from 'marked';

// --- TEMPLATE DEFINITIONS ---
const templates = {
  problemSolution: {
    title: "Problem: [Problem Name]",
    content: `
<h1>Problem Statement</h1>
<p>(Paste problem description here)</p>
<br>
<h1>Constraints</h1>
<ul>
  <li>Constraint 1...</li>
  <li>Constraint 2...</li>
</ul>
<br>
<h1>Intuition & Approach</h1>
<p>(Your detailed thoughts on how to approach the problem)</p>
<br>
<h1>Code</h1>
<pre class="ql-syntax" spellcheck="false">// Your code here, e.g., in JavaScript
</pre>
<br>
<h1>Complexity Analysis</h1>
<ul>
  <li><strong>Time Complexity:</strong> O(...)</li>
  <li><strong>Space Complexity:</strong> O(...)</li>
</ul>
<br>
<h1>Edge Cases</h1>
<ul>
  <li>(Consider edge cases like empty inputs, single element arrays, etc.)</li>
</ul>
`
  },
  conceptDeepDive: {
    title: "Concept: [Concept Name]",
    content: `
<h1>Concept Overview</h1>
<p>(A brief, high-level summary of the concept.)</p>
<br>
<h1>Core Principles</h1>
<p>(Explain the fundamental rules or ideas behind the concept.)</p>
<br>
<h1>Use Cases</h1>
<ul>
  <li>When is this concept useful?</li>
  <li>Example types of problems it solves.</li>
</ul>
<br>
<h1>Example Implementation</h1>
<pre class="ql-syntax" spellcheck="false">// A simple code example demonstrating the concept
</pre>
<br>
<h1>Pros & Cons</h1>
<ul>
  <li><strong>Pros:</strong> ...</li>
  <li><strong>Cons:</strong> ...</li>
</ul>
`
  },
  algorithmComparison: {
    title: "Comparison: [Algo A] vs [Algo B]",
    content: `
<h1>Algorithm A: [Name]</h1>
<p><strong>Description:</strong> ...</p>
<p><strong>Time Complexity:</strong> ...</p>
<p><strong>Space Complexity:</strong> ...</p>
<br>
<h1>Algorithm B: [Name]</h1>
<p><strong>Description:</strong> ...</p>
<p><strong>Time Complexity:</strong> ...</p>
<p><strong>Space Complexity:</strong> ...</p>
<br>
<h1>Key Differences & Trade-offs</h1>
<ul>
  <li>When to use Algo A over Algo B?</li>
  <li>Performance differences in specific scenarios.</li>
  <li>Implementation complexity differences.</li>
</ul>
`
  }
};


const CreateNotePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { loading: savingNote, error: globalSaveError } = useSelector((state) => state.notes);

  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [aiGeneratedContent, setAiGeneratedContent] = useState({ title: '', content: '', tags: [] });

  const handleSaveNote = async (noteDataFromEditor) => {
    // ... (This function remains the same)
    if (!user || !user.uid) {
      toast.error("You must be logged in to save notes.");
      return;
    }
    if (!noteDataFromEditor.title || !noteDataFromEditor.title.trim()) {
        toast.error("Note title cannot be empty.");
        return;
    }
    const resultAction = await dispatch(addNote({
      userId: user.uid,
      title: noteDataFromEditor.title,
      content: noteDataFromEditor.content,
      tags: noteDataFromEditor.tags || [],
    }));
    if (addNote.fulfilled.match(resultAction)) {
      toast.success('Note created successfully!');
      dispatch(updateTopicProgress());
      if (resultAction.payload && resultAction.payload.id) {
        navigate(`/notes/${resultAction.payload.id}`);
      } else {
        navigate('/notes');
      }
    } else {
      const errorMessage = resultAction.payload || globalSaveError || 'Failed to create note. Please try again.';
      toast.error(`Failed to create note: ${errorMessage}`);
    }
  };

  const handleNoteFromAI = ({ title, content, tags }) => {
    let suggestedTags = tags || [];
    if (suggestedTags.length === 0 && title && typeof title === 'string') {
        const firstWordTag = title.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/gi, '');
        if (firstWordTag) { suggestedTags.push(firstWordTag); }
    }
    
    // Convert AI markdown response to HTML for ReactQuill editor compatibility
    let htmlContent = content;
    try {
      htmlContent = marked.parse(content);
    } catch (e) {
      console.error("Error parsing markdown to HTML:", e);
    }

    setAiGeneratedContent({ title, content: htmlContent, tags: suggestedTags });
    setShowAiGenerator(false);
    toast("AI content ready! Review and save your new note.");
  };

  // --- NEW FUNCTION TO HANDLE TEMPLATE SELECTION ---
  const handleSelectTemplate = (templateType) => {
    const selectedTemplate = templates[templateType];
    if (selectedTemplate) {
        setAiGeneratedContent({
            title: selectedTemplate.title,
            content: selectedTemplate.content,
            tags: [] // Start with empty tags for templates
        });
        setShowAiGenerator(false); // Make sure the editor is shown
        toast.success(`'${selectedTemplate.title}' template loaded!`);
    }
  };

  // Condition to show templates: user hasn't started writing, using AI, or chosen a template yet.
  const showTemplates = !showAiGenerator && !aiGeneratedContent.content && !aiGeneratedContent.title;

  return (
    <div className="space-y-6">
      <Link to="/notes" className="flex items-center text-primary dark:text-primary-light hover:underline mb-4 text-sm">
        <ChevronLeft size={18} className="mr-1" /> Back to Notes List
      </Link>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-2 relative z-10">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-light dark:text-text-dark flex items-center tracking-tight">
          <FilePlus size={28} className="mr-3 text-indigo-500" /> Create New DSA Note
        </h1>
        <button
          onClick={() => {
            setShowAiGenerator(!showAiGenerator);
            if (!showAiGenerator) {
                // When showing AI generator, clear any template content
                setAiGeneratedContent({ title: '', content: '', tags: [] });
            }
          }}
          className="mt-3 sm:mt-0 flex items-center px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-md transition-all duration-300 text-sm"
        >
          <Wand2 size={18} className="mr-2" />
          {showAiGenerator ? 'Go Back to Manual/Templates' : 'Generate with AI'}
        </button>
      </div>

      {/* --- NEW TEMPLATE SELECTION UI --- */}
      {showTemplates && (
        <div className="p-6 glass-panel rounded-3xl border border-dashed border-indigo-500/30 dark:border-indigo-400/20 relative z-10">
            <h3 className="text-base font-bold text-text-light dark:text-text-dark mb-4">Or, start with a template:</h3>
            <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => handleSelectTemplate('problemSolution')} className="flex-1 flex items-center justify-center p-4 text-sm font-semibold rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-light dark:text-text-dark border border-black/5 dark:border-white/5 transition-all">
                    <FileText size={16} className="mr-2 text-primary" /> Problem Solution
                </button>
                <button onClick={() => handleSelectTemplate('conceptDeepDive')} className="flex-1 flex items-center justify-center p-4 text-sm font-semibold rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-light dark:text-text-dark border border-black/5 dark:border-white/5 transition-all">
                    <BookCopy size={16} className="mr-2 text-green-500" /> Concept Deep Dive
                </button>
                 <button onClick={() => handleSelectTemplate('algorithmComparison')} className="flex-1 flex items-center justify-center p-4 text-sm font-semibold rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-light dark:text-text-dark border border-black/5 dark:border-white/5 transition-all">
                    <GitCompareArrows size={16} className="mr-2 text-purple-500" /> Algorithm Comparison
                </button>
            </div>
        </div>
      )}

      {showAiGenerator && (
        <div className="my-6">
          <GeminiNoteGenerator onNoteGenerated={handleNoteFromAI} />
        </div>
      )}

      {/* Hide NoteEditor if showing templates or AI generator */}
      {!showAiGenerator && (
        <NoteEditor
          initialTitle={aiGeneratedContent.title}
          initialContent={aiGeneratedContent.content}
          initialTags={aiGeneratedContent.tags}
          onSave={handleSaveNote}
          onCancel={() => {
            // When cancelling, reset state and go back
            setAiGeneratedContent({ title: '', content: '', tags: [] });
            navigate('/notes');
          }}
          saving={savingNote}
        />
      )}
       {globalSaveError && !savingNote && <p className="text-red-500 text-sm mt-2">Error: {typeof globalSaveError === 'string' ? globalSaveError : 'Could not save note.'}</p>}
    </div>
  );
};

export default CreateNotePage;