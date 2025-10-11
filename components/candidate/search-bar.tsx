"use client";

import { Search, Plus, Bookmark, Clock } from "lucide-react";
import { useState } from "react";

interface SavedSearch {
  id: string;
  name: string;
  search_term: string;
  location?: string;
  job_type?: string;
  is_remote?: boolean;
  created_at: string;
  updated_at: string;
}

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearch: () => void;
  savedSearches: SavedSearch[];
  onLoadSavedSearch: (search: SavedSearch) => void;
  onSaveSearch: (name: string) => void;
}

export default function SearchBar({ 
  searchTerm, 
  onSearchChange, 
  onSearch,
  savedSearches,
  onLoadSavedSearch,
  onSaveSearch
}: SearchBarProps) {
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState("");

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  const handleSaveSearch = () => {
    if (saveSearchName.trim()) {
      onSaveSearch(saveSearchName.trim());
      setSaveSearchName("");
      setShowSaveDialog(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search jobs..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full pl-10 pr-20 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          <button
            onClick={() => setShowSavedSearches(!showSavedSearches)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <Bookmark className="w-4 h-4" />
          </button>
          <div className="text-slate-400 text-sm">
            Ctrl+K
          </div>
        </div>
      </div>

      {/* Saved Searches Dropdown */}
      {showSavedSearches && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium">Saved Searches</h3>
              <button
                onClick={() => setShowSaveDialog(true)}
                className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Save
              </button>
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {savedSearches.length === 0 ? (
              <div className="p-4 text-center text-slate-400">
                <Bookmark className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No saved searches yet</p>
                <p className="text-xs">Save your search criteria for quick access</p>
              </div>
            ) : (
              savedSearches.map((search) => (
                <div
                  key={search.id}
                  className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700 last:border-b-0"
                  onClick={() => {
                    onLoadSavedSearch(search);
                    setShowSavedSearches(false);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-white font-medium text-sm">{search.name}</h4>
                      <p className="text-slate-400 text-xs mt-1">
                        {search.search_term}
                        {search.location && ` • ${search.location}`}
                        {search.job_type && ` • ${search.job_type}`}
                        {search.is_remote && ` • Remote`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(search.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-600 rounded-lg p-6 w-96">
            <h3 className="text-white font-semibold mb-4">Save Search</h3>
            <div className="mb-4">
              <label className="block text-slate-300 text-sm mb-2">
                Search Name
              </label>
              <input
                type="text"
                value={saveSearchName}
                onChange={(e) => setSaveSearchName(e.target.value)}
                placeholder="e.g., Remote React Jobs"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setSaveSearchName("");
                }}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSearch}
                disabled={!saveSearchName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
