"use client";

import { Search, Mail, Bookmark, Menu, Bell, ChevronDown } from "lucide-react";
import { useState } from "react";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function CandidateHeader() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="w-full bg-slate-900 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-white">cord</h1>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search positions"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-20 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">
                Ctrl+K
              </div>
            </div>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-white transition-colors">
              <Mail className="w-6 h-6" />
            </button>
            <button className="p-2 text-slate-400 hover:text-white transition-colors">
              <Bookmark className="w-6 h-6" />
            </button>
            <button className="p-2 text-slate-400 hover:text-white transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <button className="p-2 text-slate-400 hover:text-white transition-colors">
              <Bell className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-2">
              <ThemeSwitcher />
            </div>
            
            {/* User Profile */}
            <div className="flex items-center gap-2 ml-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">U</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
