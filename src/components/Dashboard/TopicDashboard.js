import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTopics, } from '../../features/dsaTopics/topicsSlice';
import { fetchNotes } from '../../features/notes/notesSlice';
import TopicCard from './TopicCard';
import LoadingSpinner from '../Common/LoadingSpinner';
import {  Search, BarChart3, AlertTriangle } from 'lucide-react'; // Added AlertTriangle

const TopicsDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { topicsList, loading: topicsLoading, error: topicsError } = useSelector((state) => state.topics);
  const { notesList, loading: notesLoading, error: notesError } = useSelector((state) => state.notes);

  const [searchTerm, setSearchTerm] = useState('');
  // Add more filters if needed (e.g., difficulty, status)
  // const [difficultyFilter, setDifficultyFilter] = useState('all');

  useEffect(() => {
    dispatch(fetchTopics());
    if (user?.uid) {
      dispatch(fetchNotes(user.uid));
    }
  }, [dispatch, user?.uid]);

  // This effect could be used to periodically update progress,
  // or you might trigger updateTopicProgress after note changes.
  useEffect(() => {
    if (notesList.length > 0 && topicsList.length > 0) {
      // dispatch(updateTopicProgress()); // This thunk needs to be implemented to update solvedCounts in topicsList
    }
  }, [notesList, topicsList, dispatch]);

  const filteredTopics = useMemo(() => {
    return topicsList.filter(topic =>
      topic.name.toLowerCase().includes(searchTerm.toLowerCase())
      // && (difficultyFilter === 'all' || topic.difficulty === difficultyFilter)
    );
  }, [topicsList, searchTerm /*, difficultyFilter */]);

  const overallProgress = useMemo(() => {
    if (!topicsList || topicsList.length === 0) return { solved: 0, total: 0, percentage: 0 };
    let totalSolved = 0;
    let totalProblems = 0;
    topicsList.forEach(topic => {
        const solvedForThisTopic = notesList.filter(note =>
            note.tags && note.tags.some(tag => tag.toLowerCase() === topic.name.toLowerCase() || tag.toLowerCase() === topic.id.toLowerCase())
        ).length;
      totalSolved += Math.min(solvedForThisTopic, topic.totalProblems || 0); // Cap solved at total for this topic
      totalProblems += topic.totalProblems || 0;
    });
    return {
      solved: totalSolved,
      total: totalProblems,
      percentage: totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 100) : 0,
    };
  }, [topicsList, notesList]);


  if (topicsLoading || (user && notesLoading && notesList.length === 0) ) { // Show loading if topics or initial notes are loading
    return <LoadingSpinner text="Loading DSA Topics..." size="lg" />;
  }

  if (topicsError || notesError) {
    const error = topicsError || notesError;
    return (
      <div className="text-center text-red-500 dark:text-red-400 p-6 bg-red-100 dark:bg-red-900/50 rounded-lg shadow-md">
        <AlertTriangle size={48} className="mx-auto mb-3 text-red-600 dark:text-red-400" />
        <h2 className="text-xl font-semibold mb-2">Oops! Something went wrong.</h2>
        <p>Failed to load DSA topics or notes: {typeof error === 'string' ? error : JSON.stringify(error)}</p>
        <button
          onClick={() => { dispatch(fetchTopics()); if(user?.uid) dispatch(fetchNotes(user.uid)); }}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overall Progress Summary */}
      <div className="p-8 glass-panel rounded-3xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-secondary/5 pointer-events-none"></div>
        <h2 className="text-2xl font-bold text-text-light dark:text-text-dark mb-5 flex items-center relative z-10">
          <BarChart3 size={28} className="mr-3 text-indigo-500 dark:text-indigo-400" />
          Your DSA Journey Progress
        </h2>
        <div className="mb-2 relative z-10">
          <div className="flex justify-between text-base font-semibold text-text-light dark:text-text-dark mb-2">
            <span>Overall Completion</span>
            <span>{overallProgress.solved} / {overallProgress.total} Problems Tracked</span>
          </div>
          <div className="w-full bg-black/5 dark:bg-white/5 rounded-full h-7 p-1 border border-black/5 dark:border-white/5">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-400 dark:from-indigo-500 dark:to-emerald-400 h-full rounded-full flex items-center justify-center text-xs font-bold text-white transition-all duration-700 ease-out shadow-[0_0_12px_rgba(99,102,241,0.25)]"
              style={{ width: `${overallProgress.percentage}%` }}
            >
              {overallProgress.percentage > 0 && `${overallProgress.percentage}%`}
            </div>
          </div>
        </div>
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-4 font-light relative z-10">
          Keep up the great work! Consistent practice is key to mastering DSA.
        </p>
      </div>


      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 glass-card rounded-2xl">
        <div className="relative w-full md:flex-1">
          <input
            type="text"
            placeholder="Search topics (e.g., Arrays, Trees, DP)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-2.5 pl-10 pr-4 glass-input rounded-xl text-text-light dark:text-text-dark placeholder-gray-400 dark:placeholder-gray-500"
          />
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        {/* <div className="flex items-center gap-2 w-full md:w-auto">
          <ListFilter size={20} className="text-gray-500 dark:text-gray-400" />
          <select
            // value={difficultyFilter}
            // onChange={(e) => setDifficultyFilter(e.target.value)}
            className="py-2.5 px-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-transparent text-text-light dark:text-text-dark w-full md:w-auto"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div> */}
      </div>

      {filteredTopics.length === 0 && !topicsLoading && (
        <div className="text-center py-12">
          <Search size={52} className="mx-auto text-gray-400 dark:text-gray-500" />
          <h3 className="mt-3 text-xl font-medium text-text-light dark:text-text-dark">
            No topics match your search.
          </h3>
          <p className="mt-1 text-sm text-text-muted-light dark:text-text-muted-dark">
            Try a different search term or check your spelling.
          </p>
        </div>
      )}

      {filteredTopics.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTopics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} notes={notesList} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TopicsDashboard;