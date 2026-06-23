import React from 'react';
import { Github, Linkedin, Briefcase } from 'lucide-react'; // Example icons

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 dark:bg-gray-800 text-text-muted-light dark:text-text-muted-dark py-8 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <p>© {currentYear} DSDIFF. All rights reserved.</p>
            <p className="text-sm">
              Built with React, Firebase, Gemini AI & Tailwind CSS.
            </p>
          </div>
          <div className="flex space-x-4">
            {/* Replace with your actual links */}
            <a
              href="https://github.com/your-repo" // Replace
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="hover:text-primary dark:hover:text-primary-light transition-colors"
            >
              <Github size={24} />
            </a>
            <a
              href="https://linkedin.com/in/your-profile" // Replace
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="hover:text-primary dark:hover:text-primary-light transition-colors"
            >
              <Linkedin size={24} />
            </a>
            <a
              href="https://your-portfolio.com" // Replace
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Portfolio"
              className="hover:text-primary dark:hover:text-primary-light transition-colors"
            >
              <Briefcase size={24} />
            </a>
          </div>
        </div>
        <div className="text-center text-xs mt-6">
          <p>
            Disclaimer: AI-generated content may require verification. Always cross-reference critical information.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;