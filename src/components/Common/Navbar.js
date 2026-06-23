import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { signOut } from '../../features/auth/authSlice'; // Ensure this path is correct
import ThemeToggleButton from '../UI/ThemeToggleButton'; // Ensure this path is correct
import { Menu, X, BookOpen, LogOut, LayoutDashboard, Settings, Code } from 'lucide-react'; // Removed unused icons

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Assuming RootState is typed for useSelector if using TypeScript
  const { user } = useSelector((state) => state.auth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await dispatch(signOut());
    navigate('/login');
    setMobileMenuOpen(false); // Close mobile menu on sign out
  };

  // --- REFACTORED commonLinks to include Settings ---
  const commonLinks = (isMobile = false) => {
    // Determine the correct CSS classes based on mobile or desktop view
    const linkClasses = isMobile ?
      "block px-4 py-2.5 rounded-xl text-base font-medium text-text-light dark:text-text-dark hover:bg-black/5 dark:hover:bg-white/10 flex items-center transition-all duration-300" :
      "px-4 py-2 rounded-full text-sm font-medium hover:bg-primary/10 dark:hover:bg-primary-light/10 text-text-light dark:text-text-dark hover:text-primary dark:hover:text-primary-light transition-all duration-300 flex items-center";
    
    // Determine icon size based on mobile or desktop view
    const iconSize = isMobile ? 20 : 16;

    return (
        <>
        {user && ( // Only show these links if a user is logged in
            <>
            <Link to="/dashboard" className={linkClasses} onClick={() => isMobile && setMobileMenuOpen(false)}>
                <LayoutDashboard size={iconSize} className="mr-1.5" /> Dashboard
            </Link>
            <Link to="/notes" className={linkClasses} onClick={() => isMobile && setMobileMenuOpen(false)}>
                <BookOpen size={iconSize} className="mr-1.5" /> My Notes
            </Link>
            <Link to="/ai/explain-topic" className={linkClasses} onClick={() => isMobile && setMobileMenuOpen(false)}>
                <Code size={iconSize} className="mr-1.5" /> AI Explain
            </Link>
            {/* --- ADDED SETTINGS LINK HERE --- */}
            <Link to="/settings" className={linkClasses} onClick={() => isMobile && setMobileMenuOpen(false)}>
                <Settings size={iconSize} className="mr-1.5" /> Settings
            </Link>
            </>
        )}
        </>
    );
  };


  return (
    <nav className="glass-nav sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to={user ? "/dashboard" : "/"} className="flex-shrink-0 flex items-center gap-1.5">
              <span className="text-2xl font-black bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent select-none tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                DSDIFF
              </span>
            </Link>
          </div>

          {/* --- DESKTOP MENU --- */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-2">
              {/* Call the new commonLinks function for desktop view */}
              {commonLinks(false)} 

              <div className="pl-2 border-l border-gray-200 dark:border-gray-800 flex items-center space-x-2">
                <ThemeToggleButton />

                {user ? (
                  <div className="relative ml-2">
                    <button
                      onClick={handleSignOut}
                      className="px-4 py-2 rounded-full text-sm font-medium bg-red-500/10 hover:bg-red-500 hover:text-white text-red-600 dark:text-red-400 dark:hover:text-white border border-red-500/10 hover:border-red-500 transition-all duration-300 flex items-center"
                    >
                      <LogOut size={16} className="mr-1.5" /> Sign Out
                    </button>
                  </div>
                ) : (
                  <>
                    <Link to="/login" className="px-4 py-2 rounded-full text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 text-text-light dark:text-text-dark transition-all duration-300">
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      className="px-4 py-2 rounded-full text-sm font-medium btn-apple-primary text-white transition-all"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* --- MOBILE HAMBURGER BUTTON --- */}
          <div className="-mr-2 flex md:hidden items-center">
             <ThemeToggleButton />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="ml-2 bg-black/5 dark:bg-white/5 inline-flex items-center justify-center p-2 rounded-xl text-gray-500 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none transition-colors"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* --- MOBILE DROPDOWN MENU --- */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-gray-900 bg-white/90 dark:bg-background-dark/95 backdrop-blur-xl" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {/* Call the new commonLinks function for mobile view */}
            {commonLinks(true)}

            {user ? (
              <button
                onClick={handleSignOut}
                className="block px-4 py-2.5 rounded-xl text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 w-full text-left flex items-center transition-colors"
              >
                <LogOut size={20} className="mr-2" /> Sign Out
              </button>
            ) : (
              <>
                <Link to="/login" className="block px-4 py-2.5 rounded-xl text-base font-medium text-text-light dark:text-text-dark hover:bg-black/5 dark:hover:bg-white/10" onClick={() => setMobileMenuOpen(false)}>
                  Login
                </Link>
                <Link to="/signup" className="block px-4 py-2.5 rounded-xl text-base font-medium text-text-light dark:text-text-dark hover:bg-black/5 dark:hover:bg-white/10" onClick={() => setMobileMenuOpen(false)}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;