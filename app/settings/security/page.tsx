"use client";

import { useState } from "react";
import { Button, Card, Form, Input, message, Alert, Divider, Space, Typography } from "antd";
import { 
  SaveOutlined, 
  LockOutlined, 
  EyeInvisibleOutlined, 
  EyeTwoTone,
  SecurityScanOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";
import { createClient } from "@/lib/supabase/client";

const { Text, Title } = Typography;

export default function SecuritySettingsPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handlePasswordChange = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('New passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      const supabase = createClient();
      
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword
      });

      if (error) throw error;
      
      message.success('Password updated successfully!');
      form.resetFields(['currentPassword', 'newPassword', 'confirmPassword']);
    } catch (error: any) {
      console.error('Error updating password:', error);
      message.error(error.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEmailChange = async (values: any) => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      const { error } = await supabase.auth.updateUser({
        email: values.newEmail
      });

      if (error) throw error;
      
      message.success('Email update request sent! Please check your new email for confirmation.');
      form.resetFields(['newEmail']);
    } catch (error: any) {
      console.error('Error updating email:', error);
      message.error(error.message || 'Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Security Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account security and authentication settings
        </p>
      </div>

      {/* Security Overview */}
      <Card className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <SecurityScanOutlined className="text-2xl text-green-500" />
          <div>
            <Title level={4} className="mb-0">Account Security</Title>
            <Text type="secondary">Your account security status</Text>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <CheckCircleOutlined className="text-green-500" />
            <div>
              <Text strong className="text-green-700 dark:text-green-400">Password Protected</Text>
              <div className="text-sm text-green-600 dark:text-green-500">Strong password enabled</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <CheckCircleOutlined className="text-blue-500" />
            <div>
              <Text strong className="text-blue-700 dark:text-blue-400">Email Verified</Text>
              <div className="text-sm text-blue-600 dark:text-blue-500">Account email confirmed</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <CheckCircleOutlined className="text-purple-500" />
            <div>
              <Text strong className="text-purple-700 dark:text-purple-400">Secure Login</Text>
              <div className="text-sm text-purple-600 dark:text-purple-500">HTTPS encryption</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Password Change */}
      <Card title="Change Password" className="mb-6">
        <Alert
          message="Password Requirements"
          description="Your password must be at least 8 characters long and contain a mix of letters, numbers, and symbols."
          type="info"
          showIcon
          className="mb-4"
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handlePasswordChange}
          className="max-w-md"
        >
          <Form.Item
            label="Current Password"
            name="currentPassword"
            rules={[{ required: true, message: 'Please enter your current password' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter current password"
              size="large"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <Form.Item
            label="New Password"
            name="newPassword"
            rules={[
              { required: true, message: 'Please enter a new password' },
              { min: 8, message: 'Password must be at least 8 characters' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter new password"
              size="large"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <Form.Item
            label="Confirm New Password"
            name="confirmPassword"
            rules={[
              { required: true, message: 'Please confirm your new password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm new password"
              size="large"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={passwordLoading}
            icon={<SaveOutlined />}
            size="large"
          >
            Update Password
          </Button>
        </Form>
      </Card>

      {/* Email Change */}
      <Card title="Change Email Address" className="mb-6">
        <Alert
          message="Email Change Process"
          description="Changing your email will require verification. You'll receive a confirmation email at your new address."
          type="warning"
          showIcon
          className="mb-4"
        />

        <Form
          layout="vertical"
          onFinish={handleEmailChange}
          className="max-w-md"
        >
          <Form.Item
            label="New Email Address"
            name="newEmail"
            rules={[
              { required: true, message: 'Please enter a new email address' },
              { type: 'email', message: 'Please enter a valid email address' }
            ]}
          >
            <Input
              placeholder="Enter new email address"
              size="large"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<SaveOutlined />}
            size="large"
          >
            Update Email
          </Button>
        </Form>
      </Card>

      {/* Account Actions */}
      <Card title="Account Actions" className="mb-6">
        <Space direction="vertical" size="large" className="w-full">
          <div className="p-4 border border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50 dark:bg-orange-900/20">
            <Title level={5} className="text-orange-700 dark:text-orange-400 mb-2">
              Export Account Data
            </Title>
            <Text className="text-orange-600 dark:text-orange-300 block mb-3">
              Download a copy of your account data including profile information, preferences, and activity history.
            </Text>
            <Button type="default" size="large">
              Request Data Export
            </Button>
          </div>

          <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
            <Title level={5} className="text-red-700 dark:text-red-400 mb-2">
              Delete Account
            </Title>
            <Text className="text-red-600 dark:text-red-300 block mb-3">
              Permanently delete your account and all associated data. This action cannot be undone.
            </Text>
            <Button danger size="large">
              Delete Account
            </Button>
          </div>
        </Space>
      </Card>

      {/* Security Tips */}
      <Card title="Security Tips">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircleOutlined className="text-green-500 mt-1" />
            <div>
              <Text strong>Use a strong, unique password</Text>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Combine letters, numbers, and symbols. Avoid using personal information.
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircleOutlined className="text-green-500 mt-1" />
            <div>
              <Text strong>Keep your email secure</Text>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Your email is used for account recovery and important notifications.
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircleOutlined className="text-green-500 mt-1" />
            <div>
              <Text strong>Log out from shared devices</Text>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Always log out when using public or shared computers.
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircleOutlined className="text-green-500 mt-1" />
            <div>
              <Text strong>Report suspicious activity</Text>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Contact support immediately if you notice any unauthorized access to your account.
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
