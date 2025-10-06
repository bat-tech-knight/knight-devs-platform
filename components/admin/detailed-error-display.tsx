"use client";

import React from 'react';
import { Card, Alert, Collapse, Tag, Typography, Space } from 'antd';
import { ExclamationCircleOutlined, InfoCircleOutlined, BugOutlined } from '@ant-design/icons';
import { DetailedError } from './job-hooks';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface DetailedErrorDisplayProps {
  error: DetailedError;
  onClose?: () => void;
}

export function DetailedErrorDisplay({ error, onClose }: DetailedErrorDisplayProps) {
  const hasValidationErrors = error.validation_errors && error.validation_errors.length > 0;
  const hasWarnings = error.warnings && error.warnings.length > 0;

  return (
    <Card 
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
          <span>Configuration Error Details</span>
        </Space>
      }
      extra={onClose && <a onClick={onClose}>Close</a>}
      style={{ marginTop: 16 }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Main Error */}
        <Alert
          message="Error"
          description={error.error}
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
        />

        {/* Error Type */}
        {error.error_type && (
          <div>
            <Text strong>Error Type: </Text>
            <Tag color="red">{error.error_type}</Tag>
          </div>
        )}

        {/* Validation Errors */}
        {hasValidationErrors && (
          <div>
            <Title level={5}>
              <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
              Validation Errors ({error.validation_errors!.length})
            </Title>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {error.validation_errors!.map((validationError, index) => (
                <Alert
                  key={index}
                  message={validationError}
                  type="error"
                  showIcon
                />
              ))}
            </Space>
          </div>
        )}

        {/* Warnings */}
        {hasWarnings && (
          <div>
            <Title level={5}>
              <InfoCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />
              Warnings ({error.warnings!.length})
            </Title>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {error.warnings!.map((warning, index) => (
                <Alert
                  key={index}
                  message={warning}
                  type="warning"
                  showIcon
                />
              ))}
            </Space>
          </div>
        )}

        {/* Debug Information */}
        <Collapse size="small">
          <Panel 
            header={
              <Space>
                <BugOutlined />
                <span>Debug Information</span>
              </Space>
            } 
            key="debug"
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {/* Received Configuration */}
              {error.received_config && (
                <div>
                  <Title level={5}>Received Configuration:</Title>
                  <pre style={{ 
                    background: '#f5f5f5', 
                    padding: 12, 
                    borderRadius: 4,
                    fontSize: 12,
                    overflow: 'auto',
                    maxHeight: 200
                  }}>
                    {JSON.stringify(error.received_config, null, 2)}
                  </pre>
                </div>
              )}

              {/* Supported Sites */}
              {error.supported_sites && (
                <div>
                  <Title level={5}>Supported Sites:</Title>
                  <Space wrap>
                    {error.supported_sites.map((site, index) => (
                      <Tag key={index} color="blue">{site}</Tag>
                    ))}
                  </Space>
                </div>
              )}

              {/* Supported Countries */}
              {error.supported_countries && (
                <div>
                  <Title level={5}>Supported Countries:</Title>
                  <Space wrap>
                    {error.supported_countries.slice(0, 20).map((country, index) => (
                      <Tag key={index} color="green">{country}</Tag>
                    ))}
                    {error.supported_countries.length > 20 && (
                      <Tag color="default">... and {error.supported_countries.length - 20} more</Tag>
                    )}
                  </Space>
                </div>
              )}

              {/* Supported Job Types */}
              {error.supported_job_types && (
                <div>
                  <Title level={5}>Supported Job Types:</Title>
                  <Space wrap>
                    {error.supported_job_types.map((jobType, index) => (
                      <Tag key={index} color="purple">{jobType}</Tag>
                    ))}
                  </Space>
                </div>
              )}
            </Space>
          </Panel>
        </Collapse>

        {/* Help Text */}
        <Alert
          message="How to Fix"
          description={
            <div>
              <Paragraph style={{ margin: 0 }}>
                To resolve these issues:
              </Paragraph>
              <ul style={{ marginTop: 8, marginBottom: 0 }}>
                {hasValidationErrors && (
                  <li>Check the validation errors above and correct the configuration values</li>
                )}
                <li>Ensure all required fields are provided</li>
                <li>Verify that site names, countries, and job types match the supported values</li>
                <li>Check that numeric values are within valid ranges</li>
                <li>Review the debug information for more details about what was received</li>
              </ul>
            </div>
          }
          type="info"
          showIcon
        />
      </Space>
    </Card>
  );
}
