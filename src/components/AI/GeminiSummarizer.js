import React, { useState ,useMemo} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { summarizeText, clearAiData } from '../../features/ai/aiSlice';
import { BookText, Wand2, Loader2, AlertCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
 // Or useEffect, etc.


const GeminiSummarizer = ({ textToSummarize, onSummaryReady }) => {
  const dispatch = useDispatch();
  const { summary, loading, error } = useSelector((state) => ({
    summary: state.ai.summary,
    loading: state.ai.loading.summarize,
    error: state.ai.error.summarize,
  }));
  const [hasSummarized, setHasSummarized] = useState(false);

  const handleSummarize = async () => {
    if (!textToSummarize || textToSummarize.trim().length < 50) { // Min length for meaningful summary
      toast.error("Please provide more content to summarize (at least 50 characters).");
      return;
    }
    setHasSummarized(false); // Reset on new attempt
    dispatch(clearAiData('summary')); // Clear previous summary and error
    const resultAction = await dispatch(summarizeText(textToSummarize));
    if (summarizeText.fulfilled.match(resultAction)) {
      toast.success("Summary generated successfully!");
      setHasSummarized(true);
      if (onSummaryReady) {
        onSummaryReady(resultAction.payload);
      }
    } else if (summarizeText.rejected.match(resultAction)) {
      toast.error(resultAction.payload || "Failed to generate summary.");
    }
  };

  const handleClearSummary = () => {
    dispatch(clearAiData('summary'));
    setHasSummarized(false);
  };
  
  const sanitizedSummaryHtml = useMemo(() => {
    if (!summary) return '';
    // Assuming summary might contain Markdown
    const rawHtml = marked.parse(summary, { gfm: true, breaks: true });
    return DOMPurify.sanitize(rawHtml);
  }, [summary]);


  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 shadow">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-md font-semibold text-text-light dark:text-text-dark flex items-center">
          <BookText size={18} className="mr-2 text-blue-500" />
          AI-Powered Summary
        </h4>
        {summary && hasSummarized && (
          <button
            onClick={handleClearSummary}
            className="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
            title="Clear Summary"
          >
            <XCircle size={18} />
          </button>
        )}
      </div>


      {!summary && !loading && !error && !hasSummarized &&(
        <button
          onClick={handleSummarize}
          disabled={loading || !textToSummarize}
          className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin mr-2" /> Generating Summary...
            </>
          ) : (
            <>
              <Wand2 size={16} className="mr-2" /> Generate Summary
            </>
          )}
        </button>
      )}

      {loading && (
        <div className="flex items-center justify-center p-3 text-sm text-blue-700 bg-blue-100 rounded-md dark:bg-blue-900/30 dark:text-blue-300">
          <Loader2 size={20} className="animate-spin mr-2" />
          <span>Generating summary, please wait...</span>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center p-3 text-sm text-red-700 bg-red-100 rounded-md border border-red-300 dark:bg-red-900/50 dark:text-red-200 dark:border-red-700">
          <AlertCircle size={20} className="mr-2 flex-shrink-0" />
          <span>Error: {error}</span>
        </div>
      )}

      {summary && hasSummarized && !loading && !error && (
        <div className="mt-3 prose prose-sm dark:prose-invert max-w-none p-3 bg-white dark:bg-gray-700 rounded-md shadow-inner">
           <div dangerouslySetInnerHTML={{ __html: sanitizedSummaryHtml }} />
        </div>
      )}
    </div>
  );
};

export default GeminiSummarizer;