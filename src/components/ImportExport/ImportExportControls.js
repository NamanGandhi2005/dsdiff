import React, { useRef } from 'react';
import { UploadCloud, DownloadCloud, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { addNote } from '../../features/notes/notesSlice';
import TurndownService from 'turndown';
import { marked } from 'marked';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdf.js worker (CHOOSE ONE METHOD)

// Method 1: Using worker from public folder (Recommended for CRA/Webpack/Vite)
// Ensure you've copied 'pdf.worker.min.js' from 'node_modules/pdfjs-dist/build/' to your 'public/' folder.
pdfjsLib.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.js`;

// Method 2: Using CDN (Simpler setup, but relies on external resource)
// pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;


const ImportExportControls = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { notesList, loading: notesLoading } = useSelector(state => state.notes); // Assuming loading state for addNote
  const fileInputRef = useRef(null);
  const [isImporting, setIsImporting] = React.useState(false);

  const handleFileImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);
    const importToastId = toast.loading(`Importing "${file.name}"...`);

    const fileName = file.name.toLowerCase();
    const reader = new FileReader();

    reader.onload = async (e) => {
      const fileContent = e.target.result; // This will be ArrayBuffer for PDF, text for others
      let noteTitle = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      let noteHtmlContent = ''; // This will be HTML for Quill

      try {
        if (fileName.endsWith('.md')) {
          noteHtmlContent = marked.parse(fileContent); // Convert Markdown to HTML
          toast.success(`Markdown file "${file.name}" imported!`, { id: importToastId });
        } else if (fileName.endsWith('.txt')) {
          // For plain text, wrap paragraphs in <p> tags and convert newlines for Quill
          noteHtmlContent = fileContent.split(/\r?\n\r?\n/) // Split by double newlines (paragraphs)
            .map(p => `<p>${p.replace(/\r?\n/g, '<br>')}</p>`) // Replace single newlines with <br> within paragraphs
            .join('');
          toast.success(`Text file "${file.name}" imported!`, { id: importToastId });
        } else if (fileName.endsWith('.pdf')) {
          try {
            const typedArray = new Uint8Array(fileContent); // fileContent is ArrayBuffer here
            const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
            let extractedText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              // textContent.items is an array of objects with 'str' (the text) and 'transform' (position)
              // For basic import, we can just join 'str'.
              // For better formatting, you'd analyze 'transform' to detect paragraphs, lines.
              extractedText += textContent.items.map(item => item.str).join(' ') + '\n\n'; // Add double newline between pages
              if (i < pdf.numPages) extractedText += '\n\n'; // Paragraph break between pages
            }
            // Convert extracted text to basic HTML paragraphs for Quill
            noteHtmlContent = extractedText.split(/\r?\n\r?\n/)
              .filter(p => p.trim() !== '') // Remove empty paragraphs
              .map(p => `<p>${p.replace(/\r?\n/g, '<br>')}</p>`)
              .join('');
            toast.success(`PDF "${file.name}" imported (text only). Formatting may vary.`, { id: importToastId });
          } catch (pdfError) {
            console.error("Error importing PDF:", pdfError);
            toast.error(`Failed to process PDF: ${pdfError.message || 'Unknown PDF error'}. The file might be corrupted or password-protected.`, { id: importToastId });
            setIsImporting(false);
            return;
          }
        } else {
          toast.error(`Unsupported file type. Please use .md, .txt, or .pdf.`, { id: importToastId });
          setIsImporting(false);
          return;
        }

        if (noteHtmlContent && user?.uid) {
          const resultAction = await dispatch(addNote({
            userId: user.uid,
            title: noteTitle,
            content: noteHtmlContent,
            tags: ['imported', noteTitle.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/gi, '')] // Basic tag
          }));
          if (addNote.fulfilled.match(resultAction)) {
             // Toast already shown by specific importer, or update existing one.
             toast.success(`Note "${noteTitle}" added to your collection.`, { id: importToastId, duration: 4000 });
          } else {
             toast.error(`Failed to save imported note.`, { id: importToastId });
          }
        } else if (!user?.uid) {
            toast.error("User not found. Cannot save imported note.", { id: importToastId });
        }

      } catch (importError) {
        console.error("Error processing file:", importError);
        toast.error(`Error processing file: ${importError.message}`, { id: importToastId });
      } finally {
        setIsImporting(false);
      }
    };

    reader.onerror = () => {
        toast.error("Failed to read the file.", { id: importToastId });
        setIsImporting(false);
    };

    if (fileName.endsWith('.pdf')) {
      reader.readAsArrayBuffer(file); // pdf.js needs ArrayBuffer
    } else if (fileName.endsWith('.md') || fileName.endsWith('.txt')) {
      reader.readAsText(file);
    } else {
        toast.error(`Unsupported file type: ${file.name}. Please use .md, .txt, or .pdf.`);
        setIsImporting(false);
        toast.dismiss(importToastId); // Dismiss loading toast
        return; // Exit if not a supported type before reader starts
    }

    // Reset file input to allow importing the same file again if needed
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const exportAllNotesToJSON = () => {
    if (notesList.length === 0) {
      toast.error("No notes to export.");
      return;
    }
    const exportToastId = toast.loading("Preparing export...");

    // Using Turndown to convert HTML (from Quill) to Markdown for a more universal format.
    // You can also choose to export the raw HTML from Quill.
    const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        bulletListMarker: '-',
        emDelimiter: '*',
    });
    // Add a rule to handle Quill's code blocks if they use a specific structure
    // Example: if Quill outputs <pre class="ql-syntax" spellcheck="false">...</pre>
    turndownService.addRule('quill-code-block', {
        filter: (node) => {
            return node.nodeName === 'PRE' && node.classList.contains('ql-syntax');
        },
        replacement: function (content, node) {
            const language = node.dataset.language || ''; // Assuming Quill might add data-language
            return '\n```' + language + '\n' + content.trim() + '\n```\n';
        }
    });


    const notesToExport = notesList.map(note => ({
      title: note.title,
      contentMarkdown: turndownService.turndown(note.content || ''), // HTML to Markdown
      // contentHTML: note.content, // Alternative: export raw HTML
      tags: note.tags || [],
      createdAt: note.createdAt ? new Date(note.createdAt).toISOString() : null,
      updatedAt: note.updatedAt ? new Date(note.updatedAt).toISOString() : null,
      versionHistory: note.versionHistory?.map(v => ({
          contentMarkdown: turndownService.turndown(v.content || ''),
          timestamp: v.timestamp ? new Date(v.timestamp).toISOString() : null,
      })) || []
    }));

    const jsonString = JSON.stringify({
        exportFormatVersion: "1.0.0",
        exportedAt: new Date().toISOString(),
        notes: notesToExport,
    }, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dsa_gemini_notes_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('All notes exported successfully as JSON (Markdown content).', { id: exportToastId, duration: 5000 });
  };

  return (
    <div className="p-4 sm:p-6 bg-card-light dark:bg-card-dark shadow-xl rounded-lg">
      <h3 className="text-xl lg:text-2xl font-semibold text-text-light dark:text-text-dark mb-6">
        Import & Export Your Notes
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Import Section */}
        <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center text-center">
          <UploadCloud size={36} className="mb-3 text-primary" />
          <h4 className="text-lg font-medium text-text-light dark:text-text-dark mb-2">
            Import Notes
          </h4>
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-4 max-w-xs mx-auto">
            Import from Markdown (.md), Text (.txt), or PDF (text extraction only).
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileImport}
            accept=".md,.txt,.pdf"
            className="hidden"
            id="note-file-input"
            disabled={isImporting || notesLoading.addNote} // Disable if an import or addNote is in progress
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting || notesLoading.addNote}
            className="w-full max-w-xs flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md shadow-sm transition-colors disabled:opacity-60 disabled:cursor-wait"
          >
            {isImporting || notesLoading.addNote ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" /> Importing...
              </>
            ) : (
              <>
                <FileText size={18} className="mr-2" /> Select File to Import
              </>
            )}
          </button>
          <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-2">
            Max file size: 10MB recommended.
          </p>
        </div>

        {/* Export Section */}
        <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center text-center">
          <DownloadCloud size={36} className="mb-3 text-secondary" />
          <h4 className="text-lg font-medium text-text-light dark:text-text-dark mb-2">
            Export All Notes
          </h4>
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-4 max-w-xs mx-auto">
            Export all your notes (content as Markdown) in a single JSON file for backup or migration.
          </p>
          <button
            onClick={exportAllNotesToJSON}
            disabled={notesList.length === 0 || isImporting}
            className="w-full max-w-xs flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-secondary hover:bg-secondary-dark rounded-md shadow-sm transition-colors disabled:opacity-60"
          >
            <FileSpreadsheet size={18} className="mr-2" /> Export All as JSON
          </button>
           {notesList.length === 0 && !isImporting && <p className="text-xs text-red-500 mt-2">You have no notes to export.</p>}
        </div>
      </div>
    </div>
  );
};

export default ImportExportControls;