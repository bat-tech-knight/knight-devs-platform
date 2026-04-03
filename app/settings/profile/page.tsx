"use client";

import { useState, useEffect } from "react";
import { Button, Card, Form, Input, Upload, Avatar, message } from "antd";
import { UserOutlined, EditOutlined, SaveOutlined, MailOutlined, PhoneOutlined, LinkOutlined } from "@ant-design/icons";
import { syncBuiltinSavedAnswersFromProfile } from "@/lib/builtin-saved-answers";
import { formatProfileLocation } from "@/lib/format-profile-location";
import { createClient } from "@/lib/supabase/client";
import { getProfileDisplayName, getStoredActiveProfileId, setStoredActiveProfileId, UserProfileOption } from "@/lib/profile-selection";

export default function ProfileSettingsPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<UserProfileOption[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: userProfiles } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        const profileList = (userProfiles || []) as UserProfileOption[];
        setProfiles(profileList);

        const storedProfileId = getStoredActiveProfileId();
        const resolvedProfileId =
          storedProfileId && profileList.some((entry) => entry.id === storedProfileId)
            ? storedProfileId
            : profileList[0]?.id || null;

        setSelectedProfileId(resolvedProfileId);
        if (resolvedProfileId) {
          setStoredActiveProfileId(resolvedProfileId);
        }

        const profileData = profileList.find((entry) => entry.id === resolvedProfileId);
        if (profileData) {
          setAvatarUrl(profileData.avatar_url ?? null);
          form.setFieldsValue({
            firstName: profileData.first_name,
            lastName: profileData.last_name,
            email: profileData.email,
            phoneNumber: profileData.phone_number,
            linkedinUrl: profileData.linkedin_url,
            githubUrl: profileData.github_url,
            twitterUrl: profileData.twitter_url,
            addressLine1: profileData.address_line1,
            addressCity: profileData.address_city,
            addressState: profileData.address_state,
            addressCountry: profileData.address_country,
            addressPostalCode: profileData.address_postal_code,
            timezone: profileData.timezone,
          });
        }
      }
    };

    fetchProfile();
  }, [form]);

  const handleSave = async (values: Record<string, string>) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && selectedProfileId) {
        const addressParts = {
          address_line1: values.addressLine1?.trim() || null,
          address_city: values.addressCity?.trim() || null,
          address_state: values.addressState?.trim() || null,
          address_country: values.addressCountry?.trim() || null,
          address_postal_code: values.addressPostalCode?.trim() || null,
        };
        const locationSummary = formatProfileLocation(addressParts) || null;

        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: selectedProfileId,
            user_id: user.id,
            first_name: values.firstName,
            last_name: values.lastName,
            email: values.email,
            phone_number: values.phoneNumber,
            linkedin_url: values.linkedinUrl,
            github_url: values.githubUrl,
            twitter_url: values.twitterUrl,
            location: locationSummary,
            ...addressParts,
            timezone: values.timezone,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;

        await syncBuiltinSavedAnswersFromProfile(supabase, selectedProfileId, {
          first_name: values.firstName,
          last_name: values.lastName,
          email: values.email,
          phone_number: values.phoneNumber,
          linkedin_url: values.linkedinUrl,
          github_url: values.githubUrl,
          twitter_url: values.twitterUrl,
          location: locationSummary,
          ...addressParts,
        });

        message.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const profileId = event.target.value;
    if (!profileId) {
      return;
    }
    setSelectedProfileId(profileId);
    setStoredActiveProfileId(profileId);
    const selected = profiles.find((entry) => entry.id === profileId);
    if (!selected) {
      return;
    }

    setAvatarUrl(selected.avatar_url || null);
    form.setFieldsValue({
      firstName: selected.first_name,
      lastName: selected.last_name,
      email: selected.email,
      phoneNumber: selected.phone_number,
      linkedinUrl: selected.linkedin_url,
      githubUrl: selected.github_url,
      twitterUrl: selected.twitter_url,
      addressLine1: selected.address_line1,
      addressCity: selected.address_city,
      addressState: selected.address_state,
      addressCountry: selected.address_country,
      addressPostalCode: selected.address_postal_code,
      timezone: selected.timezone,
    });
  };

  const handleCreateProfile = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      const { data: createdProfile, error } = await supabase
        .from("profiles")
        .insert({
          user_id: user.id,
          first_name: "New",
          last_name: "Profile",
          email: user.email || null,
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      await syncBuiltinSavedAnswersFromProfile(supabase, createdProfile.id, {
        first_name: createdProfile.first_name,
        last_name: createdProfile.last_name,
        email: createdProfile.email,
        phone_number: createdProfile.phone_number,
        linkedin_url: createdProfile.linkedin_url,
        github_url: createdProfile.github_url,
        twitter_url: createdProfile.twitter_url,
        location: createdProfile.location,
        address_line1: createdProfile.address_line1 ?? null,
        address_city: createdProfile.address_city ?? null,
        address_state: createdProfile.address_state ?? null,
        address_country: createdProfile.address_country ?? null,
        address_postal_code: createdProfile.address_postal_code ?? null,
      });

      const updatedProfiles = [...profiles, createdProfile as UserProfileOption];
      setProfiles(updatedProfiles);
      setSelectedProfileId(createdProfile.id);
      setStoredActiveProfileId(createdProfile.id);
      setAvatarUrl(createdProfile.avatar_url || null);
      form.setFieldsValue({
        firstName: createdProfile.first_name,
        lastName: createdProfile.last_name,
        email: createdProfile.email,
        phoneNumber: createdProfile.phone_number,
        linkedinUrl: createdProfile.linkedin_url,
        githubUrl: createdProfile.github_url,
        twitterUrl: createdProfile.twitter_url,
        addressLine1: createdProfile.address_line1,
        addressCity: createdProfile.address_city,
        addressState: createdProfile.address_state,
        addressCountry: createdProfile.address_country,
        addressPostalCode: createdProfile.address_postal_code,
        timezone: createdProfile.timezone,
      });

      message.success("New profile created");
    } catch (error) {
      console.error("Error creating profile:", error);
      message.error("Failed to create profile");
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && selectedProfileId) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${selectedProfileId}/avatar-${Date.now()}.${fileExt}`;

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
        <Card title="Profile Selection" className="mb-6">
          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Active Profile</label>
          <div className="flex gap-3 items-center">
            <select
              className="w-full md:w-auto min-w-[280px] px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-slate-900"
              value={selectedProfileId || ""}
              onChange={handleProfileSelection}
            >
              {profiles.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {getProfileDisplayName(entry)}
                </option>
              ))}
            </select>
            <Button onClick={handleCreateProfile}>Create Profile</Button>
          </div>
        </Card>

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

          <div className="grid grid-cols-1 gap-4 mt-4">
            <Form.Item label="Address line 1" name="addressLine1">
              <Input placeholder="123 Main Street, Apt 4" size="large" />
            </Form.Item>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item label="City" name="addressCity">
                <Input placeholder="San Francisco" size="large" />
              </Form.Item>
              <Form.Item label="State / province" name="addressState">
                <Input placeholder="CA" size="large" />
              </Form.Item>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item label="Country" name="addressCountry">
                <Input placeholder="United States" size="large" />
              </Form.Item>
              <Form.Item label="ZIP / postal code" name="addressPostalCode">
                <Input placeholder="94102" size="large" />
              </Form.Item>
            </div>
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
