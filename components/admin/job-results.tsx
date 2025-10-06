"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  Table, 
  Button, 
  Tag, 
  Space, 
  Typography, 
  Row, 
  Col, 
  Statistic,
  
  Alert,
  Spin,
  Empty
} from "antd";
import { 
  Play, 
  RefreshCw, 
  ExternalLink, 
  MapPin, 
  DollarSign,
  Building,
  Clock,
  CheckCircle,
  XCircle,
  Loader
} from "lucide-react";
import { useJobExecution, useJobs, useScrapingRuns, useJobStats, Job } from "./job-hooks";
import { DetailedErrorDisplay } from "./detailed-error-display";

const { Title, Text } = Typography;

interface JobResultsProps {
  configId: string;
  configName: string;
}

export function JobResults({ configId, configName }: JobResultsProps) {
  const [activeTab, setActiveTab] = useState<'jobs' | 'runs' | 'stats'>('jobs');
  
  const { isExecuting, error: executionError, detailedError, executeScraping, clearError } = useJobExecution();
  const {
    jobs,
    loading: jobsLoading,
    error: jobsError,
    page: jobsPage,
    pageSize: jobsPageSize,
    total: jobsTotal,
    fetchJobs,
    setPage: setJobsPage,
    setPageSize: setJobsPageSize,
  } = useJobs(configId);
  const {
    runs,
    loading: runsLoading,
    error: runsError,
    page: runsPage,
    pageSize: runsPageSize,
    total: runsTotal,
    fetchRuns,
    setPage: setRunsPage,
    setPageSize: setRunsPageSize,
  } = useScrapingRuns(configId);
  const { stats, loading: statsLoading, error: statsError, refreshStats } = useJobStats(configId);

  // Load initial data
  useEffect(() => {
    fetchJobs(1, 20);
    fetchRuns(1, 10);
    refreshStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configId]);

  const handleExecuteScraping = async () => {
    try {
      await executeScraping(configId);
      // Refresh all data after successful execution
      fetchJobs(jobsPage, jobsPageSize);
      fetchRuns(runsPage, runsPageSize);
      refreshStats();
    } catch (error) {
      console.error('Scraping execution failed:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'running': return 'processing';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'running': return <Loader className="w-4 h-4 animate-spin" />;
      default: return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSalary = (job: Job) => {
    if (job.compensation_min && job.compensation_max) {
      const currency = job.compensation_currency || 'USD';
      const interval = job.compensation_interval || 'yearly';
      return `${currency} ${job.compensation_min.toLocaleString()} - ${job.compensation_max.toLocaleString()} / ${interval}`;
    }
    return null;
  };

  const jobColumns = [
    {
      title: 'Job Title',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Job) => (
        <div>
          <Text strong>{title}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.company_name}
          </Text>
        </div>
      ),
    },
    {
      title: 'Job Type',
      dataIndex: 'job_type',
      key: 'job_type',
      render: (jobType: string) => jobType ? <Tag>{jobType}</Tag> : '-',
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      render: (location: string, record: Job) => (
        <div>
          {location && (
            <Space size="small">
              <MapPin className="w-3 h-3" />
              <Text>{location}</Text>
            </Space>
          )}
          {record.is_remote && <Tag color="blue">Remote</Tag>}
        </div>
      ),
    },
    {
      title: 'Salary',
      key: 'salary',
      render: (record: Job) => {
        const salary = formatSalary(record);
        return salary ? (
          <Space size="small">
            <DollarSign className="w-3 h-3" />
            <Text>{salary}</Text>
          </Space>
        ) : '-';
      },
    },
    {
      title: 'Posted',
      dataIndex: 'date_posted',
      key: 'date_posted',
      render: (date: string) => date ? formatDate(date) : '-',
    },
    {
      title: 'Remote',
      dataIndex: 'is_remote',
      key: 'is_remote',
      render: (isRemote: boolean) => (
        isRemote ? <Tag color="green">Remote</Tag> : <Tag color="default">Onsite</Tag>
      ),
    },
    {
      title: 'Site',
      dataIndex: 'site',
      key: 'site',
      render: (site: string) => <Tag color="cyan">{site}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Job) => (
        <Button
          type="link"
          size="small"
          icon={<ExternalLink className="w-3 h-3" />}
          onClick={() => window.open(record.job_url, '_blank')}
        >
          View Job
        </Button>
      ),
    },
  ];

  const runColumns = [
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Jobs Found',
      dataIndex: 'jobs_found',
      key: 'jobs_found',
    },
    {
      title: 'Jobs Saved',
      dataIndex: 'jobs_saved',
      key: 'jobs_saved',
    },
    {
      title: 'Duration',
      dataIndex: 'duration_seconds',
      key: 'duration_seconds',
      render: (seconds: number) => seconds ? `${seconds}s` : '-',
    },
    {
      title: 'Started',
      dataIndex: 'started_at',
      key: 'started_at',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Completed',
      dataIndex: 'completed_at',
      key: 'completed_at',
      render: (date: string) => date ? formatDate(date) : '-',
    },
    {
      title: 'Error',
      dataIndex: 'error_message',
      key: 'error_message',
      render: (error: string) => error ? (
        <Text type="danger" style={{ fontSize: '12px' }}>
          {error}
        </Text>
      ) : '-',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Execute Button */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={3} style={{ margin: 0 }}>Job Results: {configName}</Title>
          <Text type="secondary">View and manage scraped job data</Text>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<Play className="w-4 h-4" />}
          loading={isExecuting}
          onClick={handleExecuteScraping}
        >
          Execute Scraping
        </Button>
      </div>

      {/* Error Display */}
      {executionError && (
        <div>
          <Alert
            message="Scraping Execution Error"
            description={executionError}
            type="error"
            showIcon
            closable
            onClose={clearError}
          />
          {detailedError && (
            <DetailedErrorDisplay 
              error={detailedError} 
              onClose={clearError}
            />
          )}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-4 border-b">
        <button
          className={`pb-2 px-1 ${
            activeTab === 'jobs' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('jobs')}
        >
          Jobs ({jobsTotal})
        </button>
        <button
          className={`pb-2 px-1 ${
            activeTab === 'runs' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('runs')}
        >
          Runs ({runsTotal})
        </button>
        <button
          className={`pb-2 px-1 ${
            activeTab === 'stats' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Text strong>Scraped Jobs</Text>
            <Button
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={() => fetchJobs(jobsPage, jobsPageSize)}
              loading={jobsLoading}
            >
              Refresh
            </Button>
          </div>

          {jobsError && (
            <Alert
              message="Error Loading Jobs"
              description={jobsError}
              type="error"
              showIcon
            />
          )}

          {jobsLoading && jobs.length === 0 ? (
            <div className="text-center py-8">
              <Spin size="large" />
              <Text type="secondary" className="block mt-2">Loading jobs...</Text>
            </div>
          ) : jobs.length === 0 ? (
            <Empty
              description="No jobs found"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <>
              <Table
                columns={jobColumns}
                dataSource={jobs}
                rowKey="id"
                pagination={{
                  current: jobsPage,
                  pageSize: jobsPageSize,
                  total: jobsTotal,
                  showSizeChanger: true,
                  onChange: (page, pageSize) => {
                    if (pageSize !== jobsPageSize) setJobsPageSize(pageSize);
                    setJobsPage(page);
                    fetchJobs(page, pageSize);
                  },
                }}
                size="small"
                scroll={{ x: 800 }}
              />
            </>
          )}
        </div>
      )}

      {activeTab === 'runs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Text strong>Scraping Runs</Text>
            <Button
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={() => fetchRuns(runsPage, runsPageSize)}
              loading={runsLoading}
            >
              Refresh
            </Button>
          </div>

          {runsError && (
            <Alert
              message="Error Loading Runs"
              description={runsError}
              type="error"
              showIcon
            />
          )}

          {runsLoading ? (
            <div className="text-center py-8">
              <Spin size="large" />
              <Text type="secondary" className="block mt-2">Loading runs...</Text>
            </div>
          ) : runs.length === 0 ? (
            <Empty
              description="No scraping runs found"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Table
              columns={runColumns}
              dataSource={runs}
              rowKey="id"
              pagination={{
                current: runsPage,
                pageSize: runsPageSize,
                total: runsTotal,
                showSizeChanger: true,
                onChange: (page, pageSize) => {
                  if (pageSize !== runsPageSize) setRunsPageSize(pageSize);
                  setRunsPage(page);
                  fetchRuns(page, pageSize);
                },
              }}
              size="small"
            />
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Text strong>Statistics</Text>
            <Button
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={refreshStats}
              loading={statsLoading}
            >
              Refresh
            </Button>
          </div>

          {statsError && (
            <Alert
              message="Error Loading Statistics"
              description={statsError}
              type="error"
              showIcon
            />
          )}

          {statsLoading ? (
            <div className="text-center py-8">
              <Spin size="large" />
              <Text type="secondary" className="block mt-2">Loading statistics...</Text>
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Overview Stats */}
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic
                      title="Total Jobs"
                      value={stats.total_jobs}
                      prefix={<Building className="w-4 h-4" />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic
                      title="Job Sites"
                      value={Object.keys(stats.jobs_by_site).length}
                      prefix={<ExternalLink className="w-4 h-4" />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic
                      title="Latest Run"
                      value={stats.latest_run ? 'Completed' : 'Never'}
                      prefix={<Clock className="w-4 h-4" />}
                    />
                  </Card>
                </Col>
              </Row>

              {/* Jobs by Site */}
              <Card title="Jobs by Site">
                <Row gutter={[16, 16]}>
                  {Object.entries(stats.jobs_by_site).map(([site, count]) => (
                    <Col xs={12} sm={8} md={6} key={site}>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{count}</div>
                        <div className="text-sm text-gray-500">{site}</div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card>

              {/* Latest Run Details */}
              {stats.latest_run && (
                <Card title="Latest Run Details">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title="Status"
                        value={stats.latest_run.status}
                        valueStyle={{ 
                          color: stats.latest_run.status === 'completed' ? '#52c41a' : 
                                 stats.latest_run.status === 'failed' ? '#ff4d4f' : '#1890ff'
                        }}
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title="Jobs Found"
                        value={stats.latest_run.jobs_found}
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title="Duration"
                        value={stats.latest_run.duration_seconds || 0}
                        suffix="seconds"
                      />
                    </Col>
                  </Row>
                </Card>
              )}
            </div>
          ) : (
            <Empty
              description="No statistics available"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>
      )}
    </div>
  );
}
