import React, { useState } from 'react';
import { X as XIcon, PlusCircle } from 'lucide-react';

const TagsInput = ({ tags, setTags, suggestions = [] }) => {
  const [inputValue, setInputValue] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    if (value && suggestions.length > 0) {
      setFilteredSuggestions(
        suggestions.filter(suggestion =>
          suggestion.toLowerCase().includes(value.toLowerCase()) && !tags.includes(suggestion)
        ).slice(0, 5) // Limit suggestions shown
      );
    } else {
      setFilteredSuggestions([]);
    }
  };

  const handleAddTag = (tagValue) => {
    const newTag = tagValue.trim();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
    setInputValue('');
    setFilteredSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault(); // Prevent form submission or comma in input
      handleAddTag(inputValue);
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
        Tags (comma or Enter to add)
      </label>
      <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent dark:text-text-dark">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="flex items-center px-2 py-1 bg-primary/20 dark:bg-primary-dark/30 text-primary dark:text-primary-light text-sm rounded-full"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1.5 text-primary dark:text-primary-light hover:text-red-500 dark:hover:text-red-400"
              aria-label={`Remove ${tag}`}
            >
              <XIcon size={14} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={tags.length > 0 ? "Add more tags..." : "e.g., Arrays, DP, Graphs"}
          className="flex-grow p-1 bg-transparent focus:outline-none text-sm placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>
      {filteredSuggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-card-light dark:bg-card-dark border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => handleAddTag(suggestion)}
              className="px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center justify-between"
            >
              <span>{suggestion}</span>
              <PlusCircle size={16} className="text-gray-400" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TagsInput;