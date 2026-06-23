import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme } from '../../features/theme/themeSlice';
import { Sun, Moon } from 'lucide-react';

const ThemeToggleButton = () => {
  const dispatch = useDispatch();
  const themeMode = useSelector((state) => state.theme.mode);

  const handleToggle = () => {
    dispatch(toggleTheme());
  };

  return (
    <button
      onClick={handleToggle}
      aria-label={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode`}
      className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-light transition-colors"
    >
      {themeMode === 'light' ? (
        <Moon size={20} />
      ) : (
        <Sun size={20} />
      )}
    </button>
  );
};

export default ThemeToggleButton;