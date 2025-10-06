"use client";

import { useState } from "react";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Play, 
  Pause,
  Calendar,
  MapPin,
  Search,
  Settings,
  BarChart3,
  Eye
} from "lucide-react";
import { 
  Select as AntSelect, 
  Button, 
  Card, 
  Input, 
  Checkbox, 
  Tag,
  Space,
  Typography,
  Row,
  Col
} from "antd";
import { JobResults } from "./job-results";
import { updateScrapingConfig } from "./job-hooks";

const { Title, Text } = Typography;

// Country options for Indeed (based on jobspy Country enum)
const COUNTRY_OPTIONS = [
  { label: 'United States', value: 'usa' },
  { label: 'United Kingdom', value: 'uk' },
  { label: 'Canada', value: 'canada' },
  { label: 'Australia', value: 'australia' },
  { label: 'Germany', value: 'germany' },
  { label: 'France', value: 'france' },
  { label: 'Netherlands', value: 'netherlands' },
  { label: 'India', value: 'india' },
  { label: 'Singapore', value: 'singapore' },
  { label: 'Japan', value: 'japan' },
  { label: 'Brazil', value: 'brazil' },
  { label: 'Mexico', value: 'mexico' },
  { label: 'Spain', value: 'spain' },
  { label: 'Italy', value: 'italy' },
  { label: 'Sweden', value: 'sweden' },
  { label: 'Norway', value: 'norway' },
  { label: 'Denmark', value: 'denmark' },
  { label: 'Finland', value: 'finland' },
  { label: 'Switzerland', value: 'switzerland' },
  { label: 'Austria', value: 'austria' },
  { label: 'Belgium', value: 'belgium' },
  { label: 'Ireland', value: 'ireland' },
  { label: 'New Zealand', value: 'new zealand' },
  { label: 'South Africa', value: 'south africa' },
  { label: 'Argentina', value: 'argentina' },
  { label: 'Chile', value: 'chile' },
  { label: 'Colombia', value: 'colombia' },
  { label: 'Peru', value: 'peru' },
  { label: 'Ecuador', value: 'ecuador' },
  { label: 'Uruguay', value: 'uruguay' },
  { label: 'Venezuela', value: 'venezuela' },
  { label: 'Costa Rica', value: 'costa rica' },
  { label: 'Panama', value: 'panama' },
  { label: 'China', value: 'china' },
  { label: 'Hong Kong', value: 'hong kong' },
  { label: 'Taiwan', value: 'taiwan' },
  { label: 'South Korea', value: 'south korea' },
  { label: 'Thailand', value: 'thailand' },
  { label: 'Malaysia', value: 'malaysia' },
  { label: 'Indonesia', value: 'indonesia' },
  { label: 'Philippines', value: 'philippines' },
  { label: 'Vietnam', value: 'vietnam' },
  { label: 'Pakistan', value: 'pakistan' },
  { label: 'Bangladesh', value: 'bangladesh' },
  { label: 'Sri Lanka', value: 'sri lanka' },
  { label: 'Nepal', value: 'nepal' },
  { label: 'Turkey', value: 'turkey' },
  { label: 'Israel', value: 'israel' },
  { label: 'United Arab Emirates', value: 'united arab emirates' },
  { label: 'Saudi Arabia', value: 'saudi arabia' },
  { label: 'Qatar', value: 'qatar' },
  { label: 'Kuwait', value: 'kuwait' },
  { label: 'Bahrain', value: 'bahrain' },
  { label: 'Oman', value: 'oman' },
  { label: 'Egypt', value: 'egypt' },
  { label: 'Morocco', value: 'morocco' },
  { label: 'Nigeria', value: 'nigeria' },
  { label: 'Kenya', value: 'kenya' },
  { label: 'Ghana', value: 'ghana' },
  { label: 'Poland', value: 'poland' },
  { label: 'Czech Republic', value: 'czech republic' },
  { label: 'Hungary', value: 'hungary' },
  { label: 'Romania', value: 'romania' },
  { label: 'Bulgaria', value: 'bulgaria' },
  { label: 'Croatia', value: 'croatia' },
  { label: 'Slovenia', value: 'slovenia' },
  { label: 'Slovakia', value: 'slovakia' },
  { label: 'Estonia', value: 'estonia' },
  { label: 'Latvia', value: 'latvia' },
  { label: 'Lithuania', value: 'lithuania' },
  { label: 'Luxembourg', value: 'luxembourg' },
  { label: 'Malta', value: 'malta' },
  { label: 'Cyprus', value: 'cyprus' },
  { label: 'Greece', value: 'greece' },
  { label: 'Ukraine', value: 'ukraine' },
];

