import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  let spinnerSizeClass = 'h-8 w-8'; // Default md
  if (size === 'sm') spinnerSizeClass = 'h-5 w-5';
  if (size === 'lg') spinnerSizeClass = 'h-12 w-12';
  if (size === 'xl') spinnerSizeClass = 'h-16 w-16';

  return (
    <div className="flex flex-col items-center justify-center my-8">
      <Loader2 className={`animate-spin text-primary ${spinnerSizeClass}`} />
      {text && <p className="mt-2 text-sm text-text-muted-light dark:text-text-muted-dark">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;