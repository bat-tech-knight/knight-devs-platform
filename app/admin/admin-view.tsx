"use client";

import { Card, Row, Col, Typography, Tag, Space, Button, Spin } from "antd";
import { 
  Shield, 
  Users, 
  Briefcase, 
  Settings,
  Activity,
  RotateCcw
} from "lucide-react";
import { useAdminStats } from "./hooks";
import { AdminStats } from "./admin-data";

const { Title, Text } = Typography;

interface AdminDashboardViewProps {
  initialStats: AdminStats;
}

export function AdminDashboardView({ initialStats }: AdminDashboardViewProps) {
  const { stats, loading, error, refreshStats } = useAdminStats(initialStats);

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Welcome Header */}
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space align="center">
            <Shield className="w-8 h-8" style={{ color: '#ff4d4f' }} />
            <div>
              <Typography.Title level={2} style={{ margin: 0 }}>Admin Dashboard</Typography.Title>
              <Typography.Text type="secondary">
                Welcome back! Manage your system and configurations.
              </Typography.Text>
            </div>
          </Space>
          <Button 
            icon={<RotateCcw />} 
            onClick={refreshStats}
            loading={loading}
            type="default"
          >
            Refresh
          </Button>
        </Space>

        {/* Status Banner */}
        <Card style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
          <Space align="center">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#52c41a' }}>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <Text strong style={{ color: '#52c41a' }}>Administrative privileges active</Text>
          </Space>
          <Text style={{ color: '#52c41a', fontSize: '12px', marginTop: '4px', display: 'block' }}>
            You have full access to system administration features.
          </Text>
        </Card>

        {/* Error Banner */}
        {error && (
          <Card style={{ background: '#fff2f0', border: '1px solid #ffccc7' }}>
            <Text style={{ color: '#ff4d4f' }}>Error: {error}</Text>
          </Card>
        )}

        {/* Stats Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text strong>Scraping Configs</Text>
                  <Settings className="h-4 w-4" style={{ color: '#8c8c8c' }} />
                </Space>
                <Title level={2} style={{ margin: 0 }}>
                  {loading ? <Spin size="small" /> : stats.configCount}
                </Title>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Total configurations
                </Text>
                <Tag color="blue" style={{ fontSize: '12px' }}>
                  {loading ? <Spin size="small" /> : `${stats.activeConfigCount} active`}
                </Tag>
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text strong>Users</Text>
                  <Users className="h-4 w-4" style={{ color: '#8c8c8c' }} />
                </Space>
                <Title level={2} style={{ margin: 0 }}>
                  {loading ? <Spin size="small" /> : stats.userCount}
                </Title>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Registered users
                </Text>
                <Tag color="orange" style={{ fontSize: '12px' }}>
                  Coming Soon
                </Tag>
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text strong>Jobs</Text>
                  <Briefcase className="h-4 w-4" style={{ color: '#8c8c8c' }} />
                </Space>
                <Title level={2} style={{ margin: 0 }}>-</Title>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Scraped job listings
                </Text>
                <Tag color="orange" style={{ fontSize: '12px' }}>
                  Coming Soon
                </Tag>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Quick Actions */}
        <Card>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space align="center">
              <Activity className="w-5 h-5" />
              <Title level={4} style={{ margin: 0 }}>Quick Actions</Title>
            </Space>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card hoverable>
                  <Space align="center">
                    <Settings className="w-5 h-5" style={{ color: '#1890ff' }} />
                    <Space direction="vertical" size="small">
                      <Text strong>Manage Scraping Configs</Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Create and configure job scraping settings
                      </Text>
                    </Space>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card style={{ opacity: 0.5 }}>
                  <Space align="center">
                    <Users className="w-5 h-5" style={{ color: '#52c41a' }} />
                    <Space direction="vertical" size="small">
                      <Text strong>User Management</Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Manage user accounts and permissions
                      </Text>
                    </Space>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Space>
        </Card>
      </Space>
    </div>
  );
}
