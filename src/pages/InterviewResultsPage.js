import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const InterviewResultsPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const evaluation = location.state?.evaluation;
    const saved = location.state?.saved;
    const techStack = location.state?.techStack || '';
    const experience = location.state?.experience || '';

    if (!evaluation) {
        return (
            <div className="text-center py-20">
                <p>No results found.</p>
                <button onClick={() => navigate('/interview/setup')} className="mt-4 text-primary hover:underline">Start New Interview</button>
            </div>
        );
    }

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600 dark:text-green-400';
        if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-8 text-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Interview Results</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Here is how you performed.</p>
                
                <div className="flex justify-center items-center mb-6">
                    <div className="w-40 h-40 rounded-full border-8 border-gray-100 dark:border-gray-700 flex items-center justify-center relative">
                         <span className={`text-5xl font-extrabold ${getScoreColor(evaluation.score)}`}>
                             {evaluation.score}
                         </span>
                         <span className="absolute bottom-6 text-sm text-gray-500 font-medium">/ 100</span>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Overall Feedback:</h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {evaluation.feedback}
                    </p>
                </div>
            </div>

            {evaluation.areasForImprovement && evaluation.areasForImprovement.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-8">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <svg className="w-6 h-6 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        Areas for Improvement
                    </h2>
                    <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
                        {evaluation.areasForImprovement.map((area, index) => (
                            <li key={index}>{area}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Detailed Q&A Review</h2>
                <div className="space-y-6">
                    {evaluation.detailedFeedback?.map((item, index) => (
                        <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0 last:pb-0">
                            <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                                    <span className="text-primary mr-2">Q{index + 1}:</span>
                                    {item.question}
                                </h4>
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${item.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {item.isCorrect ? 'Good' : 'Needs Work'}
                                </span>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900 rounded p-4 mt-3">
                                <p className="text-sm text-gray-800 dark:text-gray-200">
                                    <span className="font-semibold text-gray-500 mr-2">Feedback:</span> 
                                    {item.feedback}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="text-center pb-10 space-y-3">
                {saved && <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Saved to interview history.</p>}
                <button 
                    onClick={() => navigate('/interview/setup')}
                    className="py-3 px-8 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-semibold shadow-md inline-block mr-3"
                >
                    Take Another Interview
                </button>
                <button
                    onClick={() => {
                        const weak = (evaluation.detailedFeedback || [])
                            .filter((item) => item && item.isCorrect === false && item.question)
                            .map((item) => ({ question: item.question }));
                        if (weak.length === 0) {
                            toast.success('No weak questions in this session.');
                            return;
                        }
                        navigate('/interview/session', { state: { questions: weak, techStack, experience } });
                    }}
                    className="py-3 px-8 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors font-semibold shadow-md inline-block mr-3"
                >
                    Retry weak questions
                </button>
                <button
                    onClick={() => navigate('/interview/history')}
                    className="py-3 px-8 border border-primary text-primary rounded-lg font-semibold inline-block"
                >
                    Open history
                </button>
            </div>
        </div>
    );
};

export default InterviewResultsPage;
