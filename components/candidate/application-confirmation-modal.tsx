"use client";

import React from "react";
import { Modal, Button, Typography } from "antd";
import { CheckCircle, XCircle } from "lucide-react";
import { Job } from "./job-hooks";

const { Text, Title } = Typography;

interface ApplicationConfirmationModalProps {
  visible: boolean;
  job: Job | null;
  onConfirm: (applied: boolean) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function ApplicationConfirmationModal({
  visible,
  job,
  onConfirm,
  onCancel,
  loading = false
}: ApplicationConfirmationModalProps) {
  const handleYes = async () => {
    try {
      await onConfirm(true);
    } catch (error) {
      console.error('Error confirming application:', error);
    }
  };

  const handleNo = async () => {
    try {
      await onConfirm(false);
    } catch (error) {
      console.error('Error confirming application:', error);
    }
  };

  if (!job) return null;

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      closable={!loading}
      maskClosable={!loading}
      width={500}
      className="application-confirmation-modal"
    >
      <div className="py-4">
        <div className="text-center mb-6">
          <div className="mb-4">
            <Title level={4} className="mb-2">
              Did you apply to this position?
            </Title>
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 mb-4">
              <Text strong className="text-lg block mb-1">
                {job.title}
              </Text>
              <Text type="secondary" className="block">
                {job.company_name || 'Company'}
              </Text>
            </div>
            <Text className="text-gray-600 dark:text-gray-400">
              We want to help you keep track of your applications.
            </Text>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Button
            type="primary"
            size="large"
            icon={<CheckCircle className="w-4 h-4" />}
            onClick={handleYes}
            loading={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 border-green-600"
          >
            Yes, I applied
          </Button>
          <Button
            size="large"
            icon={<XCircle className="w-4 h-4" />}
            onClick={handleNo}
            loading={loading}
            className="flex-1"
          >
            No, I didn't apply
          </Button>
        </div>
      </div>
    </Modal>
  );
}
