import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, History, Layers, NotebookPen, RotateCcw, AlertCircle } from 'lucide-react';

const LINKS = [
  { to: '/today', title: 'Today', text: 'A 25 minute sitting: weak topic, due notes, open mistakes.', icon: CalendarClock },
  { to: '/review', title: 'Revision', text: 'Rate notes Hard, Okay, or Easy and they come back on a schedule.', icon: RotateCcw },
  { to: '/mistakes', title: 'Mistake book', text: 'Retry the quiz questions you already got wrong.', icon: AlertCircle },
  { to: '/patterns', title: 'Pattern sheet', text: 'When to use each pattern, next to your own tagged notes.', icon: Layers },
  { to: '/interview/history', title: 'Interview history', text: 'Past mock scores and a rerun of the weak questions.', icon: History },
  { to: '/notes', title: 'Company filter', text: 'On My Notes, filter by Google, Amazon, and the other company tags.', icon: NotebookPen },
];

const PracticePage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold text-text-light dark:text-text-dark">Practice</h1>
      <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-2">
        The parts of DSDIFF meant for a normal study day, not a one-time note dump.
      </p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {LINKS.map((item) => (
        <Link key={item.to} to={item.to} className="p-5 glass-card rounded-3xl block">
          <h2 className="text-lg font-bold text-text-light dark:text-text-dark flex items-center">
            <item.icon size={18} className="mr-2 text-indigo-500" />
            {item.title}
          </h2>
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-2">{item.text}</p>
        </Link>
      ))}
    </div>
  </div>
);

export default PracticePage;
