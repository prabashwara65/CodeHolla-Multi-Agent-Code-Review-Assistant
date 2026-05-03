// src/types/index.ts

export interface Finding {
  category: string;
  line: number;
  severity: string;
  message: string;
  suggestion: string;
  agent: string;
}

export interface Summary {
  style_score: number;
  logic_score: number;
  security_risk: string;
  total_findings: number;
  high_severity_count: number;
}

export interface Report {
  filename: string;
  review_date: string;
  overall_status: string;
  summary: Summary;
  findings: Finding[];
  recommendations: string[];
}

export interface ReviewPlan {
  style_review: boolean;
  logic_review: boolean;
  security_review: boolean;
}

export interface ReviewResponse {
  success: boolean;
  report: Report;
  plan: ReviewPlan;
  session_id: string;
  report_path?: string;
  execution_log?: string[];
  error?: string;
}
