import React from 'react';
import LoginForm from '../components/Auth/LoginForm';
import { Link } from 'react-router-dom';
import { BrainCircuit } from 'lucide-react'; // Or your app logo icon

const LoginPage = () => {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center py-8 px-4 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 dark:from-primary-dark/10 dark:via-transparent dark:to-secondary-dark/10">
      <Link to="/" className="mb-8 flex items-center text-3xl font-black bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent select-none tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <BrainCircuit size={32} className="mr-2 text-indigo-500 dark:text-indigo-400" />
        <span>DSDIFF</span>
      </Link>
      <LoginForm />
    </div>
  );
};

export default LoginPage;