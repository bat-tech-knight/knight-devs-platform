"use client";

import { usePathname, useRouter } from "next/navigation";
import { Menu, Typography, Space, Tag, Tooltip } from "antd";
import { 
  Settings, 
  Users, 
  Briefcase, 
  Shield,
  Home
} from "lucide-react";

const { Text } = Typography;

interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  disabled?: boolean;
}

interface AdminSidebarProps {
  collapsed?: boolean;
  onCollapse?: () => void;
}

const navigationItems: NavItem[] = [
  {
    key: "/admin",
    label: "Dashboard",
    icon: <Home className="w-4 h-4" />,
    description: "Overview and statistics"
  },
  {
    key: "/admin/scraping",
    label: "Job Scraping",
    icon: <Settings className="w-4 h-4" />,
    description: "Manage scraping configurations"
  },
  {
    key: "/admin/users",
    label: "Users",
    icon: <Users className="w-4 h-4" />,
    description: "Manage user accounts",
    disabled: true
  },
  {
    key: "/admin/jobs",
    label: "Jobs",
    icon: <Briefcase className="w-4 h-4" />,
    description: "View scraped job listings",
    disabled: true
  }
];

export function AdminSidebar({ collapsed = false }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleMenuClick = ({ key }: { key: string }) => {
    router.push(key);
  };

  const menuItems = navigationItems.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: collapsed ? (
      <Tooltip title={`${item.label} - ${item.description}`} placement="right">
        <span style={{ fontWeight: '500', fontSize: '14px' }}>{item.label}</span>
      </Tooltip>
    ) : (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: '500', fontSize: '14px' }}>{item.label}</span>
        </div>
        {item.disabled && (
          <Tag color="orange">
            Soon
          </Tag>
        )}
      </div>
    ),
    disabled: item.disabled,
  }));

  return (
    <div 
      style={{ 
        width: collapsed ? '80px' : '256px',
        height: '100%',
        background: 'var(--ant-color-bg-container)',
        borderRight: '1px solid var(--ant-color-border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease-in-out',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{ 
        padding: collapsed ? '16px 12px' : '24px', 
        borderBottom: '1px solid var(--ant-color-border)',
        background: 'var(--ant-color-bg-container)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start'
      }}>
        {collapsed ? (
          <Tooltip title="Admin Dashboard" placement="right">
            <Shield style={{ color: 'var(--ant-color-error)', fontSize: '24px' }} />
          </Tooltip>
        ) : (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space align="center">
              <Shield style={{ color: 'var(--ant-color-error)', fontSize: '20px' }} />
              <Text strong style={{ fontSize: '18px', color: 'var(--ant-color-text)' }}>
                Admin Dashboard
              </Text>
            </Space>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              System administration
            </Text>
          </Space>
        )}
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ 
            border: 'none',
            background: 'transparent',
            fontSize: '14px'
          }}
          inlineCollapsed={collapsed}
        />
      </div>

      {/* Footer */}
      <div style={{ 
        padding: collapsed ? '12px' : '16px', 
        borderTop: '1px solid var(--ant-color-border)',
        background: 'var(--ant-color-bg-container)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start'
      }}>
        {collapsed ? (
          <Tooltip title="Version 1.0.0" placement="right">
            <Text type="secondary" style={{ fontSize: '12px' }}>
              v1.0.0
            </Text>
          </Tooltip>
        ) : (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Admin privileges required
            </Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Version 1.0.0
            </Text>
          </Space>
        )}
      </div>
    </div>
  );
}
