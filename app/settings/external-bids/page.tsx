"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card, Select, Space, Table, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined } from "@ant-design/icons";
import { createClient } from "@/lib/supabase/client";
import { getProfileDisplayName, getStoredActiveProfileId, setStoredActiveProfileId, UserProfileOption } from "@/lib/profile-selection";

type SubmissionRow = {
  id: string;
  profile_id: string;
  page_url: string;
  page_title: string;
  hostname: string | null;
  notes: string | null;
  created_at: string;
};

export default function ExternalBidsPage() {
  const [profiles, setProfiles] = useState<UserProfileOption[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [rows, setRows] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(false);

  const loadProfiles = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userProfiles } = await supabase
      .from("profiles")
      .select("id, user_id, role, first_name, last_name, email")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    const profileList = (userProfiles || []) as UserProfileOption[];
    setProfiles(profileList);

    const stored = getStoredActiveProfileId();
    const resolved =
      stored && profileList.some((p) => p.id === stored) ? stored : profileList[0]?.id ?? null;
    setSelectedProfileId(resolved);
    if (resolved) setStoredActiveProfileId(resolved);
  }, []);

  const loadSubmissions = useCallback(async (profileId: string | null) => {
    if (!profileId) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("extension_external_submissions")
        .select("*")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRows((data || []) as SubmissionRow[]);
    } catch (e) {
      console.error(e);
      message.error("Failed to load recorded bids");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  useEffect(() => {
    void loadSubmissions(selectedProfileId);
  }, [selectedProfileId, loadSubmissions]);

  const handleDelete = async (row: SubmissionRow) => {
    if (!selectedProfileId) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("extension_external_submissions")
      .delete()
      .eq("id", row.id)
      .eq("profile_id", selectedProfileId);
    if (error) {
      message.error("Delete failed");
      return;
    }
    message.success("Removed");
    await loadSubmissions(selectedProfileId);
  };

  const columns: ColumnsType<SubmissionRow> = [
    {
      title: "Recorded",
      dataIndex: "created_at",
      key: "created_at",
      width: 168,
      render: (d: string) => new Date(d).toLocaleString(),
    },
    {
      title: "Page title",
      dataIndex: "page_title",
      key: "page_title",
      ellipsis: true,
      render: (t: string, r) => t || r.hostname || "—",
    },
    {
      title: "URL",
      dataIndex: "page_url",
      key: "page_url",
      ellipsis: true,
      render: (url: string) => (
        <a href={url} target="_blank" rel="noopener noreferrer">
          {url}
        </a>
      ),
    },
    {
      title: "Host",
      dataIndex: "hostname",
      key: "hostname",
      width: 160,
      render: (h: string | null) => h || "—",
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      ellipsis: true,
      render: (n: string | null) => n || "—",
    },
    {
      title: "",
      key: "actions",
      width: 72,
      render: (_, row) => (
        <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => void handleDelete(row)} />
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1100 }}>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        External bids
      </Typography.Title>
      <Typography.Text type="secondary">
        When you submit a proposal on another site, use the extension’s <strong>Record bid submitted</strong> button
        or the page right-click menu so we store this tab’s URL and title for the expert profile you selected.
      </Typography.Text>

      <Card style={{ marginTop: 16 }}>
        <Space wrap style={{ marginBottom: 16 }}>
          <Typography.Text strong>Expert profile</Typography.Text>
          <Select
            style={{ minWidth: 240 }}
            value={selectedProfileId ?? undefined}
            placeholder="Select profile"
            options={profiles.map((p) => ({
              value: p.id,
              label: getProfileDisplayName(p),
            }))}
            onChange={(id) => {
              setSelectedProfileId(id);
              setStoredActiveProfileId(id);
            }}
          />
        </Space>

        <Table<SubmissionRow>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 12 }}
          locale={{ emptyText: "No bids recorded yet. Use the Chrome extension on the job page after you submit." }}
        />
      </Card>
    </div>
  );
}
