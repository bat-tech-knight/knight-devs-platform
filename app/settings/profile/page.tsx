"use client";

import { useState, useEffect } from "react";
import { Button, Card, Form, Input, Upload, Avatar, message, Divider } from "antd";
import { UserOutlined, EditOutlined, SaveOutlined, MailOutlined, PhoneOutlined, LinkOutlined } from "@ant-design/icons";
import { createClient } from "@/lib/supabase/client";

export default function ProfileSettingsPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileData) {
          setProfile(profileData);
          setAvatarUrl(profileData.avatar_url);
          form.setFieldsValue({
            firstName: profileData.first_name,
            lastName: profileData.last_name,
            email: profileData.email,
            phoneNumber: profileData.phone_number,
            linkedinUrl: profileData.linkedin_url,
            githubUrl: profileData.github_url,
            twitterUrl: profileData.twitter_url,
            location: profileData.location,
            timezone: profileData.timezone,
          });
        }
      }
    };

    fetchProfile();
  }, [form]);

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            first_name: values.firstName,
            last_name: values.lastName,
            email: values.email,
            phone_number: values.phoneNumber,
            linkedin_url: values.linkedinUrl,
            github_url: values.githubUrl,
            twitter_url: values.twitterUrl,
            location: values.location,
            timezone: values.timezone,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
        
        message.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        setAvatarUrl(urlData.publicUrl);
        message.success('Avatar updated successfully!');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      message.error('Failed to upload avatar');
    }
    return false; // Prevent default upload
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Profile Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your basic profile information and contact details
        </p>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        className="space-y-6"
      >
        {/* Profile Picture */}
        <Card title="Profile Picture" className="mb-6">
          <div className="flex items-center gap-6">
            <Avatar
              size={120}
              src={avatarUrl}
              icon={<UserOutlined />}
              className="border-4 border-blue-100 dark:border-blue-900"
            />
            <div>
              <Upload
                showUploadList={false}
                beforeUpload={handleAvatarUpload}
                accept="image/*"
              >
                <Button icon={<EditOutlined />}>
                  Change Avatar
                </Button>
              </Upload>
              <p className="text-sm text-gray-500 mt-2">
                JPG, PNG or GIF. Max size 2MB.
              </p>
            </div>
          </div>
        </Card>

        {/* Personal Information */}
        <Card title="Personal Information" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="First Name"
              name="firstName"
              rules={[{ required: true, message: 'Please enter your first name' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="John"
                size="large"
              />
            </Form.Item>
            
            <Form.Item
              label="Last Name"
              name="lastName"
              rules={[{ required: true, message: 'Please enter your last name' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Doe"
                size="large"
              />
            </Form.Item>
          </div>
        </Card>

        {/* Contact Information */}
        <Card title="Contact Information" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="john.doe@example.com"
                size="large"
              />
            </Form.Item>
            
            <Form.Item
              label="Phone Number"
              name="phoneNumber"
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="+1 (555) 123-4567"
                size="large"
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Form.Item
              label="Location"
              name="location"
            >
              <Input
                placeholder="San Francisco, CA, USA"
                size="large"
              />
            </Form.Item>
            
            <Form.Item
              label="Timezone"
              name="timezone"
            >
              <Input
                placeholder="UTC-8:00"
                size="large"
              />
            </Form.Item>
          </div>
        </Card>

        {/* Social Links */}
        <Card title="Social Links" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Form.Item
              label="LinkedIn"
              name="linkedinUrl"
            >
              <Input
                prefix={<LinkOutlined />}
                placeholder="https://linkedin.com/in/johndoe"
                size="large"
              />
            </Form.Item>
            
            <Form.Item
              label="GitHub"
              name="githubUrl"
            >
              <Input
                prefix={<LinkOutlined />}
                placeholder="https://github.com/johndoe"
                size="large"
              />
            </Form.Item>
            
            <Form.Item
              label="Twitter"
              name="twitterUrl"
            >
              <Input
                prefix={<LinkOutlined />}
                placeholder="https://twitter.com/johndoe"
                size="large"
              />
            </Form.Item>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<SaveOutlined />}
            size="large"
          >
            Save Changes
          </Button>
        </div>
      </Form>
    </div>
  );
}