interface ScrapingConfig {
  id: string;
  name: string;
  search_term: string;
  location: string;
  sites: string[]; // Keep as array for database compatibility, but frontend will use single selection
  results_wanted: number;
  hours_old?: number;
  is_remote: boolean;
  job_type?: string;
  country_indeed?: string;
  google_search_term?: string;
  distance?: number;
  easy_apply: boolean;
  linkedin_fetch_description: boolean;
  linkedin_company_ids?: string[];
  enforce_annual_salary: boolean;
  description_format: string;
  page_offset?: number;
  log_level: number;
  is_active: boolean;
  last_run?: string;
  next_run?: string;
  created_at: string;
  updated_at: string;
}

interface SiteConfig {
  id: string;
  name: string;
  description: string;
  fields: {
    location: boolean;
    job_type: boolean;
    country_indeed: boolean;
    google_search_term: boolean;
    distance: boolean;
    easy_apply: boolean;
    linkedin_fetch_description: boolean;
    linkedin_company_ids: boolean;
    enforce_annual_salary: boolean;
    hours_old: boolean;
  };
}

const SITE_CONFIGS: SiteConfig[] = [
  {
    id: 'indeed',
    name: 'Indeed',
    description: 'Job search engine',
    fields: {
      location: true,
      job_type: true,
      country_indeed: true,
      google_search_term: false,
      distance: true,
      easy_apply: true,
      linkedin_fetch_description: false,
      linkedin_company_ids: false,
      enforce_annual_salary: true,
      hours_old: true,
    }
  },
  {
    id: 'glassdoor',
    name: 'Glassdoor',
    description: 'Company reviews & jobs',
    fields: {
      location: true,
      job_type: true,
      country_indeed: false,
      google_search_term: false,
      distance: true,
      easy_apply: false,
      linkedin_fetch_description: false,
      linkedin_company_ids: false,
      enforce_annual_salary: true,
      hours_old: true,
    }
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Professional network',
    fields: {
      location: true,
      job_type: true,
      country_indeed: false,
      google_search_term: false,
      distance: false,
      easy_apply: true,
      linkedin_fetch_description: true,
      linkedin_company_ids: true,
      enforce_annual_salary: true,
      hours_old: false,
    }
  },
  {
    id: 'producthunt',
    name: 'ProductHunt',
    description: 'Product discovery',
    fields: {
      location: false,
      job_type: false,
      country_indeed: false,
      google_search_term: false,
      distance: false,
      easy_apply: false,
      linkedin_fetch_description: false,
      linkedin_company_ids: false,
      enforce_annual_salary: false,
      hours_old: true,
    }
  },
  {
    id: 'jsjobbs',
    name: 'JSJobbs',
    description: 'JavaScript jobs',
    fields: {
      location: true,
      job_type: false,
      country_indeed: false,
      google_search_term: false,
      distance: false,
      easy_apply: false,
      linkedin_fetch_description: false,
      linkedin_company_ids: false,
      enforce_annual_salary: false,
      hours_old: true,
    }
  },
  {
    id: 'stackoverflow',
    name: 'Stack Overflow',
    description: 'Developer jobs',
    fields: {
      location: true,
      job_type: true,
      country_indeed: false,
      google_search_term: false,
      distance: false,
      easy_apply: false,
      linkedin_fetch_description: false,
      linkedin_company_ids: false,
      enforce_annual_salary: true,
      hours_old: true,
    }
  },
  {
    id: 'angelist',
    name: 'AngelList',
    description: 'Startup jobs',
    fields: {
      location: true,
      job_type: true,
      country_indeed: false,
      google_search_term: false,
      distance: false,
      easy_apply: false,
      linkedin_fetch_description: false,
      linkedin_company_ids: false,
      enforce_annual_salary: true,
      hours_old: true,
    }
  },
  {
    id: 'remoteok',
    name: 'RemoteOK',
    description: 'Remote jobs',
    fields: {
      location: false,
      job_type: true,
      country_indeed: false,
      google_search_term: false,
      distance: false,
      easy_apply: false,
      linkedin_fetch_description: false,
      linkedin_company_ids: false,
      enforce_annual_salary: true,
      hours_old: true,
    }
  },
  {
    id: 'weworkremotely',
    name: 'We Work Remotely',
    description: 'Remote work',
    fields: {
      location: false,
      job_type: true,
      country_indeed: false,
      google_search_term: false,
      distance: false,
      easy_apply: false,
      linkedin_fetch_description: false,
      linkedin_company_ids: false,
      enforce_annual_salary: true,
      hours_old: true,
    }
  }
];

