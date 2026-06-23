import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart2, CheckCircle, Target, BookOpen, Brain } from 'lucide-react'; // Added Brain for AI explain

const TopicCard = ({ topic, notes }) => {
  // Calculate solved count based on notes tagged with this topic
  // This logic might need refinement based on how you define "solved"
  const solvedCount = notes.filter(note =>
    note.tags && note.tags.some(tag => tag.toLowerCase() === topic.name.toLowerCase() || tag.toLowerCase() === topic.id.toLowerCase())
  ).length;

  const totalProblems = topic.totalProblems || 1; // Avoid division by zero
  const progress = totalProblems > 0 ? Math.min(Math.round((solvedCount / totalProblems) * 100), 100) : 0;

  return (
    <div className="glass-card glass-card-interactive p-6 rounded-3xl flex flex-col h-full border border-white/20 dark:border-white/10 relative overflow-hidden group">
      <div className="flex-grow relative z-10">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold text-text-light dark:text-text-dark truncate group-hover:text-primary dark:group-hover:text-primary-light transition-colors duration-300" title={topic.name}>
            <BarChart2 size={20} className="inline-block mr-2 mb-0.5 text-indigo-500 dark:text-indigo-400" />
            {topic.name}
          </h3>
          {/* Optional: Icon if topic is "mastered" or has notes */}
          {progress === 100 && <CheckCircle size={20} className="text-emerald-500 dark:text-emerald-400" />}
        </div>
        <p className="text-xs text-text-muted-light dark:text-text-muted-dark mb-4 h-10 overflow-hidden font-light leading-relaxed">
          {topic.description || 'No description available.'}
        </p>

        <div className="mb-4">
          <div className="flex justify-between text-xs text-text-muted-light dark:text-text-muted-dark mb-1.5 font-medium">
            <span>Progress</span>
            <span>{solvedCount} / {topic.totalProblems || '?'} Solved</span>
          </div>
          <div className="w-full bg-black/5 dark:bg-white/10 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(99,102,241,0.2)]"
              style={{ width: `${progress}%` }}
              title={`${progress}% complete`}
            ></div>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row gap-2 relative z-10">
        <Link
          to={`/notes?topic=${encodeURIComponent(topic.id)}`}
          className="flex-1 text-center w-full sm:w-auto px-3.5 py-2 text-xs font-semibold text-white btn-apple-primary rounded-xl flex items-center justify-center"
        >
          <BookOpen size={14} className="mr-1.5" /> View Notes
        </Link>
        <Link
          to={`/ai/explain-topic?topic=${encodeURIComponent(topic.name)}`}
          className="flex-1 text-center w-full sm:w-auto px-3.5 py-2 text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 dark:hover:text-white border border-indigo-500/15 hover:border-indigo-600 rounded-xl transition-all duration-300 flex items-center justify-center"
        >
          <Brain size={14} className="mr-1.5" /> AI Explain
        </Link>
      </div>
    </div>
  );
};

export default TopicCard;