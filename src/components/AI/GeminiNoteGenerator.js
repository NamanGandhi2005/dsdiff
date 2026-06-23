import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { generateNoteFromProblem, clearAiData } from '../../features/ai/aiSlice';
import { fetchLeetCodeProblem } from '../../api/piServerApi';
import { ClipboardPaste, Wand2, Loader2, AlertCircle, XCircle, Search, Code2, Hash } from 'lucide-react';
import toast from 'react-hot-toast';

const GeminiNoteGenerator = ({ onNoteGenerated }) => {
  const dispatch = useDispatch();
  const { loading: aiLoading, error: aiError } = useSelector((state) => ({
    loading: state.ai.loading.generateNote,
    error: state.ai.error.generateNote,
  }));

  const [activeTab, setActiveTab] = useState('leetcode'); // 'leetcode' or 'manual'
  const [problemText, setProblemText] = useState('');
  const [leetcodeId, setLeetcodeId] = useState('');
  const [fetchingLeetcode, setFetchingLeetcode] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);



  const handleGenerateNote = async (textToProcess = problemText, overrideTitle = '', overrideTags = []) => {
    if (!textToProcess.trim() || textToProcess.trim().length < 30) {
      toast.error("Problem statement is too short to generate a meaningful note.");
      return;
    }

    setHasGenerated(false);
    dispatch(clearAiData('generatedNote'));

    const resultAction = await dispatch(generateNoteFromProblem(textToProcess));
    
    if (generateNoteFromProblem.fulfilled.match(resultAction)) {
      toast.success("Note structure generated successfully!");
      setHasGenerated(true);
      if (onNoteGenerated) {
        // Construct final title and tags
        const finalTitle = overrideTitle || textToProcess.split('\n')[0].substring(0, 70) + "... (AI Generated)";
        const finalTags = overrideTags.length > 0 ? overrideTags : [];
        
        onNoteGenerated({ 
          title: finalTitle, 
          content: resultAction.payload, 
          tags: finalTags 
        });
      }
    } else if (generateNoteFromProblem.rejected.match(resultAction)) {
      toast.error(resultAction.payload || "Failed to generate note structure.");
    }
  };

  const handleLeetcodeFetchAndGenerate = async (e) => {
    e.preventDefault();
    if (!leetcodeId.trim()) {
      toast.error("Please enter a LeetCode question number or slug (e.g. 1 or two-sum).");
      return;
    }

    setFetchingLeetcode(true);
    setHasGenerated(false);
    dispatch(clearAiData('generatedNote'));

    toast.loading("Fetching LeetCode problem details...", { id: "leetcode-fetch" });

    try {
      const response = await fetchLeetCodeProblem(leetcodeId.trim());
      const { title, content, difficulty, tags, problemId } = response.data;
      
      toast.success(`Fetched: "${title}"`, { id: "leetcode-fetch" });
      
      // Save metadata for generating notes
      const formattedTitle = `LeetCode #${problemId}: ${title}`;
      const mappedTags = [difficulty, ...tags];

      // Build text for the AI prompt (clean description)
      const cleanDescription = content ? content.replace(/<[^>]*>/g, '') : '';
      const promptInput = `LeetCode #${problemId}: ${title}\nDifficulty: ${difficulty}\nTags: ${tags.join(', ')}\n\nProblem Description:\n${cleanDescription}`;

      setProblemText(promptInput); // Fill in the text area for reference

      // Trigger AI Note Generation
      await handleGenerateNote(promptInput, formattedTitle, mappedTags);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.message || "Failed to fetch LeetCode question.";
      toast.error(errMsg, { id: "leetcode-fetch" });
    } finally {
      setFetchingLeetcode(false);
    }
  };

  const handleClearGeneratedNote = () => {
    dispatch(clearAiData('generatedNote'));
    setProblemText('');
    setLeetcodeId('');
    setHasGenerated(false);
  };

  return (
    <div className="p-6 glass-panel rounded-3xl border border-white/20 dark:border-white/10 relative overflow-hidden shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-secondary/5 pointer-events-none"></div>

      <div className="relative z-10 flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-text-light dark:text-text-dark flex items-center">
          <Code2 size={24} className="mr-3 text-indigo-500" />
          Smart Note Builder
        </h3>
        {hasGenerated && (
          <button
            onClick={handleClearGeneratedNote}
            className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
            title="Clear and start over"
          >
            <XCircle size={20} />
          </button>
        )}
      </div>

      <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-5 font-light relative z-10">
        Choose to query LeetCode problems directly by ID, or manually paste custom questions.
      </p>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-black/5 dark:bg-white/5 rounded-2xl mb-5 relative z-10 max-w-xs border border-black/5 dark:border-white/5">
        <button
          type="button"
          onClick={() => {
            if (!fetchingLeetcode && !aiLoading) setActiveTab('leetcode');
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 ${
            activeTab === 'leetcode'
              ? 'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-sm'
              : 'text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark'
          }`}
        >
          <Hash size={14} /> LeetCode
        </button>
        <button
          type="button"
          onClick={() => {
            if (!fetchingLeetcode && !aiLoading) setActiveTab('manual');
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 ${
            activeTab === 'manual'
              ? 'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-sm'
              : 'text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark'
          }`}
        >
          <ClipboardPaste size={14} /> Custom Text
        </button>
      </div>

      {/* Tab Panels */}
      <div className="relative z-10">
        {activeTab === 'leetcode' ? (
          <form onSubmit={handleLeetcodeFetchAndGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted-light dark:text-text-muted-dark mb-1.5">
                Question Number or Slug
              </label>
              <div className="flex gap-3">
                <div className="relative flex-grow">
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    value={leetcodeId}
                    onChange={(e) => setLeetcodeId(e.target.value)}
                    placeholder="e.g. 1, 15, or 'three-sum'"
                    className="w-full py-2.5 pl-10 pr-4 glass-input rounded-xl text-sm"
                    disabled={fetchingLeetcode || aiLoading || hasGenerated}
                  />
                </div>
                <button
                  type="submit"
                  disabled={fetchingLeetcode || aiLoading || hasGenerated || !leetcodeId.trim()}
                  className="px-5 py-2.5 text-sm font-semibold text-white btn-apple-primary rounded-xl flex items-center gap-1.5 disabled:opacity-50"
                >
                  {fetchingLeetcode || aiLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Wand2 size={16} />
                  )}
                  <span>Fetch & Generate</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted-light dark:text-text-muted-dark mb-1.5">
                Problem Statement / Details
              </label>
              <textarea
                value={problemText}
                onChange={(e) => setProblemText(e.target.value)}
                placeholder="Paste your custom interview question details here..."
                rows={6}
                className="w-full p-3.5 glass-input rounded-2xl text-sm placeholder-gray-400 dark:placeholder-gray-500"
                disabled={aiLoading || hasGenerated}
              />
            </div>
            {!hasGenerated && (
              <button
                type="button"
                onClick={() => handleGenerateNote()}
                disabled={aiLoading || !problemText.trim()}
                className="w-full flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white btn-apple-primary rounded-xl disabled:opacity-50"
              >
                {aiLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" /> Generating Note Structure...
                  </>
                ) : (
                  <>
                    <Wand2 size={16} className="mr-2" /> Generate Note Structure
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Loading & Feedback States */}
      {(fetchingLeetcode || aiLoading) && (
        <div className="mt-4 flex items-center justify-center p-4 bg-indigo-500/5 dark:bg-indigo-400/5 border border-indigo-500/10 dark:border-indigo-400/10 rounded-2xl relative z-10 text-sm text-indigo-700 dark:text-indigo-300 font-light">
          <Loader2 size={18} className="animate-spin mr-2 text-indigo-500" />
          <span>{fetchingLeetcode ? "Connecting to LeetCode API..." : "Gemini is building your note framework..."}</span>
        </div>
      )}

      {aiError && !aiLoading && (
        <div className="mt-4 flex items-center p-4 bg-red-500/5 border border-red-500/10 rounded-2xl relative z-10 text-sm text-red-600 dark:text-red-400">
          <AlertCircle size={18} className="mr-2 flex-shrink-0" />
          <span>Error generating note: {aiError}</span>
        </div>
      )}
    </div>
  );
};

export default GeminiNoteGenerator;