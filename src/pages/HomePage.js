import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowRight, BookOpenText, BrainCircuit, BarChart3, Zap } from 'lucide-react';
import DailyTip from '../components/AI/DailyTip'; // Assuming DailyTip can be shown here

const HomePage = () => {
  const { user } = useSelector((state) => state.auth);

  const features = [
    {
      icon: <BookOpenText size={32} className="text-primary" />,
      title: 'Smart Note Taking',
      description: 'Organize DSA notes by topic with rich text editing and code highlighting.',
    },
    {
      icon: <BrainCircuit size={32} className="text-secondary" />,
      title: 'Gemini AI Powered',
      description: 'Summarize notes, generate content from problems, explain topics, and get daily tips.',
    },
    {
      icon: <Zap size={32} className="text-yellow-500" />,
      title: 'AI Quiz Generator',
      description: 'Create interactive MCQs and flashcards from your notes to test your knowledge.',
    },
    {
      icon: <BarChart3 size={32} className="text-green-500" />,
      title: 'Progress Tracking',
      description: 'Visualize your learning journey with a DSA topics dashboard and progress indicators.',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16 relative z-10">
      {/* Hero Section */}
      <section className="text-center mb-16 sm:mb-20 lg:mb-24">
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-text-light dark:text-text-dark mb-6 tracking-tight leading-tight">
          Ace Technical Interviews with <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">DSDIFF</span>
        </h1>
        <p className="text-lg sm:text-xl text-text-muted-light dark:text-text-muted-dark max-w-2xl mx-auto mb-10 leading-relaxed font-light">
          Your smart AI companion for Data Structures and Algorithms. Instantly fetch LeetCode problems, generate notes, and track your study progress.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto sm:max-w-none">
          {user ? (
            <Link
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white btn-apple-primary rounded-2xl shadow-lg"
            >
              Go to Dashboard <ArrowRight size={20} className="ml-2" />
            </Link>
          ) : (
            <>
              <Link
                to="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white btn-apple-primary rounded-2xl shadow-lg"
              >
                Get Started Free <ArrowRight size={20} className="ml-2" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-semibold btn-apple-secondary rounded-2xl shadow-md"
              >
                Login
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Daily Tip Section */}
      <section className="mb-16 sm:mb-24 max-w-3xl mx-auto">
        <DailyTip />
      </section>

      {/* Features Section */}
      <section className="mb-16 sm:mb-24">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-text-light dark:text-text-dark mb-12 tracking-tight">
          Why Choose DSDIFF?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-card glass-card-interactive p-8 rounded-3xl flex flex-col items-center text-center"
            >
              <div className="p-4 bg-gradient-to-tr from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 rounded-2xl mb-6 shadow-inner">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-text-light dark:text-text-dark mb-3">
                {feature.title}
              </h3>
              <p className="text-sm text-text-muted-light dark:text-text-muted-dark leading-relaxed font-light">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action Section */}
      {!user && (
        <section className="glass-panel text-text-light dark:text-text-dark py-16 px-8 sm:px-12 rounded-3xl shadow-xl text-center relative overflow-hidden border border-white/20 dark:border-white/10">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-secondary/5 pointer-events-none"></div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 relative z-10">Ready to Ace Your DSA Prep?</h2>
          <p className="text-lg sm:text-xl text-text-muted-light dark:text-text-muted-dark mb-8 max-w-xl mx-auto font-light relative z-10">
            Join thousands of students leveraging AI to conquer complex algorithms and data structures.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center justify-center px-10 py-4.5 text-lg font-semibold btn-apple-primary text-white rounded-2xl shadow-lg relative z-10"
          >
            Sign Up Now <ArrowRight size={22} className="ml-2.5" />
          </Link>
        </section>
      )}
    </div>
  );
};

export default HomePage;