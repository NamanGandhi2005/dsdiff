import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotes } from '../features/notes/notesSlice';
import { PATTERNS, notesForPattern } from '../features/study/patterns';
import { Layers } from 'lucide-react';

const PatternsPage = () => {
  const { patternId } = useParams();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const notes = useSelector((state) => state.notes.notesList);
  const selected = PATTERNS.find((pattern) => pattern.id === patternId) || null;

  useEffect(() => {
    if (user?.uid) dispatch(fetchNotes(user.uid));
  }, [dispatch, user?.uid]);

  if (selected) {
    const related = notesForPattern(notes, selected);
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Link to="/patterns" className="text-sm font-semibold text-primary">All patterns</Link>
        <div className="p-6 glass-panel rounded-3xl space-y-3">
          <h1 className="text-3xl font-bold text-text-light dark:text-text-dark">{selected.name}</h1>
          <p className="text-text-light dark:text-text-dark">{selected.summary}</p>
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark"><strong>Use it when: </strong>{selected.whenToUse}</p>
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark"><strong>Cost: </strong>{selected.complexity}</p>
          <div>
            <p className="text-sm font-semibold text-text-light dark:text-text-dark mb-2">Problems that train this</p>
            <ul className="list-disc pl-5 text-sm text-text-muted-light dark:text-text-muted-dark space-y-1">
              {selected.prompts.map((prompt) => <li key={prompt}>{prompt}</li>)}
            </ul>
          </div>
          <Link
            to={`/notes/new`}
            className="inline-flex px-4 py-2 btn-apple-primary text-white text-sm font-semibold rounded-xl"
          >
            Write a note for this pattern
          </Link>
        </div>
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-text-light dark:text-text-dark">Your notes ({related.length})</h2>
          {related.length === 0 ? (
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
              Tag a note with “{selected.name}” and it will show up here.
            </p>
          ) : (
            related.map((note) => (
              <Link key={note.id} to={`/notes/${note.id}`} className="block p-4 glass-card rounded-2xl font-semibold">
                {note.title || 'Untitled note'}
              </Link>
            ))
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-light dark:text-text-dark flex items-center">
          <Layers size={28} className="mr-2 text-indigo-500" />
          Pattern sheet
        </h1>
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-2">
          A short reminder of when each pattern fits, plus the notes you already tagged with it.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PATTERNS.map((pattern) => {
          const count = notesForPattern(notes, pattern).length;
          return (
            <Link key={pattern.id} to={`/patterns/${pattern.id}`} className="p-5 glass-card rounded-3xl block">
              <h2 className="text-lg font-bold text-text-light dark:text-text-dark">{pattern.name}</h2>
              <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-2">{pattern.summary}</p>
              <p className="text-xs font-semibold text-primary mt-3">{count} of your notes</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default PatternsPage;
