"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card, Form, Input, Modal, Select, Space, Table, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { createClient } from "@/lib/supabase/client";
import { getProfileDisplayName, getStoredActiveProfileId, setStoredActiveProfileId, UserProfileOption } from "@/lib/profile-selection";
import { buildQuestionKeyBrowser } from "@/lib/question-key-browser";

const { TextArea } = Input;
const { Text } = Typography;

type SavedRow = {
  id: string;
  profile_id: string;
  question_key: string;
  label_snapshot: string;
  answer_text: string;
  source: string;
  hostname: string | null;
  external_field_id: string | null;
  updated_at: string;
};

export default function ApplicationAnswersPage() {
  const [profiles, setProfiles] = useState<UserProfileOption[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [rows, setRows] = useState<SavedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SavedRow | null>(null);
  const [form] = Form.useForm<{
    labelSnapshot: string;
    answerText: string;
    source: string;
    hostname: string;
    externalFieldId: string;
  }>();

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

  const loadAnswers = useCallback(async (profileId: string | null) => {
    if (!profileId) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("saved_application_answers")
        .select("*")
        .eq("profile_id", profileId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setRows((data || []) as SavedRow[]);
    } catch (e) {
      console.error(e);
      message.error("Failed to load saved answers");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  useEffect(() => {
    void loadAnswers(selectedProfileId);
  }, [selectedProfileId, loadAnswers]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      source: "generic",
      hostname: "",
      externalFieldId: "",
      labelSnapshot: "",
      answerText: "",
    });
    setModalOpen(true);
  };

  const openEdit = (row: SavedRow) => {
    setEditing(row);
    form.setFieldsValue({
      labelSnapshot: row.label_snapshot,
      answerText: row.answer_text,
      source: row.source,
      hostname: row.hostname ?? "",
      externalFieldId: row.external_field_id ?? "",
    });
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    const values = await form.validateFields();
    if (!selectedProfileId) {
      message.error("Select a profile");
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      message.error("Not signed in");
      return;
    }

    const labelSnapshot = values.labelSnapshot.trim().slice(0, 2000);
    const hostname = values.hostname.trim().toLowerCase() || "unknown";
    const source = (values.source || "generic").trim().toLowerCase();
    const ext = values.externalFieldId?.trim() || null;

    try {
      if (editing) {
        const { error } = await supabase
          .from("saved_application_answers")
          .update({
            label_snapshot: labelSnapshot || editing.label_snapshot,
            answer_text: values.answerText,
            source,
            hostname: hostname || null,
            external_field_id: ext,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editing.id)
          .eq("profile_id", selectedProfileId);

        if (error) throw error;
        message.success("Updated");
      } else {
        const questionKey = await buildQuestionKeyBrowser({
          source,
          hostname,
          externalFieldId: ext,
          labelText: labelSnapshot || "untitled",
        });
        const { error } = await supabase.from("saved_application_answers").upsert(
          {
            profile_id: selectedProfileId,
            question_key: questionKey,
            label_snapshot: labelSnapshot || questionKey,
            answer_text: values.answerText,
            source,
            hostname: hostname || null,
            external_field_id: ext,
          },
          { onConflict: "profile_id,question_key" }
        );

        if (error) throw error;
        message.success("Saved");
      }
      setModalOpen(false);
      await loadAnswers(selectedProfileId);
    } catch (e) {
      console.error(e);
      message.error("Save failed");
    }
  };

  const handleDelete = async (row: SavedRow) => {
    Modal.confirm({
      title: "Delete this saved answer?",
      onOk: async () => {
        const supabase = createClient();
        const { error } = await supabase
          .from("saved_application_answers")
          .delete()
          .eq("id", row.id)
          .eq("profile_id", row.profile_id);
        if (error) {
          message.error("Delete failed");
          return;
        }
        message.success("Deleted");
        await loadAnswers(selectedProfileId);
      },
    });
  };

  const columns: ColumnsType<SavedRow> = [
    {
      title: "Question / label",
      dataIndex: "label_snapshot",
      key: "label",
      ellipsis: true,
      width: "28%",
    },
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      width: 100,
    },
    {
      title: "Host",
      dataIndex: "hostname",
      key: "hostname",
      width: 160,
      render: (h: string | null) => h || "—",
    },
    {
      title: "Answer preview",
      dataIndex: "answer_text",
      key: "preview",
      ellipsis: true,
      render: (t: string) => (t.length > 120 ? `${t.slice(0, 120)}…` : t || "—"),
    },
    {
      title: "Updated",
      dataIndex: "updated_at",
      key: "updated_at",
      width: 160,
      render: (d: string) => new Date(d).toLocaleString(),
    },
    {
      title: "",
      key: "actions",
      width: 120,
      render: (_, row) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(row)} />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1100 }}>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Application answers
      </Typography.Title>
      <Text type="secondary">
        Reuse text for job application custom questions. The browser extension can fill, save, or draft with AI per
        field. Keys match by site + field id or question label hash.
      </Text>

      <Card style={{ marginTop: 16 }}>
        <Space wrap style={{ marginBottom: 16 }}>
          <Text strong>Expert profile</Text>
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
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} disabled={!selectedProfileId}>
            Add answer
          </Button>
        </Space>

        <Table<SavedRow>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editing ? "Edit saved answer" : "Add saved answer"}
        open={modalOpen}
        onOk={() => void handleModalOk()}
        onCancel={() => setModalOpen(false)}
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item
            name="labelSnapshot"
            label="Question label (for you to recognize)"
            rules={[{ required: true, message: "Enter a label" }]}
          >
            <Input placeholder="e.g. Why this company?" />
          </Form.Item>
          <Form.Item name="answerText" label="Answer text" rules={[{ required: true, message: "Enter answer text" }]}>
            <TextArea rows={8} placeholder="Full answer to paste into applications" />
          </Form.Item>
          <Form.Item name="source" label="Source" initialValue="generic">
            <Select
              options={[
                { value: "generic", label: "generic" },
                { value: "greenhouse", label: "greenhouse" },
                { value: "lever", label: "lever" },
              ]}
            />
          </Form.Item>
          <Form.Item name="hostname" label="Hostname (optional)" extra="e.g. job-boards.greenhouse.io — used in the key">
            <Input placeholder="Leave empty for generic / unknown host" />
          </Form.Item>
          <Form.Item
            name="externalFieldId"
            label="External field id (optional)"
            extra="e.g. question_12345 — strongest match in the extension"
          >
            <Input placeholder="Optional stable id from the form" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
