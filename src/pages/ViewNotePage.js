import React from 'react';
import NoteView from '../components/Notes/NoteView'; // The component we created earlier

const ViewNotePage = () => {
  // The NoteView component itself handles fetching the specific note using useParams
  return (
    <div>
      {/* You can add a page-specific title or breadcrumbs here if needed */}
      <NoteView />
    </div>
  );
};

export default ViewNotePage;