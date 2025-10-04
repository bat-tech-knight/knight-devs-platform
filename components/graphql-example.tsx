'use client';

import { useState } from 'react';
import { Button, Card, List, Input, Form, message, Avatar, Space, Typography } from 'antd';
import { UserOutlined, EditOutlined } from '@ant-design/icons';
import { 
  type Profiles,
  type ProfilesInsertInput,
  type ProfilesUpdateInput
} from '@/lib/apollo/generated/graphql';

import { 
  useGetCurrentUserProfile,
  useCreateProfile,
  useEditProfile
} from '@/lib/apollo/hooks';

const { Title, Text } = Typography;

export default function ProfilesExample() {
  const [form] = Form.useForm();
  const [editingProfile, setEditingProfile] = useState<Profiles | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Query current user's profile using manual hook
  const { data, loading, error, refetch } = useGetCurrentUserProfile();

  // Create profile using manual hook
  const { createProfile, loading: createLoading } = useCreateProfile();

  // Edit profile using manual hook
  const { editProfile, loading: editLoading } = useEditProfile();

  // Note: Remove profile functionality removed since it's not needed for current user profile management

  const handleSubmit = async (values: { firstName: string; lastName: string; avatarUrl?: string }) => {
    setIsSubmitting(true);
    
    try {
      if (editingProfile) {
        const updateInput: ProfilesUpdateInput = {
          first_name: values.firstName,
          last_name: values.lastName,
          avatar_url: values.avatarUrl,
        };
        
        const result = await editProfile(editingProfile.id, updateInput);
        if (result) {
          message.success('Profile updated successfully!');
          form.resetFields();
          setEditingProfile(null);
          refetch();
        }
      } else {
        const insertInput: ProfilesInsertInput = {
          first_name: values.firstName,
          last_name: values.lastName,
          avatar_url: values.avatarUrl,
        };
        
        const result = await createProfile(insertInput);
        if (result) {
          message.success('Profile created successfully!');
          form.resetFields();
          refetch();
        }
      }
    } catch (error) {
      console.error('Error submitting profile:', error);
      message.error(`Failed to ${editingProfile && 'update' ? 'update' : 'create'} profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (profile: { first_name?: string | null; last_name?: string | null; avatar_url?: string | null; id: string }) => {
    setEditingProfile(profile as Profiles);
    form.setFieldsValue({
      firstName: profile.first_name,
      lastName: profile.last_name,
      avatarUrl: profile.avatar_url,
    });
  };

  const handleCancel = () => {
    setEditingProfile(null);
    form.resetFields();
  };


  if (loading || createLoading || editLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading profile: {error.message}</div>;

  // Extract the current user's profile (it should be the first/only item)
  const currentProfile = data?.profilesCollection?.edges?.[0]?.node;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Title level={1}>Profile Management</Title>
      
      {/* Create/Edit Profile Form */}
      <Card title={editingProfile ? 'Edit Profile' : 'Create New Profile'} className="mb-6">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={isSubmitting}
        >
          <Form.Item
            name="firstName"
            label="First Name"
            rules={[{ required: true, message: 'Please input first name!' }]}
          >
            <Input placeholder="Enter first name" />
          </Form.Item>
          
          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[{ required: true, message: 'Please input last name!' }]}
          >
            <Input placeholder="Enter last name" />
          </Form.Item>
          
          <Form.Item
            name="avatarUrl"
            label="Avatar URL"
          >
            <Input placeholder="Enter avatar URL (optional)" />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={isSubmitting || createLoading || editLoading}>
                {editingProfile ? 'Update Profile' : 'Create Profile'}
              </Button>
              {editingProfile && (
                <Button onClick={handleCancel}>
                  Cancel
                </Button>
              )}
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* Current User Profile */}
      <Card title="Your Profile">
        {currentProfile ? (
          <List
            dataSource={[currentProfile]}
            renderItem={(profile) => (
              <List.Item
                actions={[
                  <Button
                    key="edit"
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(profile)}
                  >
                    Edit Profile
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      src={profile.avatar_url} 
                      icon={<UserOutlined />}
                      size="large"
                    />
                  }
                  title={`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unnamed Profile'}
                  description={
                    <Space direction="vertical" size="small">
                      <Text type="secondary">
                        Created: {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                      </Text>
                      {profile.updated_at && profile.updated_at !== profile.created_at && (
                        <Text type="secondary">
                          Updated: {new Date(profile.updated_at).toLocaleDateString()}
                        </Text>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <div className="text-center py-8">
            <Text type="secondary">No profile found. Create your profile using the form above.</Text>
          </div>
        )}
      </Card>
    </div>
  );
}
