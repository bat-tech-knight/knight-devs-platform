"use client";

import React from "react";
import { Card, Progress, Tag, Typography, Row, Col, Space, Divider } from "antd";
import { 
  Target, 
  TrendingUp, 
  Search, 
  Heart,
  AlertCircle,
  CheckCircle,
  Lightbulb
} from "lucide-react";

const { Title, Text, Paragraph } = Typography;

interface ATSScoreDisplayProps {
  score: {
    overall_score: number;
    skills_match_score: number;
    experience_match_score: number;
    keyword_match_score: number;
    cultural_fit_score: number;
    detailed_analysis?: {
      skills_analysis?: string;
      experience_analysis?: string;
      keyword_analysis?: string;
      cultural_fit_analysis?: string;
    };
    recommendations?: string[];
    strengths?: string[];
    weaknesses?: string[];
    score_explanation?: string;
  };
  showDetails?: boolean;
  compact?: boolean;
}

export function ATSScoreDisplay({ 
  score, 
  showDetails = true, 
  compact = false 
}: ATSScoreDisplayProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "success";
    if (score >= 80) return "success";
    if (score >= 70) return "warning";
    if (score >= 60) return "warning";
    if (score >= 50) return "processing";
    return "error";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent Match";
    if (score >= 80) return "Very Good Match";
    if (score >= 70) return "Good Match";
    if (score >= 60) return "Moderate Match";
    if (score >= 50) return "Fair Match";
    if (score >= 40) return "Below Average";
    return "Poor Match";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <Target size={16} />;
    if (score >= 60) return <TrendingUp size={16} />;
    if (score >= 40) return <AlertCircle size={16} />;
    return <AlertCircle size={16} />;
  };

  if (compact) {
    return (
      <Tag 
        color={getScoreColor(score.overall_score)}
        icon={getScoreIcon(score.overall_score)}
        style={{ fontSize: '12px', padding: '4px 8px' }}
      >
        {score.overall_score} - {getScoreLabel(score.overall_score)}
      </Tag>
    );
  }

  return (
    <Card 
      title={
        <Space>
          <Target size={20} />
          <span>ATS Compatibility Score</span>
        </Space>
      }
      size="small"
    >
      {/* Overall Score */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <Tag 
          color={getScoreColor(score.overall_score)}
          icon={getScoreIcon(score.overall_score)}
          style={{ fontSize: '16px', padding: '8px 16px', marginBottom: 8 }}
        >
          <Title level={3} style={{ margin: 0, color: 'inherit' }}>
            {score.overall_score}
          </Title>
          <Text style={{ marginLeft: 8 }}>{getScoreLabel(score.overall_score)}</Text>
        </Tag>
        {score.score_explanation && (
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {score.score_explanation}
          </Text>
        )}
      </div>

      {/* Score Breakdown */}
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space>
              <Search size={16} color="#1890ff" />
              <Text strong>Skills Match</Text>
            </Space>
            <Progress 
              percent={score.skills_match_score} 
              size="small"
              strokeColor="#1890ff"
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {score.skills_match_score}/100
            </Text>
          </Space>
        </Col>

        <Col span={12}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space>
              <TrendingUp size={16} color="#52c41a" />
              <Text strong>Experience</Text>
            </Space>
            <Progress 
              percent={score.experience_match_score} 
              size="small"
              strokeColor="#52c41a"
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {score.experience_match_score}/100
            </Text>
          </Space>
        </Col>

        <Col span={12}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space>
              <Search size={16} color="#722ed1" />
              <Text strong>Keywords</Text>
            </Space>
            <Progress 
              percent={score.keyword_match_score} 
              size="small"
              strokeColor="#722ed1"
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {score.keyword_match_score}/100
            </Text>
          </Space>
        </Col>

        <Col span={12}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space>
              <Heart size={16} color="#eb2f96" />
              <Text strong>Cultural Fit</Text>
            </Space>
            <Progress 
              percent={score.cultural_fit_score} 
              size="small"
              strokeColor="#eb2f96"
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {score.cultural_fit_score}/100
            </Text>
          </Space>
        </Col>
      </Row>

      {showDetails && (
        <>
          <Divider />

          {/* Strengths */}
          {score.strengths && score.strengths.length > 0 && (
            <Space direction="vertical" size="small" style={{ width: '100%', marginBottom: 16 }}>
              <Space>
                <CheckCircle size={16} color="#52c41a" />
                <Text strong>Strengths</Text>
              </Space>
              <Space wrap>
                {score.strengths.map((strength, index) => (
                  <Tag key={index} color="green" style={{ fontSize: '11px' }}>
                    {strength}
                  </Tag>
                ))}
              </Space>
            </Space>
          )}

          {/* Weaknesses */}
          {score.weaknesses && score.weaknesses.length > 0 && (
            <Space direction="vertical" size="small" style={{ width: '100%', marginBottom: 16 }}>
              <Space>
                <AlertCircle size={16} color="#fa8c16" />
                <Text strong>Areas for Improvement</Text>
              </Space>
              <Space wrap>
                {score.weaknesses.map((weakness, index) => (
                  <Tag key={index} color="orange" style={{ fontSize: '11px' }}>
                    {weakness}
                  </Tag>
                ))}
              </Space>
            </Space>
          )}

          {/* Recommendations */}
          {score.recommendations && score.recommendations.length > 0 && (
            <Space direction="vertical" size="small" style={{ width: '100%', marginBottom: 16 }}>
              <Space>
                <Lightbulb size={16} color="#faad14" />
                <Text strong>Recommendations</Text>
              </Space>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                {score.recommendations.map((recommendation, index) => (
                  <Text key={index} style={{ fontSize: '12px', color: '#666' }}>
                    • {recommendation}
                  </Text>
                ))}
              </Space>
            </Space>
          )}

          {/* Detailed Analysis */}
          {score.detailed_analysis && (
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>Detailed Analysis</Text>
              
              {score.detailed_analysis.skills_analysis && (
                <div>
                  <Text type="secondary" style={{ fontSize: '12px', color: '#1890ff' }}>
                    Skills Analysis:
                  </Text>
                  <Paragraph style={{ fontSize: '12px', margin: '4px 0' }}>
                    {score.detailed_analysis.skills_analysis}
                  </Paragraph>
                </div>
              )}
              
              {score.detailed_analysis.experience_analysis && (
                <div>
                  <Text type="secondary" style={{ fontSize: '12px', color: '#52c41a' }}>
                    Experience Analysis:
                  </Text>
                  <Paragraph style={{ fontSize: '12px', margin: '4px 0' }}>
                    {score.detailed_analysis.experience_analysis}
                  </Paragraph>
                </div>
              )}
              
              {score.detailed_analysis.keyword_analysis && (
                <div>
                  <Text type="secondary" style={{ fontSize: '12px', color: '#722ed1' }}>
                    Keyword Analysis:
                  </Text>
                  <Paragraph style={{ fontSize: '12px', margin: '4px 0' }}>
                    {score.detailed_analysis.keyword_analysis}
                  </Paragraph>
                </div>
              )}
              
              {score.detailed_analysis.cultural_fit_analysis && (
                <div>
                  <Text type="secondary" style={{ fontSize: '12px', color: '#eb2f96' }}>
                    Cultural Fit Analysis:
                  </Text>
                  <Paragraph style={{ fontSize: '12px', margin: '4px 0' }}>
                    {score.detailed_analysis.cultural_fit_analysis}
                  </Paragraph>
                </div>
              )}
            </Space>
          )}
        </>
      )}
    </Card>
  );
}