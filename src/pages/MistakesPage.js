import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { fetchMistakes, resolveMistake, recordStudyDay } from '../features/study/studySlice';
import { AlertCircle } from 'lucide-react';

const MistakeCard = ({ mistake }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [picked, setPicked] = useState('');

  const choose = async (option) => {
    if (mistake.resolved || picked) return;
    setPicked(option);
    if (option === mistake.correctAnswer) {
      const result = await dispatch(resolveMistake(mistake.id));
      if (resolveMistake.fulfilled.match(result)) {
        if (user?.uid) dispatch(recordStudyDay(user.uid));
        toast.success('Cleared from the open list.');
      }
    }
  };

  return (
    <article className="p-5 glass-card rounded-3xl space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-semibold text-text-light dark:text-text-dark">{mistake.question}</h2>
        {mistake.resolved && (
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
            Cleared
          </span>
        )}
      </div>
      {mistake.noteTitle && (
        <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
          From {mistake.noteId ? <Link to={`/notes/${mistake.noteId}`} className="text-primary">{mistake.noteTitle}</Link> : mistake.noteTitle}
          {mistake.userAnswer ? ` · you picked “${mistake.userAnswer}”` : ''}
        </p>
      )}
      <div className="space-y-2">
        {(mistake.options || []).map((option) => {
          const showCorrect = picked && option === mistake.correctAnswer;
          const showWrong = picked === option && option !== mistake.correctAnswer;
          return (
            <button
              key={option}
              type="button"
              onClick={() => choose(option)}
              disabled={mistake.resolved || !!picked}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm border ${
                showCorrect
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : showWrong
                    ? 'border-rose-500 bg-rose-500/10'
                    : 'border-black/10 dark:border-white/10'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {picked && picked !== mistake.correctAnswer && mistake.explanation && (
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">{mistake.explanation}</p>
      )}
    </article>
  );
};

const MistakesPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { mistakes, loading, error } = useSelector((state) => state.study);
  const [showCleared, setShowCleared] = useState(false);

  useEffect(() => {
    if (user?.uid) dispatch(fetchMistakes(user.uid));
  }, [dispatch, user?.uid]);

  const visible = mistakes.filter((item) => showCleared || !item.resolved);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-text-light dark:text-text-dark flex items-center">
            <AlertCircle size={28} className="mr-2 text-rose-500" />
            Mistake book
          </h1>
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-2">
            Wrong quiz answers are saved here. Pick the right option to clear one.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCleared((value) => !value)}
          className="text-sm font-semibold text-primary"
        >
          {showCleared ? 'Hide cleared' : 'Show cleared'}
        </button>
      </div>
      {loading && <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Loading mistakes...</p>}
      {error && <p className="text-sm text-rose-500">{error}</p>}
      {!loading && visible.length === 0 && (
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
          Nothing here yet. Generate a quiz from a note and miss a question.
        </p>
      )}
      <div className="space-y-4">
        {visible.map((mistake) => <MistakeCard key={mistake.id} mistake={mistake} />)}
      </div>
    </div>
  );
};

export default MistakesPage;
