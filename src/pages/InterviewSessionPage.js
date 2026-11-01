import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { saveInterview } from '../features/study/studySlice';

const InterviewSessionPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const questions = location.state?.questions || [];
    const techStack = location.state?.techStack || '';
    const experience = location.state?.experience || '';
    
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [warnings, setWarnings] = useState(0);

    const textAreaRef = useRef(null);

    // Anti-cheat functionality
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setWarnings(prev => {
                    const newWarnings = prev + 1;
                    toast.error(`Warning: Tab switching detected! (${newWarnings}/3 warnings)`);
                    if (newWarnings >= 3) {
                        toast.error("Interview terminated due to multiple tab switches.");
                        // In a real app, you might auto-submit or fail them here
                    }
                    return newWarnings;
                });
            }
        };

        const handleBlur = () => {
            // Also fires when they click out of the window
            toast.error("Warning: Please keep the interview window focused.");
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
        };
    }, []);

    // Prevent copy/paste
    const handlePaste = (e) => {
        e.preventDefault();
        toast.error("Pasting is not allowed during the interview.");
    };

    const handleCopy = (e) => {
        e.preventDefault();
        toast.error("Copying is not allowed during the interview.");
    };

    if (questions.length === 0) {
        return (
            <div className="text-center py-20">
                <p>No questions found. Please return to setup.</p>
                <button onClick={() => navigate('/interview/setup')} className="mt-4 text-primary hover:underline">Go Back</button>
            </div>
        );
    }

    const handleNextQuestion = () => {
        if (!currentAnswer.trim()) {
            toast.error("Please provide an answer before continuing.");
            return;
        }

        // Save current answer
        const updatedAnswers = [...answers, {
            question: questions[currentQuestionIndex].question,
            answer: currentAnswer
        }];
        setAnswers(updatedAnswers);
        setCurrentAnswer('');

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            // Finish interview
            submitInterview(updatedAnswers);
        }
    };

    const submitInterview = async (finalAnswers) => {
        setIsSubmitting(true);
        try {
            const apiUrl = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:3001';
            const response = await fetch(`${apiUrl}/api/interview/evaluate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ answers: finalAnswers })
            });

            if (!response.ok) {
                throw new Error("Failed to evaluate interview");
            }

            const evaluation = await response.json();
            let saved = false;
            if (user?.uid) {
                const saveResult = await dispatch(saveInterview({
                    userId: user.uid,
                    techStack,
                    experience,
                    questions,
                    answers: finalAnswers,
                    score: evaluation.score,
                    feedback: evaluation.feedback,
                    areasForImprovement: evaluation.areasForImprovement,
                    detailedFeedback: evaluation.detailedFeedback,
                }));
                saved = saveInterview.fulfilled.match(saveResult);
                if (!saved) toast.error(saveResult.payload || 'Interview finished, but it was not saved to history.');
            }
            toast.success("Interview completed successfully!");
            navigate('/interview/results', { state: { evaluation, saved, techStack, experience, questions } });
            
        } catch (error) {
            console.error("Error evaluating interview:", error);
            toast.error("Failed to submit interview. Please try again.");
            setIsSubmitting(false);
        }
    };

    const currentQuestion = questions[currentQuestionIndex].question;

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
            
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Interview in Progress</h2>
                <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full">
                        Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                    {warnings > 0 && (
                         <span className="text-sm font-medium px-3 py-1 bg-red-100 text-red-800 rounded-full">
                         Warnings: {warnings}
                     </span>
                    )}
                </div>
            </div>

            <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 leading-relaxed">
                    {currentQuestion}
                </h3>
            </div>

            <div className="mb-6">
                <textarea
                    ref={textAreaRef}
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    onPaste={handlePaste}
                    onCopy={handleCopy}
                    placeholder="Type your answer here..."
                    rows="10"
                    className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm leading-relaxed resize-y"
                    disabled={isSubmitting}
                ></textarea>
                <p className="text-xs text-gray-500 mt-2 text-right">
                    Anti-cheat enabled. Copy/paste is disabled.
                </p>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleNextQuestion}
                    disabled={isSubmitting}
                    className="py-3 px-8 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-semibold shadow-md flex items-center"
                >
                    {isSubmitting ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Evaluating...
                        </>
                    ) : (
                        currentQuestionIndex === questions.length - 1 ? "Finish Interview" : "Next Question"
                    )}
                </button>
            </div>
        </div>
    );
};

export default InterviewSessionPage;
