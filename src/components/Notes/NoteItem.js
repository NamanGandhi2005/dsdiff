import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FileText, Edit3, Trash2, Tag, Calendar } from 'lucide-react';
import { marked } from 'marked'; // To get a plain text preview

// Configure marked to output plain text for preview
const plainTextRenderer = new marked.Renderer();
plainTextRenderer.strong = text => text;
plainTextRenderer.em = text => text;
plainTextRenderer.codespan = text => text;
plainTextRenderer.code = (code, language) => ''; // Remove code blocks for preview
plainTextRenderer.blockquote = quote => '';
plainTextRenderer.html = html => '';
plainTextRenderer.heading = (text, level) => `${text} `;
plainTextRenderer.hr = () => '';
plainTextRenderer.list = (body, ordered, start) => body;
plainTextRenderer.listitem = text => `${text.trim()} `;
plainTextRenderer.checkbox = checked => '';
plainTextRenderer.paragraph = text => `${text.trim()} `;
plainTextRenderer.table = (header, body) => '';
plainTextRenderer.tablerow = content => '';
plainTextRenderer.tablecell = (content, flags) => '';
plainTextRenderer.link = (href, title, text) => text;
plainTextRenderer.image = (href, title, text) => '';
plainTextRenderer.text = text => text;

const NoteItem = ({ note, onDelete }) => {
  const getPlainTextPreview = (htmlContent, maxLength = 150) => {
    if (!htmlContent) return 'No content preview available.';
    try {
      const plainText = marked(htmlContent, { renderer: plainTextRenderer, gfm: true, breaks: false });
      // Remove extra spaces and newlines from plain text
      const cleanedText = plainText.replace(/\s\s+/g, ' ').trim();
      return cleanedText.length > maxLength ? cleanedText.substring(0, maxLength) + '...' : cleanedText;
    } catch (error) {
      console.error("Error parsing HTML for preview:", error);
      return "Preview not available.";
    }
  };

  const contentPreview = getPlainTextPreview(note.content);

  return (
    <div className="glass-card glass-card-interactive p-6 rounded-3xl flex flex-col justify-between border border-white/20 dark:border-white/10 relative overflow-hidden group">
      <div className="relative z-10">
        <Link to={`/notes/${note.id}`} className="block mb-2.5">
          <h3 className="text-xl font-bold text-text-light dark:text-text-dark group-hover:text-primary dark:group-hover:text-primary-light hover:underline truncate transition-colors duration-300">
            <FileText size={20} className="inline-block mr-2 mb-1 text-indigo-500 dark:text-indigo-400" />
            {note.title || 'Untitled Note'}
          </h3>
        </Link>
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-4 h-12 overflow-hidden leading-relaxed font-light">
          {contentPreview}
        </p>
        {note.tags && note.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5 items-center">
            <Tag size={14} className="text-gray-400 dark:text-gray-500 mr-0.5" />
            {note.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2.5 py-0.5 bg-secondary/10 dark:bg-secondary-dark/20 text-secondary dark:text-secondary-light text-xs font-semibold rounded-lg border border-secondary/15"
              >
                {tag}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
                +{note.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
      <div className="mt-auto pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between relative z-10">
        <div className="text-xs text-text-muted-light dark:text-text-muted-dark flex items-center font-light">
          <Calendar size={14} className="inline-block mr-1.5 text-indigo-400" />
          Updated {note.updatedAt ? formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true }) : 'recently'}
        </div>
        <div className="flex space-x-2">
          <Link
            to={`/notes/edit/${note.id}`}
            className="p-2 text-blue-600 hover:text-white dark:text-blue-400 dark:hover:text-white rounded-xl hover:bg-blue-500 dark:hover:bg-blue-600 border border-blue-500/10 hover:border-blue-500 transition-all duration-300"
            aria-label="Edit Note"
          >
            <Edit3 size={16} />
          </Link>
          <button
            onClick={() => onDelete(note.id)}
            className="p-2 text-red-600 hover:text-white dark:text-red-400 dark:hover:text-white rounded-xl hover:bg-red-500 dark:hover:bg-red-600 border border-red-500/10 hover:border-red-500 transition-all duration-300"
            aria-label="Delete Note"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteItem;