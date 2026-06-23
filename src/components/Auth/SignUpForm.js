import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { signUpWithEmail, signInWithGoogle } from '../../features/auth/authSlice';
import { UserPlus, Mail, Lock, User as UserIcon, AlertCircle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const SignUpForm = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password should be at least 6 characters long.");
      return;
    }
    const resultAction = await dispatch(signUpWithEmail({ email, password, displayName }));
    if (signUpWithEmail.fulfilled.match(resultAction)) {
      toast.success('Account created successfully! Welcome!');
      navigate('/dashboard');
    } else if (signUpWithEmail.rejected.match(resultAction)) {
      const errorMessage = typeof resultAction.payload === 'string' 
        ? resultAction.payload 
        : 'Sign up failed. Please try again.';
      toast.error(errorMessage.replace('Firebase: ', '').replace(/ *\([^)]*\) */g, ""));
    }
  };

  const handleGoogleSignUp = async () => {
    const resultAction = await dispatch(signInWithGoogle()); // signInWithGoogle handles new user creation too
    if (signInWithGoogle.fulfilled.match(resultAction)) {
      toast.success('Signed up with Google successfully! Welcome!');
      navigate('/dashboard');
    } else if (signInWithGoogle.rejected.match(resultAction)) {
      const errorMessage = typeof resultAction.payload === 'string' 
        ? resultAction.payload 
        : 'Google Sign-up failed. Please try again.';
      toast.error(errorMessage.replace('Firebase: ', '').replace(/ *\([^)]*\) */g, ""));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] px-4 py-8 relative z-10">
      <div className="w-full max-w-md p-8 sm:p-10 space-y-6 glass-panel rounded-3xl border border-white/20 dark:border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-secondary/5 pointer-events-none"></div>
        <div className="text-center relative z-10">
          <div className="p-3 bg-primary/10 dark:bg-primary-light/25 rounded-2xl inline-block mb-3">
            <UserPlus size={32} className="text-primary dark:text-primary-light" />
          </div>
          <h1 className="text-3xl font-extrabold text-text-light dark:text-text-dark tracking-tight">
            Create an Account
          </h1>
          <p className="mt-2 text-sm text-text-muted-light dark:text-text-muted-dark font-light">
            Join to start managing your DSA notes like a pro.
          </p>
        </div>

        {error && !loading && (
           <div className="flex items-center p-3 text-sm text-red-700 bg-red-100 rounded-xl border border-red-300 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700/40 relative z-10">
            <AlertCircle size={20} className="mr-2 flex-shrink-0" />
            <span>{typeof error === 'string' ? error.replace('Firebase: ', '').replace(/ *\([^)]*\) */g, "") : 'An unknown error occurred.'}</span>
          </div>
        )}

        <form onSubmit={handleEmailSignUp} className="space-y-4 relative z-10">
          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-text-light dark:text-text-dark mb-1"
            >
              Display Name
            </label>
            <div className="relative rounded-xl">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="displayName"
                name="displayName"
                type="text"
                autoComplete="name"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="block w-full pl-11 pr-4 py-2.5 glass-input rounded-xl placeholder-gray-400 dark:placeholder-gray-500 sm:text-sm"
                placeholder="Your Name"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email-signup"
              className="block text-sm font-medium text-text-light dark:text-text-dark mb-1"
            >
              Email address
            </label>
            <div className="relative rounded-xl">
               <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="email-signup"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-11 pr-4 py-2.5 glass-input rounded-xl placeholder-gray-400 dark:placeholder-gray-500 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password-signup"
              className="block text-sm font-medium text-text-light dark:text-text-dark mb-1"
            >
              Password
            </label>
            <div className="relative rounded-xl">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="password-signup"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-11 pr-10 py-2.5 glass-input rounded-xl placeholder-gray-400 dark:placeholder-gray-500 sm:text-sm"
                placeholder="Minimum 6 characters"
              />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium text-text-light dark:text-text-dark mb-1"
            >
              Confirm Password
            </label>
             <div className="relative rounded-xl">
               <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full pl-11 pr-10 py-2.5 glass-input rounded-xl placeholder-gray-400 dark:placeholder-gray-500 sm:text-sm"
                placeholder="Re-type your password"
              />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white btn-apple-primary disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>

        <div className="relative my-6 relative z-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-black/5 dark:border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-transparent text-text-muted-light dark:text-text-muted-dark">
              Or sign up with
            </span>
          </div>
        </div>

        <div className="relative z-10">
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full inline-flex justify-center items-center py-2.5 px-4 rounded-xl shadow-sm bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-sm font-semibold hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300 text-text-light dark:text-text-dark disabled:opacity-50"
          >
            <img className="w-5 h-5 mr-2" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google icon" />
            Sign up with Google
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-text-muted-light dark:text-text-muted-dark relative z-10 font-light">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary transition-colors"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpForm;