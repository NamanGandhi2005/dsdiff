import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotes } from '../features/notes/notesSlice';
import { fetchMistakes, fetchStudyDays } from '../features/study/studySlice';
import { fetchTopics } from '../features/dsaTopics/topicsSlice';
import { useTodayPlan } from '../components/Dashboard/TodayPlan';
import ReviewButtons from '../components/Study/ReviewButtons';
import { Clock, Target } from 'lucide-react';

const formatTime = (seconds) => {
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
};

const TodayPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const plan = useTodayPlan();
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [hiddenReviews, setHiddenReviews] = useState({});

  useEffect(() => {
    if (!user?.uid) return;
    dispatch(fetchNotes(user.uid));
    dispatch(fetchMistakes(user.uid));
    dispatch(fetchStudyDays(user.uid));
    dispatch(fetchTopics());
  }, [dispatch, user?.uid]);

  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          setRunning(false);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running]);

  const visibleReviews = plan.reviewPicks.filter((note) => !hiddenReviews[note.id]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="p-6 glass-panel rounded-3xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-light dark:text-text-dark flex items-center">
            <Clock size={28} className="mr-2 text-indigo-500" />
            {formatTime(remaining)}
          </h1>
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1">
            {remaining === 0 ? 'Session done. Come back tomorrow for the next due notes.' : 'One sitting: a weak topic, a few reviews, then your mistakes.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRunning((value) => !value)}
          disabled={remaining === 0}
          className="px-5 py-2.5 btn-apple-primary text-white font-semibold rounded-2xl text-sm disabled:opacity-60"
        >
          {running ? 'Pause' : remaining === 25 * 60 ? 'Start timer' : 'Resume'}
        </button>
      </div>

      <section className="p-6 glass-card rounded-3xl">
        <h2 className="text-lg font-bold text-text-light dark:text-text-dark flex items-center mb-2">
          <Target size={18} className="mr-2 text-indigo-500" />
          Weakest topic
        </h2>
        {plan.weakest ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
              {plan.weakest.name}: {plan.weakest.solved} notes against {plan.weakest.totalProblems} tracked problems.
            </p>
            <Link to={`/ai/explain-topic?topic=${encodeURIComponent(plan.weakest.name)}`} className="text-sm font-semibold text-primary">
              Explain this topic
            </Link>
          </div>
        ) : (
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Topics will show up after they load.</p>
        )}
      </section>

      <section className="p-6 glass-card rounded-3xl space-y-4">
        <h2 className="text-lg font-bold text-text-light dark:text-text-dark">
          {plan.usingUnscheduled ? 'Start revision on these notes' : 'Due for review'}
        </h2>
        {visibleReviews.length === 0 ? (
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
            Nothing left in this sitting. <Link to="/review" className="text-primary font-semibold">Open the full queue</Link>
          </p>
        ) : (
          visibleReviews.map((note) => (
            <div key={note.id} className="p-4 rounded-2xl bg-white/50 dark:bg-white/5">
              <Link to={`/notes/${note.id}`} className="font-semibold text-text-light dark:text-text-dark hover:underline">
                {note.title || 'Untitled note'}
              </Link>
              <ReviewButtons note={note} compact onRated={() => setHiddenReviews((current) => ({ ...current, [note.id]: true }))} />
            </div>
          ))
        )}
      </section>

      <section className="p-6 glass-card rounded-3xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-text-light dark:text-text-dark">Mistakes to retry</h2>
          <Link to="/mistakes" className="text-sm font-semibold text-primary">Open mistake book</Link>
        </div>
        {plan.openMistakes.length === 0 ? (
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
            No open mistakes. Finish a quiz and the ones you miss land here.
          </p>
        ) : (
          <ul className="space-y-2">
            {plan.openMistakes.map((item) => (
              <li key={item.id} className="text-sm text-text-light dark:text-text-dark">
                {item.question}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default TodayPage;
