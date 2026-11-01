import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Flame } from 'lucide-react';
import { buildHeatmap, computeStreak } from '../../features/study/studySlice';

const cellClass = (cell) => {
  if (cell.future) return 'bg-transparent';
  if (cell.count >= 4) return 'bg-indigo-600';
  if (cell.count >= 2) return 'bg-indigo-400';
  if (cell.count >= 1) return 'bg-indigo-300 dark:bg-indigo-500';
  return 'bg-black/10 dark:bg-white/10';
};

const StudyStreak = () => {
  const dayMap = useSelector((state) => state.study.dayMap);
  const streak = useMemo(() => computeStreak(dayMap), [dayMap]);
  const cells = useMemo(() => buildHeatmap(dayMap), [dayMap]);

  return (
    <section className="p-6 glass-panel rounded-3xl">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold text-text-light dark:text-text-dark flex items-center">
            <Flame size={22} className="mr-2 text-orange-500" />
            {streak} day streak
          </h2>
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1">
            A day counts when you review a note, finish a quiz, save a note, or complete an interview.
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="grid grid-rows-7 grid-flow-col gap-1 w-max">
          {cells.map((cell) => (
            <div
              key={cell.key}
              title={cell.future ? '' : `${cell.key}: ${cell.count} session${cell.count === 1 ? '' : 's'}`}
              className={`w-3 h-3 rounded-sm ${cellClass(cell)}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StudyStreak;
