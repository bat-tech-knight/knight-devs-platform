import { getScrapingConfigs } from "./scraping-data";
import { ScrapingConfigManager } from "@/components/admin/scraping-config-manager";

export default async function ScrapingPage() {
  // Server component - handles data fetching and authentication
  const initialConfigs = await getScrapingConfigs();

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">Scraping Configuration Management</span>
        </div>
        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
          Create and manage job scraping configurations for different sites and search criteria.
        </p>
      </div>

      <ScrapingConfigManager initialConfigs={initialConfigs} />
    </div>
  );
}
