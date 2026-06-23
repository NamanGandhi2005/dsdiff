import React from 'react';
import ThemeToggleButton from '../components/UI/ThemeToggleButton';
import ImportExportControls from '../components/ImportExport/ImportExportControls';
import { useSelector, useDispatch } from 'react-redux';
import { signOut } from '../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Settings, UserCircle, Palette, LogOut, AlertTriangle } from 'lucide-react';

const SettingsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const themeMode = useSelector((state) => state.theme.mode);

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
        await dispatch(signOut());
        toast.success('Signed out successfully.');
        navigate('/login');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-text-light dark:text-text-dark flex items-center">
        <Settings size={32} className="mr-3 text-primary" /> App Settings
      </h1>

      {/* User Profile Section (Basic) */}
      {user && (
        <section className="p-6 bg-card-light dark:bg-card-dark shadow-lg rounded-lg">
          <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-4 flex items-center">
            <UserCircle size={24} className="mr-2 text-primary" /> Profile
          </h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium text-text-muted-light dark:text-text-muted-dark">Display Name: </span>
              {user.displayName || 'Not set'}
            </p>
            <p>
              <span className="font-medium text-text-muted-light dark:text-text-muted-dark">Email: </span>
              {user.email}
            </p>
            <p>
              <span className="font-medium text-text-muted-light dark:text-text-muted-dark">User ID: </span>
              <span className="break-all">{user.uid}</span>
            </p>
             {/* TODO: Add "Edit Profile" button if you implement profile editing */}
          </div>
        </section>
      )}

      {/* Theme Settings */}
      <section className="p-6 bg-card-light dark:bg-card-dark shadow-lg rounded-lg">
        <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-4 flex items-center">
          <Palette size={24} className="mr-2 text-primary" /> Appearance
        </h2>
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-light dark:text-text-dark">
            Theme Mode: <span className="font-semibold capitalize">{themeMode}</span>
          </p>
          <ThemeToggleButton />
        </div>
        <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-2">
            Toggle between light and dark mode for the application.
        </p>
      </section>

      {/* Import/Export Section */}
      <section>
        <ImportExportControls />
      </section>
      
      {/* Account Actions */}
      <section className="p-6 bg-card-light dark:bg-card-dark shadow-lg rounded-lg">
        <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-4 flex items-center">
          <AlertTriangle size={24} className="mr-2 text-red-500" /> Account Actions
        </h2>
        <div className="space-y-3">
            <button
                onClick={handleSignOut}
                className="w-full sm:w-auto flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm transition-colors"
            >
                <LogOut size={18} className="mr-2" /> Sign Out
            </button>
            {/* TODO: Add "Delete Account" button with proper confirmation and backend logic */}
            {/* <button
                // onClick={handleDeleteAccount}
                className="w-full sm:w-auto flex items-center justify-center px-4 py-2.5 text-sm font-medium text-red-700 border border-red-700 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900/30 rounded-md shadow-sm transition-colors"
            >
                <Trash2 size={18} className="mr-2" /> Delete Account
            </button> */}
        </div>
         <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-3">
            Be careful with these actions. Deleting your account is irreversible.
        </p>
      </section>

    </div>
  );
};

export default SettingsPage;