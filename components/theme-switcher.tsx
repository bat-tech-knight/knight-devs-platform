"use client";

import { Button, Dropdown, Space } from "antd";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const ICON_SIZE = 16;

  const items = [
    {
      key: "light",
      label: (
        <Space>
          <Sun size={ICON_SIZE} />
          <span>Light</span>
        </Space>
      ),
    },
    {
      key: "dark",
      label: (
        <Space>
          <Moon size={ICON_SIZE} />
          <span>Dark</span>
        </Space>
      ),
    },
    {
      key: "system",
      label: (
        <Space>
          <Laptop size={ICON_SIZE} />
          <span>System</span>
        </Space>
      ),
    },
  ];

  const getCurrentIcon = () => {
    switch (theme) {
      case "light":
        return <Sun size={ICON_SIZE} />;
      case "dark":
        return <Moon size={ICON_SIZE} />;
      default:
        return <Laptop size={ICON_SIZE} />;
    }
  };

  return (
    <Dropdown
      menu={{
        items,
        onClick: ({ key }) => setTheme(key),
        selectedKeys: [theme || "system"],
      }}
      trigger={["click"]}
      placement="bottomRight"
    >
      <Button
        type="text"
        size="small"
        icon={getCurrentIcon()}
        className="flex items-center justify-center hover:bg-accent/50 transition-colors"
        style={{
          color: "hsl(var(--foreground))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "var(--radius)",
          minWidth: "36px",
          height: "36px",
        }}
        title={`Current theme: ${theme || "system"}`}
      />
    </Dropdown>
  );
};

export { ThemeSwitcher };
