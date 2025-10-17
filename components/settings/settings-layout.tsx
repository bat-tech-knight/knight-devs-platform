"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Layout, Menu, Avatar, Typography } from "antd";
import { 
  UserOutlined, 
  SecurityScanOutlined, 
  ProfileOutlined,
  LogoutOutlined
} from "@ant-design/icons";
import SimpleHeader from "@/components/candidate/simple-header";

const { Sider, Content } = Layout;
const { Text } = Typography;

interface SettingsLayoutProps {
  children: React.ReactNode;
}

const settingsMenuItems = [
  {
    key: '/settings/profile',
    icon: <UserOutlined />,
    label: 'Profile',
    description: 'Basic information and contact details'
  },
  {
    key: '/settings/expert',
    icon: <ProfileOutlined />,
    label: 'Expert Profile',
    description: 'Professional skills and experience'
  },
  {
    key: '/settings/security',
    icon: <SecurityScanOutlined />,
    label: 'Security',
    description: 'Password and account security'
  }
];

interface User {
  id: string;
  email?: string;
}

interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const getUserData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUser(user);
        
        // Get profile data
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        setProfile(profileData);
      }
    };

    getUserData();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    router.push(key);
  };

  const selectedKey = pathname;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <SimpleHeader 
        title="Settings" 
        subtitle="Manage your account and preferences"
        showBackButton={true}
      />

      <Layout className="max-w-7xl mx-auto">
        <Sider
          width={280}
          collapsed={collapsed}
          onCollapse={setCollapsed}
          className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"
          theme="light"
        >
          <div className="p-4">
            <Text strong className="text-lg">Settings</Text>
            <Text type="secondary" className="block text-sm mt-1">
              Manage your account and preferences
            </Text>
            
            
          </div>
          
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            onClick={handleMenuClick}
            className="border-none bg-transparent"
            items={settingsMenuItems.map(item => ({
              key: item.key,
              icon: item.icon,
              label: (
                <div>
                  <div className="font-medium">{item.label}</div>
                </div>
              )
            }))}
          />
          {/* User Info and Logout */}
          {user && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar 
                    src={profile?.avatar_url} 
                    icon={<UserOutlined />}
                    size="small"
                  />
                  <Text className="text-sm font-medium">
                    {profile?.first_name} {profile?.last_name}
                  </Text>
                </div>
                <Button
                  type="text"
                  danger
                  icon={<LogoutOutlined />}
                  onClick={handleLogout}
                  size="small"
                  className="w-full"
                >
                  Sign Out
                </Button>
              </div>
            )}
        </Sider>

        <Content className="p-6">
          <Card className="min-h-[600px] shadow-sm">
            {children}
          </Card>
        </Content>
      </Layout>
    </div>
  );
}
