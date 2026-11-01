import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import DOMPurify from 'dompurify';
import { db } from '../firebase';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const PublicNotePage = () => {
  const { noteId } = useParams();
  const [note, setNote] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const snapshot = await getDoc(doc(db, 'publicNotes', noteId));
        if (cancelled) return;
        if (!snapshot.exists()) {
          setStatus('missing');
          return;
        }
        setNote({ id: snapshot.id, ...snapshot.data() });
        setStatus('ready');
      } catch (error) {
        if (!cancelled) setStatus('error');
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [noteId]);

  if (status === 'loading') return <LoadingSpinner text="Loading shared note..." />;
  if (status === 'missing') {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <h1 className="text-2xl font-bold mb-2">This note is not public</h1>
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-4">
          The owner has not published it, or the link is wrong.
        </p>
        <Link to="/" className="text-primary font-semibold">Go home</Link>
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <h1 className="text-2xl font-bold mb-2">Could not open this note</h1>
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
          Public reads need a Firestore rule that allows anyone to read the publicNotes collection.
        </p>
      </div>
    );
  }

  const html = DOMPurify.sanitize(note.content || '', { USE_PROFILES: { html: true } });

  return (
    <article className="max-w-3xl mx-auto space-y-4">
      <p className="text-xs uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark">
        Shared from DSDIFF{note.authorName ? ` · ${note.authorName}` : ''}
      </p>
      <h1 className="text-3xl font-bold text-text-light dark:text-text-dark">{note.title}</h1>
      {note.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {note.tags.map((tag) => (
            <span key={tag} className="px-2.5 py-1 text-xs rounded-full bg-secondary/15">{tag}</span>
          ))}
        </div>
      )}
      <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none p-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg ql-snow">
        <div className="ql-editor" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </article>
  );
};

export default PublicNotePage;
