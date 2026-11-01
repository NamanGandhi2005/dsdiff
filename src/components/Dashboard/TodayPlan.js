import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Play, Target } from 'lucide-react';
import { isNoteDue } from '../../features/study/studySlice';

const tagMatchesTopic = (note, topic) =>
  (note.tags || []).some((tag) => {
    const lower = tag.toLowerCase();
    return lower === topic.name.toLowerCase() || lower === topic.id.toLowerCase();
  });

export function useTodayPlan() {
  const notes = useSelector((state) => state.notes.notesList);
  const topics = useSelector((state) => state.topics.topicsList);
  const mistakes = useSelector((state) => state.study.mistakes);

  return useMemo(() => {
    const due = notes.filter((note) => isNoteDue(note));
    const unscheduled = notes.filter((note) => !note.nextReviewAt);
    const reviewPicks = (due.length ? due : unscheduled).slice(0, 3);
    const openMistakes = mistakes.filter((item) => !item.resolved);

    const weakest = [...topics]
      .map((topic) => {
        const solved = notes.filter((note) => tagMatchesTopic(note, topic)).length;
        const total = topic.totalProblems || 1;
        return { ...topic, solved, ratio: solved / total };
      })
      .sort((a, b) => a.ratio - b.ratio)[0];

    return {
      dueCount: due.length,
      unscheduledCount: unscheduled.length,
      reviewPicks,
      usingUnscheduled: due.length === 0,
      openMistakes: openMistakes.slice(0, 5),
      openMistakeCount: openMistakes.length,
      weakest,
    };
  }, [notes, topics, mistakes]);
}

const TodayPlan = () => {
  const plan = useTodayPlan();

  return (
    <section className="p-6 glass-panel rounded-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-light dark:text-text-dark flex items-center">
            <Target size={22} className="mr-2 text-indigo-500" />
            Today’s plan
          </h2>
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1">
            {plan.dueCount} notes due
            {plan.unscheduledCount > 0 ? ` · ${plan.unscheduledCount} not scheduled yet` : ''}
            {` · ${plan.openMistakeCount} open mistakes`}
            {plan.weakest ? ` · weakest topic: ${plan.weakest.name}` : ''}
          </p>
        </div>
        <Link
          to="/today"
          className="inline-flex items-center justify-center px-5 py-2.5 btn-apple-primary text-white font-semibold rounded-2xl text-sm"
        >
          <Play size={16} className="mr-2" />
          Start today’s 25 minutes
        </Link>
      </div>
    </section>
  );
};

export default TodayPlan;
