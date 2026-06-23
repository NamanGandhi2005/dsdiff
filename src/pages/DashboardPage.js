import React from 'react';
import { useSelector } from 'react-redux';
import TopicsDashboard from '../components/Dashboard/TopicDashboard';
import DailyTip from '../components/AI/DailyTip';
import { Link } from 'react-router-dom';
import { PlusCircle, BookOpen } from 'lucide-react';

const DashboardPage = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="space-y-8 relative z-10">
      <div className="p-8 glass-panel rounded-3xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-secondary/5 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-text-light dark:text-text-dark tracking-tight">
            Welcome back, <span className="bg-gradient-to-r from-primary to-indigo-600 dark:from-primary-light dark:to-indigo-400 bg-clip-text text-transparent">{user?.displayName || 'Student'}</span>!
            </h1>
            <div className="flex gap-3 mt-4 sm:mt-0 w-full sm:w-auto">
                <Link
                    to="/notes/new"
                    className="flex-1 sm:flex-initial flex items-center justify-center px-5 py-2.5 btn-apple-primary font-semibold rounded-2xl shadow-sm text-sm"
                >
                    <PlusCircle size={18} className="mr-2" />
                    New Note
                </Link>
                <Link
                    to="/notes"
                    className="flex-1 sm:flex-initial flex items-center justify-center px-5 py-2.5 btn-apple-secondary font-semibold rounded-2xl shadow-sm text-sm"
                >
                    <BookOpen size={18} className="mr-2" />
                    My Notes
                </Link>
            </div>
        </div>
        <p className="relative z-10 text-text-muted-light dark:text-text-muted-dark mb-6 max-w-xl font-light">
          Ready to tackle some Data Structures and Algorithms? Let's get learning and conquer those challenges!
        </p>
        <div className="relative z-10">
          <DailyTip />
        </div>
      </div>

      <TopicsDashboard />
      {/* You can add more sections here, like recent notes, upcoming goals, etc. */}
    </div>
  );
};

export default DashboardPage;