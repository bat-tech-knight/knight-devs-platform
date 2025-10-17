"use client";

import { useRouter } from "next/navigation";
import { KnightLogo } from "@/components/knight-logo";

interface SimpleHeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
}

export default function SimpleHeader({ 
  title, 
  subtitle, 
  showBackButton = false 
}: SimpleHeaderProps) {
  const router = useRouter();

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <button
              onClick={() => router.push('/candidate/discover')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <KnightLogo size="md" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Knight Devs
              </span>
            </button>
            {title && (
              <>
                <span className="text-gray-300 dark:text-slate-600">|</span>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      {subtitle}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