interface ScrapingConfigManagerProps {
  initialConfigs: ScrapingConfig[];
}

export function ScrapingConfigManager({ initialConfigs }: ScrapingConfigManagerProps) {
  const [configs, setConfigs] = useState<ScrapingConfig[]>(initialConfigs);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [viewingResultsId, setViewingResultsId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ScrapingConfig>>({
    name: "",
    search_term: "",
    location: "",
    sites: [],
    results_wanted: 10,
    country_indeed: "usa", // Default to USA
    is_remote: false,
    easy_apply: false,
    linkedin_fetch_description: false,
    enforce_annual_salary: false,
    description_format: "markdown",
    log_level: 2,
    is_active: true,
  });

  // Get the configuration for selected sites
  const getSelectedSiteConfigs = () => {
    const selectedSites = formData.sites || [];
    return SITE_CONFIGS.filter(site => selectedSites.includes(site.id));
  };

  // Check if a field should be shown for any selected site
  const shouldShowField = (fieldName: keyof SiteConfig['fields']) => {
    const selectedConfigs = getSelectedSiteConfigs();
    return selectedConfigs.some(config => config.fields[fieldName]);
  };


  // No need to fetch configs since we get them as props

  // Create new config
  const handleCreate = async () => {
    // Validate required fields
    if (!formData.name || !formData.search_term) {
      alert("Please fill in all required fields (Name, Search Term)");
      return;
    }

    // Validate country for Indeed
    if (formData.sites?.includes('indeed') && !formData.country_indeed) {
      alert("Country is required when using Indeed");
      return;
    }

    try {
      const response = await fetch("/api/admin/scraping-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newConfig = await response.json();
        setConfigs(prev => [newConfig, ...prev]);
        setIsCreating(false);
        setFormData({
          name: "",
          search_term: "",
          location: "",
          sites: [],
          results_wanted: 10,
          country_indeed: "usa", // Default to USA
          is_remote: false,
          easy_apply: false,
          linkedin_fetch_description: false,
          enforce_annual_salary: false,
          description_format: "markdown",
          log_level: 2,
          is_active: true,
        });
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error creating config:", error);
    }
  };

  // Update config (via Supabase client)
  const handleUpdate = async (id: string) => {
    // Validate required fields
    if (!formData.name || !formData.search_term) {
      alert("Please fill in all required fields (Name, Search Term)");
      return;
    }

    // Validate country for Indeed
    if (formData.sites?.includes('indeed') && !formData.country_indeed) {
      alert("Country is required when using Indeed");
      return;
    }

    try {
      const updatedConfig = await updateScrapingConfig(id, formData as Record<string, unknown>);
      setConfigs(prev => prev.map(c => c.id === id ? updatedConfig : c));
      setEditingId(null);
    } catch (error: unknown) {
      console.error("Error updating config:", error);
      const message = error instanceof Error ? error.message : 'Failed to update configuration';
      alert(`Error: ${message}`);
    }
  };

  // Delete config
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this configuration?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/scraping-config/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setConfigs(prev => prev.filter(c => c.id !== id));
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error deleting config:", error);
    }
  };

  // Toggle active status
  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/scraping-config/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !isActive }),
      });

      if (response.ok) {
        setConfigs(prev => prev.map(c => c.id === id ? { ...c, is_active: !isActive } : c));
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error toggling active status:", error);
    }
  };

  const startEdit = (config: ScrapingConfig) => {
    setEditingId(config.id);
    setFormData(config);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setViewingResultsId(null);
    setFormData({
      name: "",
      search_term: "",
      location: "",
      sites: [],
      results_wanted: 10,
      country_indeed: "usa", // Default to USA
      is_remote: false,
      easy_apply: false,
      linkedin_fetch_description: false,
      enforce_annual_salary: false,
      description_format: "markdown",
      log_level: 2,
      is_active: true,
    });
  };

  const viewResults = (config: ScrapingConfig) => {
    setViewingResultsId(config.id);
  };

  return (
    <div className="space-y-6">
      {/* Create New Config Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={3} style={{ margin: 0 }}>Scraping Configurations</Title>
        <Button
          type="primary"
          onClick={() => setIsCreating(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          New Configuration
        </Button>
      </div>

      {/* Create/Edit Modal */}
      {(isCreating || editingId) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50" 
            onClick={cancelEdit}
          />
          
          {/* Modal */}
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Settings className="w-5 h-5" />
                {isCreating ? "Create New Configuration" : "Edit Configuration"}
              </h2>
              <button
                onClick={cancelEdit}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Content */}
            <div className="overflow-y-auto max-h-[60vh] p-6">
              <div className="space-y-6">
                {/* Basic Settings */}
                <div>
                  <Title level={4}>Basic Settings</Title>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Text strong>Configuration Name</Text>
                        <Input
                          value={formData.name || ""}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g., Senior Developer Jobs"
                        />
                      </Space>
                    </Col>
                    <Col xs={24} md={12}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Text strong>Search Term</Text>
                        <Input
                          value={formData.search_term || ""}
                          onChange={(e) => setFormData({ ...formData, search_term: e.target.value })}
                          placeholder="e.g., React Developer"
                        />
                      </Space>
                    </Col>
                    <Col xs={24} md={12}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Text strong>Results Wanted</Text>
                        <Input
                          type="number"
                          value={formData.results_wanted || 10}
                          onChange={(e) => setFormData({ ...formData, results_wanted: parseInt(e.target.value) })}
                        />
                      </Space>
                    </Col>
                  </Row>
                </div>

                {/* Sites Selection */}
                <div>
                  <Title level={4}>Job Sites</Title>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>Select Job Site</Text>
                    <AntSelect
                      placeholder="Select a job site..."
                      value={formData.sites && formData.sites.length > 0 ? formData.sites[0] : undefined}
                      onChange={(value) => setFormData({ ...formData, sites: value ? [value] : [] })}
                      style={{ width: '100%' }}
                      options={SITE_CONFIGS.map((site) => ({
                        label: site.name,
                        value: site.id,
                        title: `${site.name} - ${site.description}`
                      }))}
                    />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Select one job site to scrape from
                    </Text>
                    
                    {/* Selected Site Display */}
                    {formData.sites && formData.sites.length > 0 && (
                      <Space wrap>
                        {formData.sites.map((siteId) => {
                          const site = SITE_CONFIGS.find(s => s.id === siteId);
                          return site ? (
                            <Tag key={siteId} color="blue">
                              {site.name}
                            </Tag>
                          ) : null;
                        })}
                      </Space>
                    )}
                  </Space>

                  {/* Site-specific fields */}
                  {(formData.sites || []).length > 0 && (
                    <div style={{ marginTop: '24px' }}>
                      <Text strong>Site-Specific Options</Text>
                      <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                        Options available for {(formData.sites && formData.sites.length > 0) ? SITE_CONFIGS.find(s => s.id === formData.sites![0])?.name : 'selected site'}
                      </Text>
                      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                        {shouldShowField('location') && (
                          <Col xs={24} md={12}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                              <Text strong>Location (Optional)</Text>
                              <Input
                                value={formData.location || ""}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="e.g., New York, NY"
                              />
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                Optional - location filtering for this site
                              </Text>
                            </Space>
                          </Col>
                        )}
                        
                        {shouldShowField('job_type') && (
                          <Col xs={24} md={12}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                              <Text strong>Job Type (Optional)</Text>
                              <Input
                                value={formData.job_type || ""}
                                onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}
                                placeholder="e.g., Full-time, Part-time"
                              />
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                Optional - filter by job type
                              </Text>
                            </Space>
                          </Col>
                        )}
                        
                        {shouldShowField('country_indeed') && (
                          <Col xs={24} md={12}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                              <Text strong>Country (Indeed) <Text type="danger">*</Text></Text>
                              <AntSelect
                                placeholder="Select country..."
                                value={formData.country_indeed || undefined}
                                onChange={(value) => setFormData({ ...formData, country_indeed: value })}
                                style={{ width: '100%' }}
                                options={COUNTRY_OPTIONS}
                                showSearch
                                filterOption={(input, option) =>
                                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                              />
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                Required for Indeed scraping
                              </Text>
                            </Space>
                          </Col>
                        )}
                        
                        {shouldShowField('distance') && (
                          <Col xs={24} md={12}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                              <Text strong>Distance (Optional)</Text>
                              <Input
                                type="number"
                                value={formData.distance || ""}
                                onChange={(e) => setFormData({ ...formData, distance: parseInt(e.target.value) })}
                                placeholder="e.g., 25"
                              />
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                Optional - search radius in miles
                              </Text>
                            </Space>
                          </Col>
                        )}
                        
                        {shouldShowField('hours_old') && (
                          <Col xs={24} md={12}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                              <Text strong>Hours Old</Text>
                              <Input
                                type="number"
                                value={formData.hours_old || ""}
                                onChange={(e) => setFormData({ ...formData, hours_old: parseInt(e.target.value) })}
                                placeholder="e.g., 24"
                              />
                            </Space>
                          </Col>
                        )}
                      </Row>
                    </div>
                  )}
                </div>

                {/* Advanced Settings */}
                <div>
                  <Title level={4}>Advanced Settings</Title>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={8}>
                        <Checkbox
                          checked={formData.is_remote || false}
                          onChange={(e) => setFormData({ ...formData, is_remote: e.target.checked })}
                        >
                          Remote Jobs Only
                        </Checkbox>
                      </Col>
                      
                      {shouldShowField('easy_apply') && (
                        <Col xs={24} md={8}>
                          <Checkbox
                            checked={formData.easy_apply || false}
                            onChange={(e) => setFormData({ ...formData, easy_apply: e.target.checked })}
                          >
                            Easy Apply
                          </Checkbox>
                        </Col>
                      )}
                      
                      {shouldShowField('linkedin_fetch_description') && (
                        <Col xs={24} md={8}>
                          <Checkbox
                            checked={formData.linkedin_fetch_description || false}
                            onChange={(e) => setFormData({ ...formData, linkedin_fetch_description: e.target.checked })}
                          >
                            LinkedIn Description
                          </Checkbox>
                        </Col>
                      )}
                      
                      {shouldShowField('enforce_annual_salary') && (
                        <Col xs={24} md={8}>
                          <Checkbox
                            checked={formData.enforce_annual_salary || false}
                            onChange={(e) => setFormData({ ...formData, enforce_annual_salary: e.target.checked })}
                          >
                            Enforce Salary
                          </Checkbox>
                        </Col>
                      )}
                    </Row>
                    
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Text strong>Description Format</Text>
                          <AntSelect
                            value={formData.description_format || "markdown"}
                            onChange={(value) => setFormData({ ...formData, description_format: value })}
                            style={{ width: '100%' }}
                            options={[
                              { label: "Markdown", value: "markdown" },
                              { label: "HTML", value: "html" },
                              { label: "Plain Text", value: "text" }
                            ]}
                          />
                        </Space>
                      </Col>
                      
                      <Col xs={24} md={12}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Text strong>Log Level</Text>
                          <Input
                            type="number"
                            min="0"
                            max="3"
                            value={formData.log_level || 2}
                            onChange={(e) => setFormData({ ...formData, log_level: parseInt(e.target.value) })}
                          />
                        </Space>
                      </Col>
                    </Row>
                  </Space>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button onClick={cancelEdit}>
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={isCreating ? handleCreate : () => editingId && handleUpdate(editingId)}
                icon={<Save className="w-4 h-4" />}
              >
                {isCreating ? "Create Configuration" : "Update Configuration"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Configurations List */}
      <Space direction="vertical" style={{ width: '100%' }}>
        {configs.map((config) => (
          <Card key={config.id} size="small">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Space direction="vertical" size="small" style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Title level={5} style={{ margin: 0 }}>{config.name}</Title>
                  <Tag color={config.is_active ? "green" : "default"}>
                    {config.is_active ? "Active" : "Inactive"}
                  </Tag>
                </div>
                
                <Space size="large">
                  <Space size="small">
                    <Search className="w-4 h-4" />
                    <Text type="secondary">{config.search_term}</Text>
                  </Space>
                  <Space size="small">
                    <MapPin className="w-4 h-4" />
                    <Text type="secondary">{config.location}</Text>
                  </Space>
                  <Space size="small">
                    <Calendar className="w-4 h-4" />
                    <Text type="secondary">{config.results_wanted} results</Text>
                  </Space>
                </Space>
                
                <Space wrap>
                  {config.is_remote && <Tag color="blue">Remote</Tag>}
                  {config.easy_apply && <Tag color="orange">Easy Apply</Tag>}
                  {config.linkedin_fetch_description && <Tag color="purple">LinkedIn</Tag>}
                  {config.enforce_annual_salary && <Tag color="red">Salary Required</Tag>}
                </Space>
                
                <Space wrap>
                  <Text type="secondary" style={{ fontSize: '12px' }}>Sites:</Text>
                  {(config.sites || []).map((site: string) => (
                    <Tag key={site} color="cyan" style={{ fontSize: '12px' }}>
                      {site}
                    </Tag>
                  ))}
                </Space>
              </Space>
              
              <Space>
                <Button
                  size="small"
                  onClick={() => viewResults(config)}
                  icon={<Eye className="w-4 h-4" />}
                  title="View Job Results"
                />
                <Button
                  size="small"
                  onClick={() => handleToggleActive(config.id, config.is_active)}
                  icon={config.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                />
                <Button
                  size="small"
                  onClick={() => startEdit(config)}
                  icon={<Edit className="w-4 h-4" />}
                />
                <Button
                  size="small"
                  danger
                  onClick={() => handleDelete(config.id)}
                  icon={<Trash2 className="w-4 h-4" />}
                />
              </Space>
            </div>
          </Card>
        ))}
      </Space>

      {configs.length === 0 && (
        <Card>
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <Text type="secondary">
              No scraping configurations found. Create your first configuration to get started.
            </Text>
          </div>
        </Card>
      )}

      {/* Job Results Modal */}
      {viewingResultsId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50" 
            onClick={() => setViewingResultsId(null)}
          />
          
          {/* Modal */}
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Job Results
              </h2>
              <button
                onClick={() => setViewingResultsId(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Content */}
            <div className="overflow-y-auto max-h-[80vh] p-6">
              <JobResults 
                configId={viewingResultsId} 
                configName={configs.find(c => c.id === viewingResultsId)?.name || 'Unknown Configuration'}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
