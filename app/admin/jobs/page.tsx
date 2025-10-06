import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, Typography, Space, Row, Col, Tag } from "antd";
import { Briefcase, Clock, Search, Filter } from "lucide-react";

const { Title, Text } = Typography;

export default async function JobsPage() {
  const supabase = await createClient();

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Check if user is admin
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !profile || profile.role !== 'admin') {
    redirect("/protected");
  }

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <Space align="center">
          <Briefcase className="w-8 h-8" style={{ color: '#1890ff' }} />
          <div>
            <Title level={1} style={{ margin: 0 }}>Job Listings</Title>
            <Text type="secondary">
              View and manage scraped job listings from various sources.
            </Text>
          </div>
        </Space>

        {/* Coming Soon Banner */}
        <Card style={{ background: '#fffbe6', border: '1px solid #ffe58f' }}>
          <Space align="center">
            <Clock className="w-6 h-6" style={{ color: '#faad14' }} />
            <Space direction="vertical" size="small">
              <Title level={4} style={{ margin: 0, color: '#faad14' }}>
                Coming Soon
              </Title>
              <Text style={{ color: '#faad14' }}>
                Job listing management features are currently under development.
              </Text>
            </Space>
          </Space>
        </Card>

        {/* Feature Preview Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space align="center">
                  <Search className="w-5 h-5" />
                  <Title level={4} style={{ margin: 0 }}>Job Search</Title>
                </Space>
                <Text type="secondary">
                  Search and filter through scraped job listings.
                </Text>
                <Tag color="orange">Coming Soon</Tag>
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space align="center">
                  <Filter className="w-5 h-5" />
                  <Title level={4} style={{ margin: 0 }}>Job Analytics</Title>
                </Space>
                <Text type="secondary">
                  View analytics and insights about scraped job data.
                </Text>
                <Tag color="orange">Coming Soon</Tag>
              </Space>
            </Card>
          </Col>
        </Row>
      </Space>
    </div>
  );
}
