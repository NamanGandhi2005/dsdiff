import React, { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { History, Eye, Repeat, AlertTriangle } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
// import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer'; // Optional: for rich diffs

// If you want to use react-diff-viewer for side-by-side diffs:
// npm install react-diff-viewer

const VersionHistoryViewer = ({ versions, onRevert, currentContent }) => {
  const [selectedVersionContent, setSelectedVersionContent] = useState(null);
  const [selectedVersionTimestamp, setSelectedVersionTimestamp] = useState(null);
  // const [showDiff, setShowDiff] = useState(false); // For react-diff-viewer

  if (!versions || versions.length === 0) {
    return (
      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
        <History size={32} className="mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
          No version history available for this note yet.
        </p>
        <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1">
          Changes will be saved automatically as you edit.
        </p>
      </div>
    );
  }

  // Sort versions: most recent first
  const sortedVersions = [...versions].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const handlePreviewVersion = (version) => {
    const rawHtml = marked.parse(version.content || '', { gfm: true, breaks: true });
    setSelectedVersionContent(DOMPurify.sanitize(rawHtml));
    setSelectedVersionTimestamp(version.timestamp);
    // setShowDiff(false); // Reset diff view
  };

  // const handleShowDiff = (version) => {
  //   setSelectedVersionContent(version.content); // Store raw content for diff
  //   setSelectedVersionTimestamp(version.timestamp);
  //   setShowDiff(true);
  // };

  const handleRevertClick = (version) => {
    if (window.confirm(`Are you sure you want to revert to the version from ${format(new Date(version.timestamp), 'MMM d, yyyy, p')}? This will replace the current content in the editor.`)) {
      onRevert(version.content);
      setSelectedVersionContent(null); // Close preview after revert
      setSelectedVersionTimestamp(null);
    }
  };


  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 shadow">
      <h4 className="text-md font-semibold text-text-light dark:text-text-dark mb-3 flex items-center">
        <History size={18} className="mr-2 text-purple-500" />
        Note Version History
      </h4>
      {sortedVersions.length <= 1 && (
         <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
            Only one version saved. More versions will appear as you make changes.
        </p>
      )}

      <div className="max-h-60 overflow-y-auto pr-2 space-y-2 mb-4 custom-scrollbar">
        {sortedVersions.map((version, index) => (
          <div
            key={version.timestamp || index} // Fallback to index if timestamp is missing (should not happen)
            className={`p-2.5 border rounded-md transition-colors
              ${selectedVersionTimestamp === version.timestamp
                ? 'bg-purple-100 dark:bg-purple-900/50 border-purple-400 dark:border-purple-600'
                : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700'
              }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-text-light dark:text-text-dark">
                {version.timestamp ? format(new Date(version.timestamp), 'MMM d, yyyy, p') : 'Unknown time'}
                <span className="text-text-muted-light dark:text-text-muted-dark ml-1">
                  ({version.timestamp ? formatDistanceToNow(new Date(version.timestamp), { addSuffix: true }) : ''})
                </span>
                 {index === 0 && <span className="ml-2 text-xs px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100 rounded-full">Latest</span>}
              </span>
              <div className="flex space-x-1.5">
                <button
                  onClick={() => handlePreviewVersion(version)}
                  title="Preview this version"
                  className="p-1 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <Eye size={16} />
                </button>
                {/* <button
                  onClick={() => handleShowDiff(version)}
                  title="Compare with current"
                  disabled={!currentContent} // Disable if no current content to compare against
                  className="p-1 text-gray-500 hover:text-orange-500 dark:text-gray-400 dark:hover:text-orange-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  <GitCompareArrows size={16} /> Diff
                </button> */}
                {index !== 0 && ( // Don't allow reverting to the latest version itself
                    <button
                        onClick={() => handleRevertClick(version)}
                        title="Revert to this version"
                        className="p-1 text-gray-500 hover:text-green-500 dark:text-gray-400 dark:hover:text-green-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                        <Repeat size={16} />
                    </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedVersionContent && (
        <div className="mt-4 p-3 border border-purple-300 dark:border-purple-700 rounded-lg bg-white dark:bg-gray-700">
          <h5 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">
            Previewing version from: {selectedVersionTimestamp ? format(new Date(selectedVersionTimestamp), 'MMM d, yyyy, p') : ''}
          </h5>
          {/* {showDiff && currentContent ? (
             <ReactDiffViewer
                oldValue={selectedVersionContent} // Assuming this is the raw "old" version for diff
                newValue={currentContent} // Raw current content from editor
                splitView={true}
                compareMethod={DiffMethod.WORDS} // Or CHARS, LINES
                styles={{
                    variables: {
                        dark: {
                           diffViewerBackground: '#2D3748', // card.dark
                           emptyLineBackground: '#2D3748',
                           gutterBackground: '#1A202C', // background.dark
                           line: {
                             text: '#E2E8F0', // text.dark
                           }
                        }
                    }
                }}
                useDarkTheme={document.documentElement.classList.contains('dark')} // Detect theme
                leftTitle="Selected Version"
                rightTitle="Current Editor Content"
            />
          ) : ( */}
            <div
              className="prose prose-sm dark:prose-invert max-w-none max-h-80 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-800 rounded shadow-inner"
              dangerouslySetInnerHTML={{ __html: selectedVersionContent }}
            />
          {/* )} */}
          <button
            onClick={() => handleRevertClick({ content: versions.find(v => v.timestamp === selectedVersionTimestamp)?.content, timestamp: selectedVersionTimestamp })}
            className="mt-3 w-full sm:w-auto flex items-center justify-center px-4 py-2 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
          >
            <Repeat size={14} className="mr-1.5" /> Revert Editor to this Version
          </button>
        </div>
      )}
       {!selectedVersionContent && versions.length > 1 && (
         <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-2 italic">
            Select a version above to preview or revert.
        </p>
       )}
    </div>
  );
};

export default VersionHistoryViewer;