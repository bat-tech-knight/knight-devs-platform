"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Breadcrumb as AntBreadcrumb, Typography } from "antd";
import { Home, ChevronRight } from "lucide-react";

const { Text } = Typography;

interface BreadcrumbItem {
  title: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

// Define route mappings for automatic breadcrumb generation
const routeMappings: Record<string, { title: string; icon?: React.ReactNode }> = {
  "/": { title: "Home", icon: <Home className="w-4 h-4" /> },
  "/admin": { title: "Admin Dashboard", icon: <Home className="w-4 h-4" /> },
  "/admin/scraping": { title: "Job Scraping", icon: <ChevronRight className="w-4 h-4" /> },
  "/admin/jobs": { title: "Jobs", icon: <ChevronRight className="w-4 h-4" /> },
  "/admin/users": { title: "Users", icon: <ChevronRight className="w-4 h-4" /> },
  "/protected": { title: "Protected", icon: <ChevronRight className="w-4 h-4" /> },
  "/auth/login": { title: "Login", icon: <ChevronRight className="w-4 h-4" /> },
  "/auth/sign-up": { title: "Sign Up", icon: <ChevronRight className="w-4 h-4" /> },
  "/auth/forgot-password": { title: "Forgot Password", icon: <ChevronRight className="w-4 h-4" /> },
  "/auth/update-password": { title: "Update Password", icon: <ChevronRight className="w-4 h-4" /> },
  "/auth/confirm": { title: "Confirm Email", icon: <ChevronRight className="w-4 h-4" /> },
  "/auth/sign-up-success": { title: "Sign Up Success", icon: <ChevronRight className="w-4 h-4" /> },
  "/auth/error": { title: "Auth Error", icon: <ChevronRight className="w-4 h-4" /> },
};

export function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname if not provided
  const generateBreadcrumbItems = (): BreadcrumbItem[] => {
    if (items) return items;

    const pathSegments = pathname.split("/").filter(Boolean);
    const breadcrumbItems: BreadcrumbItem[] = [];

    // Always start with home
    breadcrumbItems.push({
      title: "Home",
      href: "/",
      icon: <Home className="w-4 h-4" />
    });

    // Build path progressively
    let currentPath = "";
    for (const segment of pathSegments) {
      currentPath += `/${segment}`;
      const mapping = routeMappings[currentPath];
      
      if (mapping) {
        breadcrumbItems.push({
          title: mapping.title,
          href: currentPath,
          icon: mapping.icon
        });
      } else {
        // Fallback for unmapped routes
        breadcrumbItems.push({
          title: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " "),
          href: currentPath
        });
      }
    }

    return breadcrumbItems;
  };

  const breadcrumbItems = generateBreadcrumbItems();

  // Convert to Ant Design breadcrumb format
  const antBreadcrumbItems = breadcrumbItems.map((item, index) => {
    const isLast = index === breadcrumbItems.length - 1;
    
    return {
      title: (
        <div className="flex items-center gap-2">
          {item.icon && <span className="flex items-center">{item.icon}</span>}
          {isLast ? (
            <Text strong className="text-gray-900 dark:text-gray-100">
              {item.title}
            </Text>
          ) : item.href ? (
            <Link 
              href={item.href}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              {item.title}
            </Link>
          ) : (
            <Text className="text-gray-600 dark:text-gray-400">
              {item.title}
            </Text>
          )}
        </div>
      )
    };
  });

  return (
    <div className={`breadcrumb-container ${className}`}>
      <AntBreadcrumb
        items={antBreadcrumbItems}
        separator={<ChevronRight className="w-4 h-4 text-gray-400" />}
        className="text-sm"
        style={{
          fontSize: '14px',
          lineHeight: '1.5'
        }}
      />
    </div>
  );
}

// Hook for getting current breadcrumb items
export function useBreadcrumb() {
  const pathname = usePathname();
  
  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split("/").filter(Boolean);
    const breadcrumbItems: BreadcrumbItem[] = [];

    breadcrumbItems.push({
      title: "Home",
      href: "/",
      icon: <Home className="w-4 h-4" />
    });

    let currentPath = "";
    for (const segment of pathSegments) {
      currentPath += `/${segment}`;
      const mapping = routeMappings[currentPath];
      
      if (mapping) {
        breadcrumbItems.push({
          title: mapping.title,
          href: currentPath,
          icon: mapping.icon
        });
      } else {
        breadcrumbItems.push({
          title: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " "),
          href: currentPath
        });
      }
    }

    return breadcrumbItems;
  };

  return {
    items: getBreadcrumbItems(),
    currentPath: pathname
  };
}
