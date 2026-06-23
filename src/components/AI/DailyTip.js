import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchDailyDsaTip } from '../../features/ai/aiSlice';
import { Lightbulb, Loader2, AlertTriangle, RotateCcw } from 'lucide-react';

const DailyTip = () => {
  const dispatch = useDispatch();
  const { dailyTip, loading, error } = useSelector((state) => ({
    dailyTip: state.ai.dailyTip,
    loading: state.ai.loading.dailyTip,
    error: state.ai.error.dailyTip,
  }));

  useEffect(() => {
    // Fetch tip only if it's not already loaded or on explicit refresh
    if (!dailyTip && !loading && !error) {
      dispatch(fetchDailyDsaTip());
    }
  }, [dispatch, dailyTip, loading, error]);

  const handleRefreshTip = () => {
    dispatch(fetchDailyDsaTip());
  };

  // Don't render anything if loading and no tip yet, or permanent error.
  // Or you could show a smaller placeholder. For now, it's shown on dashboard so it's okay if it takes a moment.
  // if (loading && !dailyTip) return null;

  return (
    <div className="p-5 glass-panel border border-yellow-500/20 dark:border-yellow-500/20 bg-yellow-500/5 dark:bg-yellow-500/5 rounded-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-yellow-400 to-amber-500"></div>
      <div className="flex items-start relative z-10">
        <div className="p-2.5 bg-yellow-500/10 dark:bg-yellow-500/20 rounded-xl mr-3 flex-shrink-0">
          <Lightbulb className="h-5 w-5 text-yellow-600 dark:text-yellow-400 animate-pulse" />
        </div>
        <div className="flex-grow">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 tracking-tight">
              AI Daily DSA Tip
            </h4>
            <button
              onClick={handleRefreshTip}
              disabled={loading}
              className="p-1.5 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200 disabled:opacity-50 hover:bg-yellow-500/10 dark:hover:bg-yellow-500/20 rounded-lg transition-colors"
              title="Get new tip"
            >
              <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {loading && (
            <div className="mt-2 flex items-center text-xs text-yellow-700 dark:text-yellow-300">
              <Loader2 size={14} className="animate-spin mr-1.5" />
              Fetching a fresh tip...
            </div>
          )}
          {error && !loading && (
            <div className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center">
              <AlertTriangle size={14} className="mr-1.5" />
              Oops! Could not fetch tip: {typeof error === 'string' ? error : "Network issue"}
            </div>
          )}
          {!loading && !error && dailyTip && (
            <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 leading-relaxed font-light">
              {dailyTip}
            </p>
          )}
           {!loading && !error && !dailyTip && (
             <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 italic font-light">
              No tip available at the moment. Try refreshing!
            </p>
           )}
        </div>
      </div>
    </div>
  );
};

export default DailyTip;