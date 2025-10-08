"use client";

import { Files, Building, Globe, Handshake } from "lucide-react";
import { useState } from "react";

interface FilterButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function FilterButton({ icon, label, isActive, onClick }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        isActive
          ? "bg-blue-600 text-white"
          : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

interface FilterButtonsProps {
  onFilterChange?: (filterType: string) => void;
}

export default function FilterButtons({ onFilterChange }: FilterButtonsProps) {
  const [activeFilter, setActiveFilter] = useState("all");

  const filters = [
    { id: "all", label: "All", icon: <Files className="w-4 h-4" /> },
    { id: "direct", label: "Direct", icon: <Building className="w-4 h-4" /> },
    { id: "external", label: "External", icon: <Globe className="w-4 h-4" /> },
    { id: "agency", label: "Agency", icon: <Handshake className="w-4 h-4" /> },
  ];

  const handleFilterClick = (filterId: string) => {
    setActiveFilter(filterId);
    onFilterChange?.(filterId);
  };

  return (
    <div className="flex items-center gap-4">
      {filters.map((filter) => (
        <FilterButton
          key={filter.id}
          icon={filter.icon}
          label={filter.label}
          isActive={activeFilter === filter.id}
          onClick={() => handleFilterClick(filter.id)}
        />
      ))}
    </div>
  );
}
