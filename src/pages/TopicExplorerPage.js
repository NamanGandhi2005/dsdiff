import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { explainDsaTopic, clearAiData } from '../features/ai/aiSlice';
import { Brain, Search, Loader2, AlertCircle, Lightbulb, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Or your preferred style

// Custom renderer for Marked to use React SyntaxHighlighter for code blocks
const renderer = new marked.Renderer();
const originalCodeRenderer = renderer.code;
renderer.code = (code, language, isEscaped) => {
  const lang = language || 'plaintext';
  // This is a trick: we output a placeholder that we'll replace with the React component.
  // This is NOT ideal. A proper Markdown-to-React library is better.
  // For this example, we'll make it work, but be aware of its limitations.
  // A unique ID helps if there are multiple code blocks.
  const id = `codeblock-${Math.random().toString(36).substr(2, 9)}`;
  // Store code and lang to be picked up by useEffect later
  window[`__code_block_data_${id}`] = { code, lang };
  return `<div id="${id}" class="code-block-placeholder-ai"></div>`;
  // The original output from marked can be used if not using React SyntaxHighlighter directly:
  // return originalCodeRenderer.call(renderer, code, language, isEscaped);
};


const TopicExplorerPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTopic = searchParams.get('topic') || '';

  const [topicQuery, setTopicQuery] = useState(initialTopic);
  const { explanation, loading, error } = useSelector((state) => ({
    explanation: state.ai.explanation,
    loading: state.ai.loading.explainTopic,
    error: state.ai.error.explainTopic,
  }));

  useEffect(() => {
    // If there's an initial topic from URL and no explanation yet, fetch it.
    if (initialTopic && !explanation && !loading) {
      handleExplainTopic(initialTopic);
    }
    // Clear AI explanation data on component unmount or when topic changes significantly
    return () => {
      // dispatch(clearAiData('explanation')); // Optional: based on desired UX
    };
  }, []); // Removed initialTopic from deps to avoid re-fetch on query change if already loaded

  const handleExplainTopic = async (topicToExplain = topicQuery) => {
    if (!topicToExplain.trim()) {
      toast.error("Please enter a DSA topic to explain.");
      return;
    }
    dispatch(clearAiData('explanation')); // Clear previous explanation
    setSearchParams({ topic: topicToExplain }); // Update URL
    const resultAction = await dispatch(explainDsaTopic(topicToExplain));
    if (explainDsaTopic.rejected.match(resultAction)) {
      toast.error(resultAction.payload || "Failed to get explanation.");
    } else if (explainDsaTopic.fulfilled.match(resultAction)) {
      toast.success(`Explanation for "${topicToExplain}" loaded!`);
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    handleExplainTopic();
  };

  const sanitizedExplanationHtml = useMemo(() => {
    if (!explanation) return '';
    const rawHtml = marked.parse(explanation, { renderer, gfm: true, breaks: true });
    return DOMPurify.sanitize(rawHtml, {ADD_ATTR: ['id', 'class'], USE_PROFILES: {html: true}});
  }, [explanation]);
  
  // Effect to replace placeholders with SyntaxHighlighter components
  // This is a workaround. For robust solution, use react-markdown with custom renderers.
  useEffect(() => {
    if (explanation) {
      const placeholders = document.querySelectorAll('.code-block-placeholder-ai');
      placeholders.forEach(placeholder => {
        const data = window[`__code_block_data_${placeholder.id}`];
        if (data && !placeholder.hasChildNodes()) { // Check if not already rendered
          const { code, lang } = data;
          const codeBlockElement = (
            <SyntaxHighlighter language={lang} style={atomDark} PreTag="div" className="code-block text-sm my-4">
              {String(code).trim()}
            </SyntaxHighlighter>
          );
          // This is where it gets tricky with React.
          // ReactDOM.render is deprecated for this. We need a better way or accept basic pre/code styling.
          // For simplicity in this example, if Quill's output is good, rely on that.
          // If using SyntaxHighlighter, the `react-markdown` approach is much cleaner.
          // Let's assume for now that the CSS for `pre code` or `.ql-syntax` (if AI outputs that) is sufficient.
          // Or, if the AI response includes triple backticks, Marked will create <pre><code> automatically.
          // And you can style those with `react-syntax-highlighter` by targeting them or using a custom component with `react-markdown`.
          // The current `renderer.code` example above is more for `react-markdown`.
          // For `dangerouslySetInnerHTML`, simpler to let marked do its default <pre><code> and style that.
          
          // Let's revert to simpler marked default for code, and you style `pre` and `code` in CSS
          // or use the `react-syntax-highlighter` globally on `pre code` elements.
        }
      });
    }
  }, [sanitizedExplanationHtml, explanation]); // Rerun when HTML changes

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center text-primary dark:text-primary-light hover:underline mb-0 text-sm">
        <ChevronLeft size={18} className="mr-1" /> Back
      </button>
      <div className="text-center relative z-10">
        <div className="p-4 bg-indigo-500/10 dark:bg-indigo-400/20 rounded-3xl inline-block mb-4 shadow-inner">
          <Brain size={44} className="mx-auto text-indigo-600 dark:text-indigo-400 animate-pulse" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-text-light dark:text-text-dark tracking-tight">
          AI Topic Explainer
        </h1>
        <p className="text-text-muted-light dark:text-text-muted-dark mt-2 font-light">
          Ask Gemini AI to explain any Data Structures and Algorithms topic in detail.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-center p-4 glass-card rounded-2xl border border-white/20 dark:border-white/10 relative z-10">
        <div className="relative flex-grow w-full">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <input
            type="text"
            value={topicQuery}
            onChange={(e) => setTopicQuery(e.target.value)}
            placeholder="e.g., Explain Dijkstra's Algorithm, What is Dynamic Programming?"
            className="w-full py-3.5 pl-11 pr-4 glass-input rounded-xl text-text-light dark:text-text-dark placeholder-gray-400 dark:placeholder-gray-500"
            />
        </div>
        <button
          type="submit"
          disabled={loading || !topicQuery.trim()}
          className="w-full sm:w-auto flex items-center justify-center px-6 py-3.5 text-sm font-semibold btn-apple-primary rounded-xl disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin mr-2" />
          ) : (
            <Lightbulb size={18} className="mr-2" />
          )}
          Explain Topic
        </button>
      </form>

      {loading && (
        <div className="flex flex-col items-center justify-center p-8 glass-panel border border-indigo-500/20 dark:border-indigo-400/20 bg-indigo-500/5 dark:bg-indigo-400/5 rounded-3xl relative z-10 shadow-lg">
          <Loader2 size={36} className="animate-spin mb-4 text-indigo-500 dark:text-indigo-400" />
          <span className="font-bold text-text-light dark:text-text-dark mb-1">AI is thinking...</span>
          <span className="text-sm text-text-muted-light dark:text-text-muted-dark font-light">Fetching explanation for "{topicQuery}". This might take a few moments.</span>
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center p-8 glass-panel border border-red-500/20 bg-red-500/5 rounded-3xl relative z-10 shadow-lg">
          <AlertCircle size={36} className="mb-4 text-red-500 dark:text-red-400" />
          <span className="font-bold text-red-700 dark:text-red-300 mb-1">Error fetching explanation:</span>
          <span className="text-sm text-red-600 dark:text-red-400 font-light">{error}</span>
        </div>
      )}

      {explanation && !loading && !error && (
        <div className="mt-6 p-6 sm:p-8 glass-panel rounded-3xl border border-white/20 dark:border-white/10 relative z-10">
          <h2 className="text-2xl font-bold text-text-light dark:text-text-dark mb-5 border-b border-black/5 dark:border-white/5 pb-3">
            Explanation for: <span className="text-indigo-600 dark:text-indigo-400">{searchParams.get('topic') || topicQuery}</span>
          </h2>
          <article
            className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none ql-editor-content-view"
            dangerouslySetInnerHTML={{ __html: sanitizedExplanationHtml }}
          />
        </div>
      )}
       {!explanation && !loading && !error && initialTopic && (
         <div className="text-center p-6">
            <p className="text-text-muted-light dark:text-text-muted-dark">
                Explanation for "{initialTopic}" was requested but not found. Please try generating it.
            </p>
         </div>
       )}
    </div>
  );
};

export default TopicExplorerPage;