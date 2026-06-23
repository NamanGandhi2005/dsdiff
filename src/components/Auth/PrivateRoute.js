import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import LoadingSpinner from '../Common/LoadingSpinner'; // Assuming you have this

const PrivateRoute = () => {
  const { user, loading } = useSelector((state) => state.auth);
  const location = useLocation();

  if (loading) {
    // This handles the initial auth state check
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner text="Checking authentication..." size="lg" />
      </div>
    );
  }

  if (!user) {
    // User not logged in, redirect to login page
    // Pass the current location so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is logged in, render the child routes
  return <Outlet />;
};

export default PrivateRoute;