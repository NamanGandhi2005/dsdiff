import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { generateQuizFromNote, clearAiData } from '../../features/ai/aiSlice'; // Ensure path is correct
import { HelpCircle, CheckCircle, XCircle, Loader2, AlertCircle, Brain, Lightbulb, RefreshCw } from 'lucide-react'; // XCircle is unused if not needed
import toast from 'react-hot-toast';
import LoadingSpinner from '../Common/LoadingSpinner'; // Ensure path is correct

const QuizView = ({ noteContent, noteTitle }) => {
  const dispatch = useDispatch();
  const { quizQuestions, loading, error } = useSelector((state) => ({
    quizQuestions: state.ai.quizQuestions,
    loading: state.ai.loading.generateQuiz,
    error: state.ai.error.generateQuiz,
  }));

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  useEffect(() => {
    dispatch(clearAiData('quizQuestions'));
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizStarted(false);
  }, [noteContent, dispatch]);

  const handleGenerateQuiz = async () => {
    if (!noteContent || noteContent.trim().length < 100) {
      toast.error("Note content is too short to generate a good quiz (min 100 characters).");
      return;
    }
    dispatch(clearAiData('quizQuestions'));
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizStarted(false); // Ensure it's false before dispatch
    const resultAction = await dispatch(generateQuizFromNote(noteContent));
    if (generateQuizFromNote.fulfilled.match(resultAction)) {
      // Check if payload is an array AND has items
      if (resultAction.payload && Array.isArray(resultAction.payload) && resultAction.payload.length > 0) {
        toast.success("Quiz generated successfully!");
        setQuizStarted(true);
      } else {
        toast.error("AI couldn't generate questions for this note or returned invalid data. Try with more detailed content.");
        setQuizStarted(false);
      }
    } else if (generateQuizFromNote.rejected.match(resultAction)) {
      toast.error(resultAction.payload || "Failed to generate quiz.");
      setQuizStarted(false);
    }
  };

  const handleAnswerSelect = (option) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: option,
    });
  };

  const handleNextQuestion = () => {
    // Check quizQuestions before accessing its length
    if (quizQuestions && Array.isArray(quizQuestions) && currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
      toast.success("Quiz completed! Check your results.");
    }
  };

  const calculateScore = () => {
    // Check quizQuestions before accessing its length or forEach
    if (!quizQuestions || !Array.isArray(quizQuestions) || quizQuestions.length === 0) return 0;
    let correctAnswers = 0;
    quizQuestions.forEach((q, index) => {
      // Optional chaining for q.correctAnswer just in case q is malformed
      if (selectedAnswers[index] === q?.correctAnswer) {
        correctAnswers++;
      }
    });
    return Math.round((correctAnswers / quizQuestions.length) * 100);
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setQuizStarted(true);
    toast.info("Quiz restarted!");
  };
  
  const tryGeneratingAgain = () => {
    dispatch(clearAiData('quizQuestions'));
    handleGenerateQuiz(); // Call the existing handler
  }

  // --- Initial "Generate Quiz" Button View ---
  if (!quizStarted && !loading && !error) {
    return (
      <div className="p-6 bg-card-light dark:bg-card-dark shadow-xl rounded-lg text-center">
        <Brain size={48} className="mx-auto mb-4 text-primary" />
        <h3 className="text-2xl font-semibold text-text-light dark:text-text-dark mb-2">
          Test Your Knowledge!
        </h3>
        <p className="text-text-muted-light dark:text-text-muted-dark mb-6">
          Generate an AI-powered quiz based on the content of "{noteTitle || 'this note'}".
        </p>
        <button
          onClick={handleGenerateQuiz}
          disabled={loading || !noteContent}
          className="w-full max-w-xs mx-auto flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-primary hover:bg-primary-dark rounded-md shadow-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Loader2 size={20} className="animate-spin mr-2" /> Generating Quiz...</>
          ) : (
            <><Lightbulb size={20} className="mr-2" /> Generate Quiz Now</>
          )}
        </button>
        {!noteContent && <p className="text-xs text-red-500 mt-2">Note content is missing.</p>}
      </div>
    );
  }

  // --- Loading State ---
  if (loading) {
    return <LoadingSpinner text="AI is preparing your quiz..." size="lg" />;
  }

  // --- Error State ---
  if (error && !loading) {
    return (
      <div className="text-center p-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
        <AlertCircle size={40} className="mx-auto mb-3 text-red-500" />
        <h3 className="text-xl font-semibold text-red-700 dark:text-red-300 mb-2">Quiz Generation Failed</h3>
        <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button onClick={tryGeneratingAgain} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors flex items-center justify-center mx-auto">
          <RefreshCw size={16} className="mr-2" /> Try Generating Again
        </button>
      </div>
    );
  }
  
  // --- No Questions Generated State ---
  // Check if quizStarted is true, not loading, no error, BUT quizQuestions is invalid or empty
  if (quizStarted && !loading && !error && (!quizQuestions || !Array.isArray(quizQuestions) || quizQuestions.length === 0)) {
     return (
      <div className="text-center p-6 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg">
        <HelpCircle size={40} className="mx-auto mb-3 text-yellow-500" />
        <h3 className="text-xl font-semibold text-yellow-700 dark:text-yellow-300 mb-2">No Questions Generated</h3>
        <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-4">
            The AI couldn't generate questions based on the current note content. This can happen if the note is too short, too vague, or doesn't contain enough quiz-able facts.
        </p>
        <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-4">
            Please try with a more detailed note or try generating again.
        </p>
        <button onClick={tryGeneratingAgain} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors flex items-center justify-center mx-auto">
          <RefreshCw size={16} className="mr-2" /> Try Generating Again
        </button>
      </div>
    );
  }

  // --- Results View ---
  if (showResults) {
    const score = calculateScore();
    return (
      <div className="p-6 bg-card-light dark:bg-card-dark shadow-xl rounded-lg">
        <h3 className="text-2xl font-bold text-center text-primary dark:text-primary-light mb-4">Quiz Results</h3>
        <div className={`text-4xl font-bold text-center mb-6 ${score >= 70 ? 'text-green-500' : score >= 40 ? 'text-yellow-500' : 'text-red-500'}`}>
          Your Score: {score}%
        </div>
        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
          {/* MINIMAL FIX: Check if quizQuestions is an array before mapping */}
          {Array.isArray(quizQuestions) && quizQuestions.map((q, index) => (
            <div key={index} className="p-3 border rounded-md bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600">
              {/* Using optional chaining for safety on q properties */}
              <p className="font-semibold text-sm text-text-light dark:text-text-dark">Q{index + 1}: {q?.question || "N/A"}</p>
              <p className={`text-xs mt-1 ${selectedAnswers[index] === q?.correctAnswer ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                Your answer: {selectedAnswers[index] || 'Not answered'}
                {selectedAnswers[index] !== q?.correctAnswer && ` (Correct: ${q?.correctAnswer || "N/A"})`}
              </p>
              {selectedAnswers[index] !== q?.correctAnswer && q?.explanation && (
                <p className="text-xs mt-1 text-blue-600 dark:text-blue-400 italic">Explanation: {q.explanation}</p>
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={restartQuiz} className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors">
                <RefreshCw size={16} className="mr-2" /> Retake Quiz
            </button>
            <button onClick={handleGenerateQuiz} className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-md transition-colors">
                <Lightbulb size={16} className="mr-2" /> Generate New Quiz
            </button>
        </div>
      </div>
    );
  }

  // --- Active Quiz Question View ---
  // MINIMAL FIX: Ensure quizQuestions is an array and currentQuestionIndex is valid before accessing
  const currentQuestion = (Array.isArray(quizQuestions) && quizQuestions[currentQuestionIndex]) ? quizQuestions[currentQuestionIndex] : null;

  if (!currentQuestion) {
      // This state should ideally be caught by the "No Questions Generated" or loading/error states earlier.
      // If we reach here, it means quizStarted is true, but currentQuestion is invalid.
      if (quizStarted && !loading && !error) {
        console.error("QuizView: currentQuestion is null or invalid. Index:", currentQuestionIndex, "Questions:", quizQuestions);
        return (
            <div className="text-center p-4 text-red-500">
                Error: Could not load the current question.
                <button onClick={tryGeneratingAgain} className="mt-2 px-3 py-1 bg-primary text-white rounded">Try Generating Again</button>
            </div>
        );
      }
      return <LoadingSpinner text="Loading question..." />; // Fallback
  }

  return (
    <div className="p-4 sm:p-6 bg-card-light dark:bg-card-dark shadow-xl rounded-lg">
      <div className="mb-4">
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
          {/* Check quizQuestions before accessing length */}
          Question {currentQuestionIndex + 1} of {Array.isArray(quizQuestions) ? quizQuestions.length : 0}
        </p>
        <h3 className="text-lg sm:text-xl font-semibold text-text-light dark:text-text-dark mt-1">
          {currentQuestion.question || "Question text not available."}
        </h3>
      </div>

      <div className="space-y-3 mb-6">
        {/* MINIMAL FIX: Check if currentQuestion.options is an array before mapping */}
        {currentQuestion.options && Array.isArray(currentQuestion.options) ? (
          currentQuestion.options.map((option, i) => (
            <button
              key={i}
              onClick={() => handleAnswerSelect(option)}
              className={`w-full text-left p-3 border rounded-md transition-all duration-200 ease-in-out text-sm
                ${selectedAnswers[currentQuestionIndex] === option
                  ? 'bg-primary text-white border-primary-dark ring-2 ring-primary-light dark:ring-offset-background-dark'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 text-text-light dark:text-text-dark'
                }
              `}
            >
              <span className={`font-medium mr-2 ${selectedAnswers[currentQuestionIndex] === option ? '' : 'text-primary dark:text-primary-light'}`}>
                  {String.fromCharCode(65 + i)}.
              </span>
              {option}
            </button>
          ))
        ) : (
          <p className="text-red-500">Error: Options for this question are missing.</p>
        )}
      </div>

      {/* {selectedAnswers[currentQuestionIndex] && currentQuestion.explanation && (
        <div className="my-4 p-3 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400 dark:border-blue-500 rounded-r-md text-xs text-blue-700 dark:text-blue-300">
            <strong>Explanation for correct answer:</strong> {currentQuestion.explanation}
        </div>
      )} */}

      <button
        onClick={handleNextQuestion}
        // disabled={!selectedAnswers[currentQuestionIndex]}
        className="w-full flex items-center justify-center px-6 py-2.5 text-base font-medium text-white bg-green-500 hover:bg-green-600 rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {/* Check quizQuestions before accessing length */}
        {quizQuestions && Array.isArray(quizQuestions) && currentQuestionIndex < quizQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
        {quizQuestions && Array.isArray(quizQuestions) && currentQuestionIndex < quizQuestions.length - 1 && <HelpCircle size={18} className="ml-2" />}
        {(!quizQuestions || !Array.isArray(quizQuestions) || currentQuestionIndex === quizQuestions.length - 1) && <CheckCircle size={18} className="ml-2" />}
      </button>
    </div>
  );
};

export default QuizView;