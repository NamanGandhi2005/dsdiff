import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { fetchNotes } from '../features/notes/notesSlice';
import { isNoteDue } from '../features/study/studySlice';
import ReviewButtons from '../components/Study/ReviewButtons';
import { RotateCcw } from 'lucide-react';

const ReviewPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const notes = useSelector((state) => state.notes.notesList);
  const loading = useSelector((state) => state.notes.loading);

  useEffect(() => {
    if (user?.uid) dispatch(fetchNotes(user.uid));
  }, [dispatch, user?.uid]);

  const due = notes.filter((note) => isNoteDue(note));
  const unscheduled = notes.filter((note) => !note.nextReviewAt);
  const later = notes.filter((note) => note.nextReviewAt && !isNoteDue(note));

  const renderNote = (note) => (
    <div key={note.id} className="p-4 rounded-2xl bg-white/60 dark:bg-white/5 flex flex-col gap-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <Link to={`/notes/${note.id}`} className="font-semibold text-text-light dark:text-text-dark hover:underline">
          {note.title || 'Untitled note'}
        </Link>
        <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
          {note.nextReviewAt ? `Due ${format(new Date(note.nextReviewAt), 'MMM d')}` : 'Not scheduled'}
          {note.reviewCount ? ` · reviewed ${note.reviewCount} time${note.reviewCount === 1 ? '' : 's'}` : ''}
        </span>
      </div>
      <ReviewButtons note={note} compact />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-light dark:text-text-dark flex items-center">
          <RotateCcw size={28} className="mr-2 text-indigo-500" />
          Revision queue
        </h1>
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-2">
          Hard comes back tomorrow, Okay in 3 days, Easy in 7 days.
        </p>
      </div>

      {loading && notes.length === 0 ? (
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Loading notes...</p>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-text-light dark:text-text-dark">Due now ({due.length})</h2>
            {due.length === 0 ? <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Nothing due. You are clear for today.</p> : due.map(renderNote)}
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-text-light dark:text-text-dark">Not scheduled ({unscheduled.length})</h2>
            {unscheduled.length === 0 ? <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Every note is on a schedule.</p> : unscheduled.map(renderNote)}
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-text-light dark:text-text-dark">Coming up ({later.length})</h2>
            {later.length === 0 ? <p className="text-sm text-text-muted-light dark:text-text-muted-dark">No future reviews yet.</p> : later.map(renderNote)}
          </section>
        </>
      )}
    </div>
  );
};

export default ReviewPage;
