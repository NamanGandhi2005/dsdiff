import React, { useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import toast from 'react-hot-toast';
import { ClipboardCheck } from 'lucide-react';
import { checkCodeOnPi } from '../../api/piServerApi';

const CodeCheck = ({ noteTitle, noteContext }) => {
  const [code, setCode] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const runCheck = async () => {
    if (code.trim().length < 20) {
      toast.error('Paste a bit more code before checking it.');
      return;
    }
    setLoading(true);
    setResult('');
    try {
      const response = await checkCodeOnPi({
        code,
        noteTitle,
        noteContext: (noteContext || '').slice(0, 2000),
      });
      setResult(response.data?.review || '');
    } catch (error) {
      toast.error(error.response?.data?.error || error.message || 'Code check failed.');
    } finally {
      setLoading(false);
    }
  };

  const html = result
    ? DOMPurify.sanitize(typeof marked.parse === 'function' ? marked.parse(result) : marked(result))
    : '';

  return (
    <div className="mt-4 space-y-3">
      <textarea
        value={code}
        onChange={(event) => setCode(event.target.value)}
        rows={10}
        placeholder="Paste the solution you just wrote. You get complexity, likely bugs, and a cleaner version."
        className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/20 text-sm font-mono text-text-light dark:text-text-dark"
      />
      <button
        type="button"
        onClick={runCheck}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-60"
      >
        <ClipboardCheck size={16} className="mr-2" />
        {loading ? 'Checking...' : 'Check this code'}
      </button>
      {html && (
        <div
          className="prose prose-sm dark:prose-invert max-w-none p-4 rounded-xl bg-white/80 dark:bg-black/30"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
};

export default CodeCheck;
