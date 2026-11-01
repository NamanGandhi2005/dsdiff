import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { scheduleReview } from '../../features/study/studySlice';
import { applyNotePatch } from '../../features/notes/notesSlice';

const OPTIONS = [
  { ease: 'hard', label: 'Hard', hint: '1 day', className: 'bg-rose-500 hover:bg-rose-600' },
  { ease: 'okay', label: 'Okay', hint: '3 days', className: 'bg-amber-500 hover:bg-amber-600' },
  { ease: 'easy', label: 'Easy', hint: '7 days', className: 'bg-emerald-500 hover:bg-emerald-600' },
];

const ReviewButtons = ({ note, onRated, compact = false }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [busy, setBusy] = useState(null);

  const rate = async (ease) => {
    if (!user?.uid || !note?.id) return;
    setBusy(ease);
    const result = await dispatch(scheduleReview({ note, ease, userId: user.uid }));
    setBusy(null);
    if (scheduleReview.fulfilled.match(result)) {
      dispatch(applyNotePatch({ id: result.payload.id, fields: result.payload.fields }));
      toast.success(`Next review in ${OPTIONS.find((item) => item.ease === ease)?.hint}.`);
      onRated?.(ease);
    } else {
      toast.error(result.payload || 'Could not save this review.');
    }
  };

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? '' : 'mt-3'}`}>
      {OPTIONS.map((option) => (
        <button
          key={option.ease}
          type="button"
          onClick={() => rate(option.ease)}
          disabled={!!busy}
          className={`text-white rounded-xl font-semibold disabled:opacity-60 ${option.className} ${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}`}
        >
          {busy === option.ease ? 'Saving...' : `${option.label} · ${option.hint}`}
        </button>
      ))}
    </div>
  );
};

export default ReviewButtons;
