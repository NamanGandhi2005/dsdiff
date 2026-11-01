import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { fetchInterviews } from '../features/study/studySlice';
import { History } from 'lucide-react';

const InterviewHistoryPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const interviews = useSelector((state) => state.study.interviews);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    if (user?.uid) dispatch(fetchInterviews(user.uid));
  }, [dispatch, user?.uid]);

  const rerunWeak = (interview) => {
    const weak = (interview.detailedFeedback || [])
      .filter((item) => item && item.isCorrect === false && item.question)
      .map((item) => ({ question: item.question }));
    if (weak.length === 0) {
      toast.success('No weak questions saved on this session.');
      return;
    }
    navigate('/interview/session', {
      state: {
        questions: weak,
        techStack: interview.techStack,
        experience: interview.experience,
      },
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-light dark:text-text-dark flex items-center">
          <History size={28} className="mr-2 text-indigo-500" />
          Interview history
        </h1>
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-2">
          Finished mock interviews stay here, including the score and the questions that need another pass.
        </p>
      </div>
      {interviews.length === 0 && (
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
          No saved interviews yet. Finish one from AI Interview and it will appear here.
        </p>
      )}
      <div className="space-y-4">
        {interviews.map((interview) => (
          <article key={interview.id} className="p-5 glass-card rounded-3xl">
            <button
              type="button"
              onClick={() => setOpenId((current) => (current === interview.id ? null : interview.id))}
              className="w-full text-left flex items-center justify-between gap-3"
            >
              <div>
                <p className="font-semibold text-text-light dark:text-text-dark">
                  {interview.techStack || 'General'} · {interview.score}/100
                </p>
                <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1">
                  {interview.createdAt ? format(new Date(interview.createdAt), 'MMM d, yyyy p') : ''}
                  {interview.experience ? ` · ${interview.experience}` : ''}
                </p>
              </div>
              <span className="text-sm text-primary">{openId === interview.id ? 'Hide' : 'Open'}</span>
            </button>
            {openId === interview.id && (
              <div className="mt-4 space-y-3 text-sm text-text-light dark:text-text-dark">
                {interview.feedback && <p>{interview.feedback}</p>}
                <ul className="space-y-2">
                  {(interview.detailedFeedback || []).map((item, index) => (
                    <li key={`${interview.id}-${index}`} className="p-3 rounded-xl bg-black/5 dark:bg-white/5">
                      <p className="font-medium">{item.question}</p>
                      <p className="text-xs mt-1 text-text-muted-light dark:text-text-muted-dark">
                        {item.isCorrect ? 'Good' : 'Needs work'}{item.feedback ? ` · ${item.feedback}` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => rerunWeak(interview)}
                  className="px-4 py-2 btn-apple-primary text-white text-sm font-semibold rounded-xl"
                >
                  Retry weak questions
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
};

export default InterviewHistoryPage;
