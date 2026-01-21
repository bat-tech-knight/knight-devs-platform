"use client";

import React, { useEffect, useState } from "react";
import { ConfigProvider, theme as antdTheme } from "antd";
import { useTheme } from "next-themes";

type AntdThemeProviderProps = {
  children: React.ReactNode;
};

export default function AntdThemeProvider({ children }: AntdThemeProviderProps) {
  const { theme: nextTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch by not reading theme until mounted
  if (!mounted) {
    return <>{children}</>; 
  }

  const resolvedTheme = nextTheme === "system" ? systemTheme : nextTheme;
  const isDark = resolvedTheme === "dark";

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: isDark ? "#3b82f6" : "#3b82f6", // Modern blue
          colorSuccess: "#10b981", // Modern green
          colorWarning: "#f59e0b", // Modern amber
          colorError: "#ef4444", // Modern red
          colorInfo: "#8b5cf6", // Modern purple
          borderRadius: 12, // More rounded corners
          wireframe: false, // Solid backgrounds
          fontFamily: "var(--font-inter), system-ui, -apple-system, sans-serif",
        },
        components: {
          Button: {
            borderRadius: 8,
            controlHeight: 36,
          },
          Input: {
            borderRadius: 8,
            controlHeight: 36,
          },
          Card: {
            borderRadius: 12,
          },
          Dropdown: {
            borderRadius: 8,
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}


